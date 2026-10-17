const router = require('express').Router();
const Store = require('../models/Store');
const Merchant = require('../models/Merchant');
const ProductListing = require('../models/ProductListing');
const Event = require('../models/Event');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');
const { toJSON } = require('../utils/serialize');
const { haversineDistance } = require('../utils/geo');

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

// POST /api/v1/stores — Create a store (merchant only)
router.post('/', authenticate, requireRole(['MERCHANT']), async (req, res) => {
  try {
    const merchant = await getMerchantForUser(req.user);

    const storeData = { merchant_id: merchant._id, ...req.body };
    delete storeData.approval_status; // prevent override
    const store = await Store.create(storeData);

    // Log event
    Event.create({ event_type: 'STORE_CREATED', user_id: req.user.sub || req.user.id, store_id: store._id }).catch(() => {});

    res.json({ success: true, data: toJSON(store) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message: err.message } });
  }
});

// GET /api/v1/stores/my — Merchant's own stores
router.get('/my', authenticate, requireRole(['MERCHANT']), async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    let merchant = await Merchant.findOne({ user_id: userId });
    if (!merchant && req.user.email) {
      const user = await User.findOne({ email: req.user.email });
      if (user) merchant = await Merchant.findOne({ user_id: user._id });
    }
    if (!merchant) {
      return res.json({ success: true, data: [] });
    }
    const stores = await Store.find({ merchant_id: merchant._id }).sort({ created_at: -1 });
    res.json({ success: true, data: stores.map(toJSON) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_ERROR', message: err.message } });
  }
});

// GET /api/v1/stores/:store_id — Public store detail
router.get('/:store_id', optionalAuth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.store_id).populate('merchant_id');
    if (!store) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Store not found' } });
    }

    const storeData = toJSON(store);
    const { latitude, longitude } = req.query;

    if (latitude && longitude && store.latitude && store.longitude) {
      storeData.distance_km = haversineDistance(
        parseFloat(latitude), parseFloat(longitude),
        store.latitude, store.longitude
      );
      storeData.drive_time_mins = Math.max(2, Math.round(storeData.distance_km * 3));
      storeData.walk_time_mins = Math.max(3, Math.round(storeData.distance_km * 12));
    }

    storeData.rating = store.rating || 4.7;
    storeData.rating_count = store.rating_count || 48;
    storeData.opening_time = store.opening_time || '07:00';
    storeData.closing_time = store.closing_time || '22:30';
    storeData.whatsapp_number = store.whatsapp_number || store.phone;

    // Get store listings
    const listings = await ProductListing.find({ store_id: store._id, is_active: true })
      .populate('product_id')
      .sort({ last_updated: -1 });

    const listingsData = listings.map(listing => ({
      id: listing._id.toString(),
      product_id: listing.product_id ? listing.product_id._id.toString() : null,
      product_name: listing.product_id ? listing.product_id.name : null,
      product_brand: listing.product_id ? listing.product_id.brand : null,
      product_image_url: listing.image_url || (listing.product_id ? listing.product_id.image_url : null),
      price: listing.price,
      mrp: listing.mrp || (listing.price ? Math.round(listing.price * 1.15) : null),
      stock_status: listing.stock_status,
      last_updated: listing.last_updated,
    }));

    // Log view
    const userId = req.user ? req.user.sub : null;
    Event.create({ event_type: 'STORE_VIEWED', user_id: userId, store_id: store._id }).catch(() => {});

    res.json({
      success: true,
      data: { ...storeData, listings: listingsData, total_listings: listings.length },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'GET_ERROR', message: err.message } });
  }
});

// PUT /api/v1/stores/:store_id — Update a store (merchant owner)
router.put('/:store_id', authenticate, requireRole(['MERCHANT']), async (req, res) => {
  try {
    const merchant = await getMerchantForUser(req.user);

    const store = await Store.findById(req.params.store_id);
    if (!store) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Store not found' } });
    }
    if (store.merchant_id.toString() !== merchant._id.toString()) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only modify your own store' } });
    }

    const updateData = { ...req.body };
    delete updateData.approval_status;
    delete updateData.merchant_id;

    const updated = await Store.findByIdAndUpdate(req.params.store_id, updateData, { new: true });
    res.json({ success: true, data: toJSON(updated) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message: err.message } });
  }
});

// PUT /api/v1/stores/:store_id/approval — Admin approve/reject
router.put('/:store_id/approval', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { approval_status } = req.body;
    const store = await Store.findByIdAndUpdate(
      req.params.store_id,
      { approval_status },
      { new: true }
    );
    if (!store) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Store not found' } });
    }
    if (approval_status === 'APPROVED') {
      Event.create({ event_type: 'STORE_APPROVED', store_id: store._id }).catch(() => {});
    }
    res.json({ success: true, data: toJSON(store) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'APPROVAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/stores — List stores (public: approved, admin: all)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
    const { approval_status, latitude, longitude } = req.query;

    const filter = {};
    const isAdmin = req.user && req.user.role === 'ADMIN';

    if (approval_status && approval_status !== 'ALL') {
      filter.approval_status = approval_status;
    } else if (!isAdmin && !approval_status) {
      filter.approval_status = 'APPROVED';
    }

    const total = await Store.countDocuments(filter);
    const stores = await Store.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const data = stores.map(store => {
      const s = toJSON(store);
      s.distance_km = null;
      if (latitude && longitude && store.latitude && store.longitude) {
        s.distance_km = haversineDistance(
          parseFloat(latitude), parseFloat(longitude),
          store.latitude, store.longitude
        );
      }
      return s;
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
