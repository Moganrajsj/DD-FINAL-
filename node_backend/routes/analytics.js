const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

/**
 * @route GET /api/analytics/velocity
 * Live Market Velocity - Optimized mock for UI performance with slight random variation.
 */
router.get('/velocity', (req, res) => {
  try {
    const baseVelocity = [45, 52, 48, 65, 72, 68, 85, 92, 88, 75, 62, 58];
    const results = baseVelocity.map(v => {
      const jitter = Math.floor(Math.random() * 11) - 5; // -5 to +5
      return Math.min(100, Math.max(10, v + jitter));
    });
    res.json(results);
  } catch (error) {
    console.error('[Analytics Velocity Error]', error);
    res.status(500).json(Array(12).fill(50));
  }
});

/**
 * @route POST /api/analytics/track
 * Logs frontend telemetry. Returns 200 to prevent 404s.
 */
router.post('/track', (req, res) => {
  // Can be extended to save the tracking data to Prisma later.
  res.status(200).json({ status: 'ok' });
});

module.exports = router;
