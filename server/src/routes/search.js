const router = require('express').Router();
const ProductListing = require('../models/ProductListing');
const Product = require('../models/Product');
const Store = require('../models/Store');
const Category = require('../models/Category');
const Event = require('../models/Event');
const { optionalAuth } = require('../middleware/auth');
const { haversineDistance } = require('../utils/geo');

// GET /api/v1/search — Search product listings across stores


router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
    const { q, category_id, brand, min_price, max_price, in_stock, latitude, longitude, radius_km, sort_by } = req.query;

    // Build product filter


    const productFilter = { is_active: true };
    if (q) {
      const regex = new RegExp(q, 'i');
      productFilter.$or = [
        { name: regex },
        { brand: regex },
        { model: regex },
        { search_keywords: regex },
      ];
    }
    if (category_id) productFilter.category_id = category_id;
    if (brand) productFilter.brand = new RegExp(brand, 'i');

    // Get matching product IDs

    const matchingProducts = await Product.find(productFilter).select('_id');
    const productIds = matchingProducts.map(p => p._id);

    // Get approved store IDs

    const approvedStores = await Store.find({ is_active: true, approval_status: 'APPROVED' }).select('_id latitude longitude name phone city');
    const storeMap = {};
    approvedStores.forEach(s => { storeMap[s._id.toString()] = s; });
    const storeIds = approvedStores.map(s => s._id);

    // Build listing filter
    
    const listingFilter = {
      is_active: true,
      product_id: { $in: productIds },
      store_id: { $in: storeIds },
    };
    if (min_price) listingFilter.price = { ...listingFilter.price, $gte: parseFloat(min_price) };
    if (max_price) listingFilter.price = { ...listingFilter.price, $lte: parseFloat(max_price) };
    if (in_stock === 'true') {
      listingFilter.stock_status = { $in: ['IN_STOCK', 'LIMITED'] };
    }

    const total = await ProductListing.countDocuments(listingFilter);

    // Sorting
    let sortObj = { price: 1 };
    if (sort_by === 'price_asc') sortObj = { price: 1 };
    else if (sort_by === 'price_desc') sortObj = { price: -1 };
    else if (sort_by === 'updated') sortObj = { last_updated: -1 };

    const listings = await ProductListing.find(listingFilter)
      .populate('product_id')
      .populate('store_id')
      .sort(sortObj)
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    // Get category names
    const categoryIds = [...new Set(listings.map(l => l.product_id?.category_id).filter(Boolean))];
    const categories = await Category.find({ _id: { $in: categoryIds } });
    const catMap = {};
    categories.forEach(c => { catMap[c._id.toString()] = c.name; });

    let items = listings.map(listing => {
      const product = listing.product_id;
      const store = listing.store_id;
      if (!product || !store) return null;

      let distance = null;
      let drive_time_mins = null;
      let walk_time_mins = null;
      if (latitude && longitude && store.latitude && store.longitude) {
        distance = haversineDistance(
          parseFloat(latitude), parseFloat(longitude),
          store.latitude, store.longitude
        );
        if (radius_km && distance > parseFloat(radius_km)) return null;
        drive_time_mins = Math.max(2, Math.round((distance / 25) * 60));
        walk_time_mins = Math.max(1, Math.round((distance / 4.5) * 60));
      }

      return {
        product_id: product._id.toString(),
        product_name: product.name,
        product_brand: product.brand,
        product_model: product.model,
        product_image_url: listing.image_url || product.image_url || null,
        category_name: product.category_id ? catMap[product.category_id.toString()] || null : null,
        listing_id: listing._id.toString(),
        store_id: store._id.toString(),
        store_name: store.name,
        store_phone: store.phone,
        store_whatsapp: store.whatsapp_number || store.phone,
        store_rating: store.rating || 4.7,
        store_rating_count: store.rating_count || 48,
        store_city: store.city,
        price: listing.price,
        mrp: listing.mrp || (listing.price ? Math.round(listing.price * 1.15) : null),
        stock_status: listing.stock_status,
        distance_km: distance,
        drive_time_mins,
        walk_time_mins,
        last_updated: listing.last_updated,
      };
    }).filter(Boolean);

    // Sort by distance if requested
    if (sort_by === 'distance' && latitude && longitude) {
      items.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
    }

    // Log search event
    if (q) {
      const userId = req.user ? req.user.sub : null;
      Event.create({
        event_type: 'PRODUCT_SEARCHED', user_id: userId,
        search_query: q, metadata_json: { results_count: items.length, total },
      }).catch(() => {});
    }

    res.json({
      success: true,
      data: items,
      pagination: { page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) || 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SEARCH_ERROR', message: err.message } });
  }
});

// GET /api/v1/search/suggestions — Instant Predictive Search
router.get('/suggestions', async (req, res) => {
  try {
    const q = req.query.q;
    if (!q || q.length < 1) {
      return res.json({ success: true, data: [] });
    }

    const regex = new RegExp(q, 'i');
    const products = await Product.find({
      is_active: true,
      $or: [{ name: regex }, { brand: regex }, { model: regex }, { search_keywords: regex }],
    })
      .select('name brand image_url category_id')
      .populate('category_id')
      .limit(8);

    const productIds = products.map(p => p._id);
    const listings = await ProductListing.find({
      product_id: { $in: productIds },
      is_active: true,
    }).select('product_id price image_url');

    const priceMap = {};
    const imgMap = {};
    listings.forEach(l => {
      const pid = l.product_id.toString();
      if (!priceMap[pid] || l.price < priceMap[pid]) {
        priceMap[pid] = l.price;
      }
      if (l.image_url && !imgMap[pid]) {
        imgMap[pid] = l.image_url;
      }
    });

    const enriched = products.map(p => ({
      id: p._id.toString(),
      name: p.name,
      brand: p.brand,
      image_url: imgMap[p._id.toString()] || p.image_url || null,
      category_name: p.category_id ? p.category_id.name : null,
      lowest_price: priceMap[p._id.toString()] || null,
    }));

    res.json({
      success: true,
      data: enriched,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SUGGEST_ERROR', message: err.message } });
  }
});

module.exports = router;
