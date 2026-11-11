const express = require('express');
const router = express.Router();
const repository = require('../data/repository');

// POST /api/sync/offline-actions - Process queued offline operations (Slice 8)
router.post('/offline-actions', (req, res) => {
  const { actions } = req.body;
  if (!Array.isArray(actions)) {
    return res.status(400).json({ success: false, message: 'actions must be an array' });
  }

  const results = repository.syncOfflineActions(actions);

  res.json({
    success: true,
    syncedCount: results.filter(r => r.status === 'synced').length,
    results
  });
});

module.exports = router;
