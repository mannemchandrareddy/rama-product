const router = require('express').Router();
const mongoose = require('mongoose');

router.get('/health', async (_req, res) => {
  let dbStatus = 'healthy';
  try {
    if (mongoose.connection.readyState !== 1) {
      dbStatus = 'unhealthy';
    }
  } catch {
    dbStatus = 'unhealthy';
  }

  res.json({
    status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
    version: process.env.APP_VERSION || '1.0.0',
    database: dbStatus,
  });
});

module.exports = router;
