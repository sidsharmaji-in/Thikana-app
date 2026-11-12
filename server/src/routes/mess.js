/**
 * GharDekho — Mess & Tiffin Service API Routes (Slice P10)
 * Mounted at /api/mess
 */

const express = require('express');
const router = express.Router();
const messService = require('../services/messService');
const { sanitizeInput } = require('../middleware/sanitizer');

// GET /api/mess - List all messes with optional filtering (propertyId, dietType, maxMonthlyPrice, maxDistanceMeters)
router.get('/', (req, res) => {
  const { propertyId, dietType, maxMonthlyPrice, maxDistanceMeters } = req.query;
  const list = messService.getAllMessCenters({
    propertyId,
    dietType,
    maxMonthlyPrice,
    maxDistanceMeters
  });

  res.json({
    success: true,
    count: list.length,
    messCenters: list
  });
});

// GET /api/mess/property/:propertyId - Discover near-hostel messes within walking radius
router.get('/property/:propertyId', (req, res) => {
  const list = messService.getMessByPropertyId(req.params.propertyId);
  res.json({
    success: true,
    propertyId: req.params.propertyId,
    count: list.length,
    messCenters: list
  });
});

// GET /api/mess/:id - Single mess details with reviews and today's menu
router.get('/:id', (req, res) => {
  const mess = messService.getMessById(req.params.id);
  if (!mess) {
    return res.status(404).json({ success: false, error: 'MESS_NOT_FOUND', message: 'Mess center not found' });
  }
  res.json({
    success: true,
    messCenter: mess
  });
});

// POST /api/mess - Register a new mess center
router.post('/', (req, res) => {
  try {
    const newMess = messService.createMessCenter(req.body);
    res.status(201).json({
      success: true,
      message: 'Mess center registered successfully',
      messCenter: newMess
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
      message: err.message
    });
  }
});

// PUT /api/mess/:id/menu - Operator updates daily lunch or dinner menu
router.put('/:id/menu', (req, res) => {
  try {
    const { mealType, menuData } = req.body;
    const updated = messService.updateDailyMenu(req.params.id, { mealType, menuData });
    res.json({
      success: true,
      message: `Daily ${mealType} menu updated successfully`,
      menu: updated
    });
  } catch (err) {
    const status = err.message === 'MESS_NOT_FOUND' ? 404 : 400;
    res.status(status).json({
      success: false,
      error: err.message,
      message: err.message
    });
  }
});

// POST /api/mess/:id/reviews - Student submits verified hygiene & food review
router.post('/:id/reviews', (req, res) => {
  try {
    const { studentName, coaching, rating, comment } = req.body;
    const result = messService.addStudentReview(req.params.id, {
      studentName: studentName ? sanitizeInput(studentName) : 'Verified Student',
      coaching: coaching ? sanitizeInput(coaching) : 'Aspirant',
      rating,
      comment: sanitizeInput(comment)
    });

    res.status(201).json({
      success: true,
      message: 'Mess review posted successfully',
      review: result.review,
      newHygieneRating: result.hygieneRating
    });
  } catch (err) {
    const status = err.message === 'MESS_NOT_FOUND' ? 404 : 400;
    res.status(status).json({
      success: false,
      error: err.message,
      message: err.message
    });
  }
});

// POST /api/mess/:id/reviews/:reviewId/upvote - Helpful review upvote
router.post('/:id/reviews/:reviewId/upvote', (req, res) => {
  try {
    const result = messService.upvoteReview(req.params.id, req.params.reviewId);
    res.json({
      success: true,
      message: 'Review upvoted',
      ...result
    });
  } catch (err) {
    const status = (err.message === 'MESS_NOT_FOUND' || err.message === 'REVIEW_NOT_FOUND') ? 404 : 400;
    res.status(status).json({
      success: false,
      error: err.message,
      message: err.message
    });
  }
});

// POST /api/mess/:id/subscribe - Monthly tiffin booking & room delivery
router.post('/:id/subscribe', (req, res) => {
  try {
    const { planType, deliveryRoom, startDate, durationMonths } = req.body;
    const userId = req.headers['x-user-id'] || 'student-demo';

    const sub = messService.subscribeToTiffin(userId, req.params.id, {
      planType,
      deliveryRoom: deliveryRoom ? sanitizeInput(deliveryRoom) : 'Room 204',
      startDate,
      durationMonths
    });

    res.status(201).json({
      success: true,
      message: 'Tiffin subscription activated successfully!',
      subscription: sub
    });
  } catch (err) {
    const status = err.message === 'MESS_NOT_FOUND' ? 404 : 400;
    res.status(status).json({
      success: false,
      error: err.message,
      message: err.message
    });
  }
});

module.exports = router;
