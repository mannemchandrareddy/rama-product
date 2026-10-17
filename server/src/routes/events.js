const router = require('express').Router();
const Event = require('../models/Event');
const { optionalAuth, authenticate, requireRole } = require('../middleware/auth');
const { toJSON } = require('../utils/serialize');

// POST /api/v1/events — Log a client-side event
router.post('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user ? req.user.sub : null;
    await Event.create({ user_id: userId, ...req.body });
    res.json({ success: true, data: null });
  } catch (err) {
    // Non-critical — don't fail the request
    console.error('Event log error:', err.message);
    res.json({ success: true, data: null });
  }
});

// GET /api/v1/events/stats — Event statistics (admin)
router.get('/stats', authenticate, requireRole(['ADMIN']), async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30));
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const counts = await Event.aggregate([
      { $match: { created_at: { $gte: cutoff } } },
      { $group: { _id: '$event_type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const byType = {};
    let total = 0;
    counts.forEach(c => {
      byType[c._id] = c.count;
      total += c.count;
    });

    res.json({
      success: true,
      data: { total, by_type: byType, period_days: days },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'STATS_ERROR', message: err.message } });
  }
});

module.exports = router;
