const express = require('express');
const router = express.Router();
const repository = require('../data/repository');
const bedLockService = require('../services/bedLockService');
const { sanitizeInput } = require('../middleware/sanitizer');

// POST /api/properties/:id/book-slot - Bed / Slot booking (Slice 4 State Lock + Slice P3 Concurrency Check)
router.post('/:id/book-slot', (req, res) => {
  const { roomId, slotId, tenantName, tenantPhone, status = 'occupied', roommateProfile, lockedBy } = req.body;
  
  const cleanTenantName = sanitizeInput(tenantName);
  const identifier = lockedBy || tenantPhone || cleanTenantName;

  // Intercept concurrent double-booking with lock engine
  const lockCheck = bedLockService.validateAndConsumeLock(req.params.id, roomId, slotId, identifier);
  if (!lockCheck.valid) {
    if (lockCheck.retryAfter) {
      res.setHeader('Retry-After', lockCheck.retryAfter);
    }
    return res.status(409).json({
      success: false,
      error: lockCheck.error,
      retryAfter: lockCheck.retryAfter,
      message: lockCheck.message
    });
  }

  const result = repository.bookSlot(req.params.id, {
    roomId,
    slotId,
    tenantName: cleanTenantName,
    tenantPhone,
    status,
    roommateProfile
  });

  if (result.error === 'PROPERTY_NOT_FOUND') return res.status(404).json({ success: false, message: 'Property not found' });
  if (result.error === 'ROOM_NOT_FOUND') return res.status(404).json({ success: false, message: 'Room not found' });
  if (result.error === 'SLOT_NOT_FOUND') return res.status(404).json({ success: false, message: 'Slot not found' });
  if (result.error === 'SLOT_UNAVAILABLE') {
    return res.status(400).json({ success: false, message: 'Slot is already occupied or reserved' });
  }

  const { slot, room } = result;
  res.json({
    success: true,
    message: `Bed ${slot.label || slot.slotId} successfully ${slot.status === 'reserved' ? 'reserved' : 'booked'} in ${room.label}! Owner notified.`,
    slot,
    room
  });
});

// POST /api/properties/:id/rooms/:roomId/slots/:slotId/lock - Acquire temporary 10-min reservation lock lease
router.post('/:id/rooms/:roomId/slots/:slotId/lock', (req, res) => {
  const { lockedBy, tenantName, tenantPhone, leaseSeconds } = req.body || {};

  const cleanTenantName = sanitizeInput(tenantName);
  const result = bedLockService.acquireLock(req.params.id, req.params.roomId, req.params.slotId, {
    lockedBy,
    tenantName: cleanTenantName,
    tenantPhone,
    leaseSeconds
  });

  if (!result.success) {
    const statusCode = result.status || (result.error === 'SLOT_TEMPORARILY_LOCKED' ? 409 : 400);
    if (result.retryAfter) {
      res.setHeader('Retry-After', result.retryAfter);
    }
    return res.status(statusCode).json({
      success: false,
      error: result.error,
      retryAfter: result.retryAfter,
      remainingSeconds: result.remainingSeconds,
      lockedBy: result.lockedBy,
      message: result.message
    });
  }

  res.status(200).json({
    success: true,
    refreshed: result.refreshed,
    lock: result.lock,
    message: result.message
  });
});

// POST /api/properties/:id/rooms/:roomId/slots/:slotId/release-lock - Release temporary bed lock early
router.post('/:id/rooms/:roomId/slots/:slotId/release-lock', (req, res) => {
  const { requestedBy } = req.body || {};
  const result = bedLockService.releaseLock(req.params.id, req.params.roomId, req.params.slotId, requestedBy);

  if (!result.success) {
    return res.status(403).json({
      success: false,
      error: result.error,
      message: result.message
    });
  }

  res.status(200).json({
    success: true,
    message: result.message
  });
});

// GET /api/properties/:id/rooms/:roomId/slots/:slotId/lock-status - Get live bed lock status
router.get('/:id/rooms/:roomId/slots/:slotId/lock-status', (req, res) => {
  const { currentUserId } = req.query;
  const status = bedLockService.getLockStatus(req.params.id, req.params.roomId, req.params.slotId, currentUserId);

  res.status(200).json({
    success: true,
    ...status
  });
});

