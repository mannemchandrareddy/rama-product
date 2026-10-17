const router = require('express').Router();
const Category = require('../models/Category');
const { authenticate, requireRole } = require('../middleware/auth');
const { toJSON } = require('../utils/serialize');

// GET /api/v1/categories — List active categories (public)
router.get('/', async (_req, res) => {
  try {
    const categories = await Category.find({ is_active: { $ne: false } }).sort({ name: 1 });
    res.json({ success: true, data: categories.map(toJSON) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_ERROR', message: err.message } });
  }
});

// GET /api/v1/categories/all — All categories (admin)
router.get('/all', authenticate, requireRole(['ADMIN']), async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, data: categories.map(toJSON) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_ERROR', message: err.message } });
  }
});

// POST /api/v1/categories — Create (admin)
router.post('/', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const existing = await Category.findOne({ slug: req.body.slug });
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Category with this slug already exists' } });
    }
    const category = await Category.create(req.body);
    res.json({ success: true, data: toJSON(category) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message: err.message } });
  }
});

// PUT /api/v1/categories/:category_id — Update (admin)
router.put('/:category_id', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.category_id, req.body, { new: true });
    if (!category) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
    }
    res.json({ success: true, data: toJSON(category) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message: err.message } });
  }
});

module.exports = router;
