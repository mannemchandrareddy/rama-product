const router = require('express').Router();
const Merchant = require('../models/Merchant');
const { authenticate, requireRole } = require('../middleware/auth');
const { toJSON } = require('../utils/serialize');

const User = require('../models/User');

// POST /api/v1/merchants/profile
router.post('/profile', authenticate, requireRole(['MERCHANT']), async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    let merchant = await Merchant.findOne({ user_id: userId });
    
    // Check fallback by email
    if (!merchant && req.user.email) {
      const user = await User.findOne({ email: req.user.email });
      if (user) {
        merchant = await Merchant.findOne({ user_id: user._id });
      }
    }

    if (merchant) {
      if (req.body.business_name) {
        merchant.business_name = req.body.business_name;
        await merchant.save();
      }
      return res.json({ success: true, data: toJSON(merchant) });
    }

    const businessName = req.body.business_name || `${req.user.name || 'Merchant'}'s Store`;
    merchant = await Merchant.create({ user_id: userId, business_name: businessName });
    res.json({ success: true, data: toJSON(merchant) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message: err.message } });
  }
});

// GET /api/v1/merchants/me
router.get('/me', authenticate, requireRole(['MERCHANT']), async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    let merchant = await Merchant.findOne({ user_id: userId });

    // Fallback search by email
    if (!merchant && req.user.email) {
      const user = await User.findOne({ email: req.user.email });
      if (user) {
        merchant = await Merchant.findOne({ user_id: user._id });
      }
    }

    // Auto-create merchant profile if user has MERCHANT role
    if (!merchant) {
      const userName = req.user.user_metadata?.name || req.user.name || 'Merchant';
      merchant = await Merchant.create({
        user_id: userId,
        business_name: `${userName}'s Store`,
      });
    }

    res.json({ success: true, data: toJSON(merchant) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'GET_ERROR', message: err.message } });
  }
});

// PUT /api/v1/merchants/me
router.put('/me', authenticate, requireRole(['MERCHANT']), async (req, res) => {
  try {
    const userId = req.user.sub || req.user.id;
    const updateData = {};
    if (req.body.business_name !== undefined) updateData.business_name = req.body.business_name;

    let merchant = await Merchant.findOneAndUpdate(
      { user_id: userId },
      updateData,
      { new: true }
    );

    if (!merchant && req.user.email) {
      const user = await User.findOne({ email: req.user.email });
      if (user) {
        merchant = await Merchant.findOneAndUpdate(
          { user_id: user._id },
          updateData,
          { new: true }
        );
      }
    }

    if (!merchant) {
      merchant = await Merchant.create({
        user_id: userId,
        business_name: req.body.business_name || 'My Store',
      });
    }

    res.json({ success: true, data: toJSON(merchant) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message: err.message } });
  }
});

// GET /api/v1/merchants — List all (admin)
router.get('/', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));

    const total = await Merchant.countDocuments();
    const merchants = await Merchant.find()
      .populate('user_id')
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      success: true,
      data: merchants.map(toJSON),
      pagination: { page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) || 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_ERROR', message: err.message } });
  }
});

module.exports = router;
