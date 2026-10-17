const router = require('express').Router();
const Product = require('../models/Product');
const ProductListing = require('../models/ProductListing');
const Store = require('../models/Store');
const Event = require('../models/Event');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const { toJSON } = require('../utils/serialize');
const { haversineDistance } = require('../utils/geo');

// GET /api/v1/products — List products (public)


router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
    const { category_id, search } = req.query;

    const filter = { is_active: true };
    if (category_id) filter.category_id = category_id;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { brand: regex },
        { model: regex },
        { search_keywords: regex },
      ];
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category_id')
      .sort({ name: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const data = products.map(p => {
      const item = toJSON(p);
      item.category_name = p.category_id ? p.category_id.name : null;
      // Flatten category_id to just the ID string
      item.category_id = p.category_id ? p.category_id._id.toString() : null;
      return item;
    });

    res.json({
      success: true,
      data,
      pagination: { page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) || 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_ERROR', message: err.message } });
  }
});

// GET /api/v1/products/:product_id — Product detail with listings


router.get('/:product_id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.product_id).populate('category_id');
    if (!product) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    }

    const productData = toJSON(product);
    productData.category_name = product.category_id ? product.category_id.name : null;
    productData.category_id = product.category_id ? product.category_id._id.toString() : null;

    const { latitude, longitude } = req.query;

    // Get active listings from approved stores


    const listings = await ProductListing.find({
      product_id: product._id,
      is_active: true,
    }).populate('store_id');

    const enrichedListings = listings
      .filter(l => l.store_id && l.store_id.is_active && l.store_id.approval_status === 'APPROVED')
      .map(listing => {
        const distance = (latitude && longitude && listing.store_id.latitude && listing.store_id.longitude)
          ? haversineDistance(parseFloat(latitude), parseFloat(longitude), listing.store_id.latitude, listing.store_id.longitude)
          : null;

        const openTime = listing.store_id.opening_time || '07:00';
        const closeTime = listing.store_id.closing_time || '22:30';

        const item = {
          listing_id: listing._id.toString(),
          store_id: listing.store_id._id.toString(),
          store_name: listing.store_id.name,
          store_phone: listing.store_id.phone,
          store_whatsapp: listing.store_id.whatsapp_number || listing.store_id.phone,
          store_rating: listing.store_id.rating || 4.7,
          store_rating_count: listing.store_id.rating_count || 48,
          store_opening_time: openTime,
          store_closing_time: closeTime,
          store_city: listing.store_id.city,
          store_address: listing.store_id.address,
          store_latitude: listing.store_id.latitude,
          store_longitude: listing.store_id.longitude,
          price: listing.price,
          mrp: listing.mrp || (listing.price ? Math.round(listing.price * 1.15) : null),
          stock_status: listing.stock_status,
          listing_image_url: listing.image_url || product.image_url || null,
          last_updated: listing.last_updated,
          distance_km: distance,
          drive_time_mins: distance ? Math.max(2, Math.round(distance * 3)) : null,
          walk_time_mins: distance ? Math.max(3, Math.round(distance * 12)) : null,
        };
        return item;
      })
      .sort((a, b) => a.price - b.price);

    // Log view


    const userId = req.user ? req.user.sub : null;
    Event.create({ event_type: 'PRODUCT_VIEWED', user_id: userId, product_id: product._id }).catch(() => {});

    res.json({
      success: true,
      data: { ...productData, listings: enrichedListings, total_listings: enrichedListings.length },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'GET_ERROR', message: err.message } });
  }
});

// POST /api/v1/products — Create product (admin)


router.post('/', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.json({ success: true, data: toJSON(product) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message: err.message } });
  }
});

// PUT /api/v1/products/:product_id — Update product (admin)


router.put('/:product_id', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.product_id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    }
    res.json({ success: true, data: toJSON(product) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message: err.message } });
  }
});

module.exports = router;
