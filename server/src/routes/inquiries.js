const express = require('express');
const router = express.Router();
const repository = require('../data/repository');
const { rateLimiter } = require('../middleware/rateLimiter');
const { sanitizeInput } = require('../middleware/sanitizer');

// POST /api/inquiries - Tenant sends contact / chat lead (Slice 5 In-App Chat)
router.post('/', rateLimiter, (req, res) => {
  const { propertyId, tenantName, tenantPhone, message, scheduledVisitDate } = req.body;
  
  const cleanName = sanitizeInput(tenantName) || 'Interested Tenant';
  const cleanMsg = sanitizeInput(message) || '';

  const inquiry = repository.createInquiry({
    propertyId,
    tenantName: cleanName,
    tenantPhone,
    message: cleanMsg,
    scheduledVisitDate
  });

  res.status(201).json({ success: true, inquiry, message: 'Inquiry and chat thread created!' });
});

// GET /api/inquiries - List inquiries / chat threads
router.get('/', (req, res) => {
  const results = repository.getInquiries(req.query);
  res.json({ success: true, count: results.length, inquiries: results });
});

// GET /api/inquiries/:id - Single chat thread with messages
router.get('/:id', (req, res) => {
  const inquiry = repository.getInquiryById(req.params.id, req.query.reader);
  if (!inquiry) return res.status(404).json({ success: false, message: 'Inquiry thread not found' });

  res.json({ success: true, inquiry });
});

// POST /api/inquiries/:id/messages - Send message in chat thread
router.post('/:id/messages', rateLimiter, (req, res) => {
  const { senderRole, senderName, text } = req.body;
  
  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'Message text cannot be empty' });
  }

  const cleanText = sanitizeInput(text);
  const cleanSenderName = sanitizeInput(senderName);

  const result = repository.addInquiryMessage(req.params.id, {
    senderRole,
    senderName: cleanSenderName,
    text: cleanText
  });

  if (!result) return res.status(404).json({ success: false, message: 'Inquiry thread not found' });

  res.status(201).json({
    success: true,
    message: result.newMsg,
    inquiry: result.inquiry
  });
});

// PUT /api/inquiries/:id/visit-status - Update scheduled room visit status
router.put('/:id/visit-status', (req, res) => {
  const { status, scheduledVisitDate, note } = req.body;
  
  const validStatuses = ['confirmed', 'rescheduled', 'cancelled', 'visited', 'pending'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  const cleanNote = sanitizeInput(note);
  const result = repository.updateVisitStatus(req.params.id, {
    status,
    scheduledVisitDate,
    note: cleanNote
  });

  if (!result) return res.status(404).json({ success: false, message: 'Inquiry thread not found' });

  res.json({
    success: true,
    message: result.statusText,
    status: result.inquiry.status,
    inquiry: result.inquiry
  });
});

module.exports = router;
