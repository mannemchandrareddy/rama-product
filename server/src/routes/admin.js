const router = require('express').Router();
const User = require('../models/User');
const Merchant = require('../models/Merchant');
const Store = require('../models/Store');
const Product = require('../models/Product');
const ProductListing = require('../models/ProductListing');
const Report = require('../models/Report');
const { authenticate, requireRole } = require('../middleware/auth');

// GET /api/v1/admin/stats — Platform statistics (admin)
router.get('/stats', authenticate, requireRole(['ADMIN']), async (_req, res) => {
  try {
    const [
      totalUsers,
      totalCustomers,
      totalMerchants,
      totalStores,
      pendingStores,
      approvedStores,
      totalProducts,
      activeListings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'CUSTOMER' }),
      Merchant.countDocuments(),
      Store.countDocuments(),
      Store.countDocuments({ approval_status: 'PENDING' }),
      Store.countDocuments({ approval_status: 'APPROVED' }),
      Product.countDocuments({ is_active: true }),
      ProductListing.countDocuments({ is_active: true }),
    ]);

    // Report stats
    const reportAgg = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const reportStats = { open: 0, reviewing: 0, resolved: 0, dismissed: 0, total: 0 };
    reportAgg.forEach(s => {
      const key = s._id.toLowerCase();
      reportStats[key] = s.count;
      reportStats.total += s.count;
    });

    res.json({
      success: true,
      data: {
        users: { total: totalUsers, customers: totalCustomers, merchants: totalMerchants },
        stores: { total: totalStores, pending: pendingStores, approved: approvedStores },
        products: totalProducts,
        active_listings: activeListings,
        reports: reportStats,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'STATS_ERROR', message: err.message } });
  }
});

module.exports = router;
