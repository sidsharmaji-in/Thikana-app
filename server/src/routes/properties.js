const express = require('express');
const router = express.Router();
const repository = require('../data/repository');
const visionExtractorService = require('../services/visionExtractorService');
const { sanitizeInput } = require('../middleware/sanitizer');

// POST /api/properties/ai-extract-photos - AI Vision Detail Extraction (Slice P12)
router.post('/ai-extract-photos', async (req, res) => {
  try {
    const { photos, city, locality, ownerPreviousData } = req.body;
    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'PHOTOS_REQUIRED',
        message: 'Please provide at least one photo URL for AI analysis'
      });
    }

    const extraction = await visionExtractorService.extractRoomDetailsFromPhotos({
      photos,
      city: city || 'Kota',
      locality: locality || '',
      ownerPreviousData: ownerPreviousData || {}
    });

    res.json(extraction);
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'AI_EXTRACTION_FAILED',
      message: err.message
    });
  }
});

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

// PUT /api/properties/:id - Owner updates listing details (Slice P13)
router.put('/:id', (req, res) => {
  const propertyId = req.params.id;
  const existing = repository.getPropertyById(propertyId);
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  const updates = { ...req.body };
  if (updates.title) updates.title = sanitizeInput(updates.title);
  if (updates.city) updates.city = sanitizeInput(updates.city);
  if (updates.locality) updates.locality = sanitizeInput(updates.locality);
  if (updates.description) updates.description = sanitizeInput(updates.description);

  const updatedProperty = repository.updateProperty(propertyId, updates);
  res.status(200).json({
    success: true,
    property: updatedProperty,
    message: 'Property details updated successfully!'
  });
});

// PATCH /api/properties/:id/rooms/:roomId/slots/:slotId - Owner updates bed slot vacancy (Slice P13)
router.patch('/:id/rooms/:roomId/slots/:slotId', (req, res) => {
  const { id, roomId, slotId } = req.params;
  const { status, tenantName, tenantPhone, roommateProfile } = req.body;

  if (!status || !['available', 'occupied', 'reserved'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be "available", "occupied", or "reserved".'
    });
  }

  const result = repository.updateSlotStatus(id, roomId, slotId, {
    status,
    tenantName: tenantName ? sanitizeInput(tenantName) : undefined,
    tenantPhone: tenantPhone ? sanitizeInput(tenantPhone) : undefined,
    roommateProfile
  });

  if (result.error === 'PROPERTY_NOT_FOUND') {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }
  if (result.error === 'ROOM_NOT_FOUND') {
    return res.status(404).json({ success: false, message: 'Room not found' });
  }
  if (result.error === 'SLOT_NOT_FOUND') {
    return res.status(404).json({ success: false, message: 'Slot not found' });
  }

  res.status(200).json({
    success: true,
    slot: result.slot,
    room: result.room,
    message: `Bed slot status updated to ${status}`
  });
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

