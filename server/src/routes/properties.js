const express = require('express');
const router = express.Router();
const repository = require('../data/repository');
const { sanitizeInput } = require('../middleware/sanitizer');

// GET /api/properties - Filter & Search (Slice 2 Engine)
router.get('/', (req, res) => {
  const results = repository.getProperties(req.query);
  res.json({
    success: true,
    count: results.length,
    properties: results
  });
});

// GET /api/properties/:id - Detail view
router.get('/:id', (req, res) => {
  const property = repository.getPropertyById(req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }
  res.json({ success: true, property });
});

// POST /api/properties - Owner creates listing (Slice 1 Validation & Creation)
router.post('/', (req, res) => {
  const { title, city, locality, rooms, photos } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Property title is required' });
  }
  if (!city || !locality) {
    return res.status(400).json({ success: false, message: 'City and Locality are required' });
  }
  if (!rooms || !Array.isArray(rooms) || rooms.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one room configuration is required' });
  }
  if (!photos || !Array.isArray(photos) || photos.length < 3) {
    return res.status(400).json({ success: false, message: 'Minimum 3 photos required for listing verification' });
  }

  const cleanData = {
    ...req.body,
    title: sanitizeInput(title),
    city: sanitizeInput(city),
    locality: sanitizeInput(locality)
  };

  const newProperty = repository.createProperty(cleanData);
  res.status(201).json({ success: true, property: newProperty, message: 'Property published successfully!' });
});

// PUT /api/properties/:id/toggle-availability - Owner toggles listing on/off
router.put('/:id/toggle-availability', (req, res) => {
  const property = repository.togglePropertyAvailability(req.params.id);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

  res.json({
    success: true,
    isAvailable: property.isAvailable,
    message: `Listing is now ${property.isAvailable ? 'Active & Visible' : 'Paused / Occupied'}`
  });
});

// DELETE /api/properties/:id - Owner removes listing
router.delete('/:id', (req, res) => {
  const deleted = repository.deleteProperty(req.params.id);
  if (!deleted) return res.status(404).json({ success: false, message: 'Property not found' });

  res.json({ success: true, message: 'Property deleted successfully' });
});

// POST /api/properties/:id/verify-owner - Submit Aadhaar / Government KYC Verification
router.post('/:id/verify-owner', (req, res) => {
  const { documentType, documentNumberLast4 } = req.body;
  
  if (!documentType || !documentNumberLast4) {
    return res.status(400).json({ success: false, message: 'Document type and last 4 digits are required for Aadhaar KYC' });
  }

  const owner = repository.verifyOwner(req.params.id, { documentType, documentNumberLast4 });
  if (!owner) return res.status(404).json({ success: false, message: 'Property not found' });

  res.json({
    success: true,
    message: 'Makan Maalik identity verified successfully!',
    owner
  });
});

module.exports = router;

