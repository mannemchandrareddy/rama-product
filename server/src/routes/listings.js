const router = require('express').Router();
const ProductListing = require('../models/ProductListing');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Merchant = require('../models/Merchant');
const Event = require('../models/Event');
const { authenticate, requireRole } = require('../middleware/auth');
const { toJSON } = require('../utils/serialize');

const User = require('../models/User');

async function getMerchantForUser(reqUser) {
  const userId = reqUser.sub || reqUser.id;
  let merchant = await Merchant.findOne({ user_id: userId });
  if (!merchant && reqUser.email) {
    const user = await User.findOne({ email: reqUser.email });
    if (user) merchant = await Merchant.findOne({ user_id: user._id });
  }
  if (!merchant) {
    merchant = await Merchant.create({
      user_id: userId,
      business_name: `${reqUser.user_metadata?.name || reqUser.name || 'Merchant'}'s Store`,
    });
  }
  return merchant;
}

// POST /api/v1/listings — Create listing (merchant, must own store)
router.post('/', authenticate, requireRole(['MERCHANT']), async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const { store_id, product_id, price, stock_status, image_url } = req.body;

    // Verify merchant owns the store
    const merchant = await getMerchantForUser(req.user);
    const store = await Store.findOne({ _id: store_id, merchant_id: merchant._id });
    if (!store) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only add listings to your own store' } });
    }

    // Verify product exists
    const product = await Product.findOne({ _id: product_id, is_active: { $ne: false } });
    if (!product) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    }

    // If listing provides image and product doesn't have one, update product
    if (image_url && !product.image_url) {
      product.image_url = image_url;
      await product.save().catch(() => {});
    }

    // Check duplicate
    const existing = await ProductListing.findOne({ store_id, product_id, is_active: true });
    if (existing) {
      return res.status(400).json({ success: false, error: { code: 'DUPLICATE', message: 'This product is already listed in this store' } });
    }

    const listing = await ProductListing.create({
      store_id, product_id, price,
      stock_status: stock_status || 'IN_STOCK',
      image_url: image_url || null,
      last_updated: new Date(),
    });

    Event.create({
      event_type: 'PRODUCT_LISTED', user_id: userId,
      product_id, store_id, listing_id: listing._id,
    }).catch(() => {});

    res.json({ success: true, data: toJSON(listing) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message: err.message } });
  }
});

// PUT /api/v1/listings/:listing_id — Update listing (merchant owner)
router.put('/:listing_id', authenticate, requireRole(['MERCHANT']), async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const listing = await ProductListing.findById(req.params.listing_id).populate({
      path: 'store_id',
      populate: { path: 'merchant_id' },
    });
    if (!listing) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Listing not found' } });
    }

    const merchant = await getMerchantForUser(req.user);
    const storeMerchantId = listing.store_id?.merchant_id?._id?.toString() || listing.store_id?.merchant_id?.toString();
    const isOwner = (listing.store_id?.merchant_id?.user_id === userId) || (merchant && storeMerchantId === merchant._id.toString());
    if (!isOwner) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only modify your own listings' } });
    }

    const updateData = {};
    if (req.body.price !== undefined) updateData.price = req.body.price;
    if (req.body.stock_status !== undefined) updateData.stock_status = req.body.stock_status;
    if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active;
    if (req.body.image_url !== undefined) updateData.image_url = req.body.image_url;
    updateData.last_updated = new Date();

    const updated = await ProductListing.findByIdAndUpdate(req.params.listing_id, updateData, { new: true });

    if (req.body.price !== undefined) {
      Event.create({ event_type: 'PRICE_UPDATED', user_id: userId, listing_id: listing._id, metadata_json: { new_price: req.body.price } }).catch(() => {});
    }
    if (req.body.stock_status !== undefined) {
      Event.create({ event_type: 'STOCK_UPDATED', user_id: userId, listing_id: listing._id, metadata_json: { new_status: req.body.stock_status } }).catch(() => {});
    }

    res.json({ success: true, data: toJSON(updated) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message: err.message } });
  }
});

// GET /api/v1/listings/my — Merchant's listings
router.get('/my', authenticate, requireRole(['MERCHANT']), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 50));
    const userId = req.user.sub || req.user.id;

    let merchant = await Merchant.findOne({ user_id: userId });
    if (!merchant && req.user.email) {
      const user = await User.findOne({ email: req.user.email });
      if (user) merchant = await Merchant.findOne({ user_id: user._id });
    }
    if (!merchant) {
      return res.json({ success: true, data: [], pagination: { page, page_size: pageSize, total: 0, total_pages: 0 } });
    }

    const stores = await Store.find({ merchant_id: merchant._id });
    const storeIds = stores.map(s => s._id);

    const total = await ProductListing.countDocuments({ store_id: { $in: storeIds } });
    const listings = await ProductListing.find({ store_id: { $in: storeIds } })
      .populate('product_id')
      .populate('store_id')
      .sort({ last_updated: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const data = listings.map(l => {
      const item = toJSON(l);
      item.product_name = l.product_id ? l.product_id.name : null;
      item.product_brand = l.product_id ? l.product_id.brand : null;
      item.product_image_url = l.image_url || (l.product_id ? l.product_id.image_url : null);
      item.image_url = l.image_url || (l.product_id ? l.product_id.image_url : null);
      item.store_name = l.store_id ? l.store_id.name : null;
      item.product_id = l.product_id ? l.product_id._id.toString() : null;
      item.store_id = l.store_id ? l.store_id._id.toString() : null;
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

// GET /api/v1/listings — List all (admin)
router.get('/', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
    const { store_id, product_id } = req.query;

    const filter = {};
    if (store_id) filter.store_id = store_id;
    if (product_id) filter.product_id = product_id;

    const total = await ProductListing.countDocuments(filter);
    const listings = await ProductListing.find(filter)
      .populate('product_id')
      .populate('store_id')
      .sort({ last_updated: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const data = listings.map(l => {
      const item = toJSON(l);
      item.product_name = l.product_id ? l.product_id.name : null;
      item.product_brand = l.product_id ? l.product_id.brand : null;
      item.product_image_url = l.image_url || (l.product_id ? l.product_id.image_url : null);
      item.image_url = l.image_url || (l.product_id ? l.product_id.image_url : null);
      item.store_name = l.store_id ? l.store_id.name : null;
      item.product_id = l.product_id ? l.product_id._id.toString() : null;
      item.store_id = l.store_id ? l.store_id._id.toString() : null;
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

module.exports = router;
