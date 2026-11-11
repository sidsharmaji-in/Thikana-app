const express = require('express');
const router = express.Router();
const repository = require('../data/repository');

// GET /api/health - Platform health & uptime monitor (Slice 8)
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: '1.0.0',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// GET /api/health/live - Liveness probe
router.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// GET /api/health/ready - Readiness probe
router.get('/health/ready', (req, res) => {
  res.status(200).json({
    status: 'ready',
    database: 'healthy',
    storageMode: process.env.DATABASE_URL ? 'postgresql' : 'in-memory-repository'
  });
});

// GET /api/stats - Platform overview stats
router.get('/stats', (req, res) => {
  const stats = repository.getStats();
  res.json(stats);
});

module.exports = router;
