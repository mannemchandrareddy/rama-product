const router = require('express').Router();
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');
const { toJSON } = require('../utils/serialize');

// GET /api/v1/users — List all users (admin only)
router.get('/', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
    const { role } = req.query;

    const filter = {};
    if (role) filter.role = role;

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      success: true,
      data: users.map(toJSON),
      pagination: { page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) || 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_ERROR', message: err.message } });
  }
});

// GET /api/v1/users/:user_id
router.get('/:user_id', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const user = await User.findById(req.params.user_id);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    res.json({ success: true, data: toJSON(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'GET_ERROR', message: err.message } });
  }
});

// PUT /api/v1/users/:user_id/toggle-active
router.put('/:user_id/toggle-active', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const user = await User.findById(req.params.user_id);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    }
    user.is_active = !user.is_active;
    await user.save();
    res.json({ success: true, data: toJSON(user) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'TOGGLE_ERROR', message: err.message } });
  }
});

module.exports = router;