// PUT /api/properties/:id/rooms/:roomId/slots/:slotId/status - Owner updates slot status
router.put('/:id/rooms/:roomId/slots/:slotId/status', (req, res) => {
  const { status, tenantName, tenantPhone, roommateProfile } = req.body;
  const validStatuses = ['available', 'reserved', 'occupied'];
  
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be one of: available, reserved, occupied' });
  }

  const cleanTenantName = sanitizeInput(tenantName);
  const result = repository.updateSlotStatus(req.params.id, req.params.roomId, req.params.slotId, {
    status,
    tenantName: cleanTenantName,
    tenantPhone,
    roommateProfile
  });

  if (result.error === 'PROPERTY_NOT_FOUND') return res.status(404).json({ success: false, message: 'Property not found' });
  if (result.error === 'ROOM_NOT_FOUND') return res.status(404).json({ success: false, message: 'Room not found' });
  if (result.error === 'SLOT_NOT_FOUND') return res.status(404).json({ success: false, message: 'Slot not found' });

  const { slot, room } = result;
  res.json({
    success: true,
    message: `Bed ${slot.label || slot.slotId} is now ${status}`,
    slot,
    room
  });
});

// POST /api/properties/:id/rooms/:roomId/waitlist - Tenant joins waitlist for full room
router.post('/:id/rooms/:roomId/waitlist', (req, res) => {
  const { tenantName, tenantPhone, preferredDate, notes } = req.body;
  
  if (!tenantName || !tenantName.trim()) {
    return res.status(400).json({ success: false, message: 'Tenant name is required for waitlist registration' });
  }
  if (!tenantPhone || !tenantPhone.trim()) {
    return res.status(400).json({ success: false, message: 'Contact phone number is required' });
  }

  const cleanTenantName = sanitizeInput(tenantName);
  const cleanNotes = sanitizeInput(notes);

  const result = repository.joinWaitlist(req.params.id, req.params.roomId, {
    tenantName: cleanTenantName,
    tenantPhone,
    preferredDate,
    notes: cleanNotes
  });

  if (result.error === 'PROPERTY_NOT_FOUND') return res.status(404).json({ success: false, message: 'Property not found' });
  if (result.error === 'ROOM_NOT_FOUND') return res.status(404).json({ success: false, message: 'Room not found' });

  const { entry, room } = result;
  res.status(201).json({
    success: true,
    message: `Added to waitlist! You are #${room.waitlist.length} in queue.`,
    waitlistPosition: room.waitlist.length,
    entry,
    roomLabel: room.label
  });
});

// GET /api/properties/:id/rooms/:roomId/waitlist - View room waitlist
router.get('/:id/rooms/:roomId/waitlist', (req, res) => {
  const waitlist = repository.getWaitlist(req.params.id, req.params.roomId);
  if (!waitlist) return res.status(404).json({ success: false, message: 'Property or Room not found' });

  res.json({
    success: true,
    count: waitlist.length,
    waitlist
  });
});

// DELETE /api/properties/:id/rooms/:roomId/waitlist/:waitlistId - Remove from waitlist
router.delete('/:id/rooms/:roomId/waitlist/:waitlistId', (req, res) => {
  const result = repository.removeWaitlist(req.params.id, req.params.roomId, req.params.waitlistId);
  if (result.error === 'PROPERTY_NOT_FOUND') return res.status(404).json({ success: false, message: 'Property not found' });
  if (result.error === 'ROOM_NOT_FOUND') return res.status(404).json({ success: false, message: 'Room not found' });
  if (result.error === 'ENTRY_NOT_FOUND') return res.status(404).json({ success: false, message: 'Waitlist entry not found' });

  res.json({ success: true, message: 'Candidate removed from waitlist', removed: result.removed });
});

// POST /api/properties/:id/rooms/:roomId/waitlist/:waitlistId/assign - Owner assigns waitlisted candidate to vacant bed
router.post('/:id/rooms/:roomId/waitlist/:waitlistId/assign', (req, res) => {
  const result = repository.assignWaitlist(req.params.id, req.params.roomId, req.params.waitlistId);
  if (result.error === 'PROPERTY_NOT_FOUND') return res.status(404).json({ success: false, message: 'Property not found' });
  if (result.error === 'ROOM_NOT_FOUND') return res.status(404).json({ success: false, message: 'Room not found' });
  if (result.error === 'CANDIDATE_NOT_FOUND') return res.status(404).json({ success: false, message: 'Waitlist candidate not found' });
  if (result.error === 'NO_VACANT_SLOT') {
    return res.status(400).json({ success: false, message: 'No vacant bed available to assign in this room. Please release a bed first.' });
  }

  const { vacantSlot, candidate, room } = result;
  res.json({
    success: true,
    message: `Bed ${vacantSlot.label || vacantSlot.slotId} assigned to ${candidate.tenantName}!`,
    assignedSlot: vacantSlot,
    candidate,
    room
  });
});

module.exports = router;

