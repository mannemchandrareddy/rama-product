const router = require('express').Router();
const Report = require('../models/Report');
const Event = require('../models/Event');
const { authenticate, requireRole } = require('../middleware/auth');
const { toJSON } = require('../utils/serialize');

// POST /api/v1/reports — Submit a report


router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.sub;
    const report = await Report.create({ user_id: userId, ...req.body });

    Event.create({
      event_type: 'REPORT_CREATED', user_id: userId,
      store_id: req.body.store_id, product_id: req.body.product_id,
    }).catch(() => {});

    res.json({ success: true, data: toJSON(report) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'CREATE_ERROR', message: err.message } });
  }
});

// GET /api/v1/reports — List reports (admin)


router.get('/', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.page_size) || 20));
    const { status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .sort({ created_at: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    res.json({
      success: true,
      data: reports.map(toJSON),
      pagination: { page, page_size: pageSize, total, total_pages: Math.ceil(total / pageSize) || 0 },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_ERROR', message: err.message } });
  }
});

// PUT /api/v1/reports/:report_id/status — Update status (admin)


router.put('/:report_id/status', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.report_id,
      { status: req.body.status },
      { new: true }
    );
    if (!report) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Report not found' } });
    }
    res.json({ success: true, data: toJSON(report) });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_ERROR', message: err.message } });
  }
});

// GET /api/v1/reports/stats — Report statistics (admin)


router.get('/stats', authenticate, requireRole(['ADMIN']), async (_req, res) => {
  try {
    const stats = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const result = { open: 0, reviewing: 0, resolved: 0, dismissed: 0, total: 0 };
    stats.forEach(s => {
      const key = s._id.toLowerCase();
      result[key] = s.count;
      result.total += s.count;
    });

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'STATS_ERROR', message: err.message } });
  }
});

module.exports = router;
