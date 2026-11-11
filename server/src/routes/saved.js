const express = require('express');
const router = express.Router();
const repository = require('../data/repository');

// GET /api/saved - Retrieve tenant shortlisted rooms with live freshness (Slice 7)
router.get('/', (req, res) => {
  const list = repository.getSaved();
  res.json({
    success: true,
    savedCount: list.length,
    properties: list
  });
});

// POST /api/saved/:id - Save property to wishlist
router.post('/:id', (req, res) => {
  const result = repository.saveProperty(req.params.id);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  res.json({
    success: true,
    isSaved: true,
    propertyId: result.propertyId,
    savedCount: result.savedCount,
    message: '❤️ Room shortlisted to your Saved list!'
  });
});

// DELETE /api/saved/:id - Remove property from saved list
router.delete('/:id', (req, res) => {
  const result = repository.removeSavedProperty(req.params.id);

  res.json({
    success: true,
    isSaved: false,
    propertyId: req.params.id,
    savedCount: result.savedCount,
    message: result.existed ? 'Removed from your shortlisted rooms' : 'Property was not in saved list'
  });
});

module.exports = router;

