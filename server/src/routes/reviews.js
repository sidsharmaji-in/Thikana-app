const express = require('express');
const repository = require('../data/repository');
const { rateLimiter } = require('../middleware/rateLimiter');
const { sanitizeInput } = require('../middleware/sanitizer');

const propertyReviewsRouter = express.Router({ mergeParams: true });
const reviewsRouter = express.Router();

// GET /api/properties/:id/reviews - Retrieve property reviews & rating stats (Slice 6)
propertyReviewsRouter.get('/:id/reviews', (req, res) => {
  const stats = repository.getReviews(req.params.id);
  if (!stats) return res.status(404).json({ success: false, message: 'Property not found' });
  res.json({ success: true, ...stats });
});

// POST /api/properties/:id/reviews - Submit resident review
propertyReviewsRouter.post('/:id/reviews', rateLimiter, (req, res) => {
  const { tenantName, rating, title, comment, tenantPhone, stayDurationMonths, isVerifiedTenant } = req.body;
  
  if (!rating || isNaN(rating) || Number(rating) < 1 || Number(rating) > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be an integer between 1 and 5' });
  }

  if (!tenantName || !tenantName.trim()) {
    return res.status(400).json({ success: false, message: 'Tenant name is required' });
  }

  if (!comment || comment.trim().length < 10) {
    return res.status(400).json({ success: false, message: 'Review comment must be at least 10 characters long' });
  }

  const cleanTenantName = sanitizeInput(tenantName);
  const cleanTitle = title ? sanitizeInput(title) : 'Resident Review';
  const cleanComment = sanitizeInput(comment);

  const result = repository.createReview(req.params.id, {
    tenantName: cleanTenantName,
    rating,
    title: cleanTitle,
    comment: cleanComment,
    tenantPhone,
    stayDurationMonths,
    isVerifiedTenant
  });

  if (!result) return res.status(404).json({ success: false, message: 'Property not found' });

  res.status(201).json({
    success: true,
    review: result.review,
    propertyRating: result.property.rating,
    reviewsCount: result.property.reviewsCount,
    message: 'Review published successfully!'
  });
});

// POST /api/reviews/:reviewId/owner-response - Makan Maalik public reply
reviewsRouter.post('/:reviewId/owner-response', (req, res) => {
  const { responseText, ownerName } = req.body;
  
  if (!responseText || !responseText.trim()) {
    return res.status(400).json({ success: false, message: 'Response text cannot be empty' });
  }

  const cleanResponse = sanitizeInput(responseText);
  const cleanOwnerName = ownerName ? sanitizeInput(ownerName) : 'Makan Maalik';

  const review = repository.addOwnerResponse(req.params.reviewId, {
    responseText: cleanResponse,
    ownerName: cleanOwnerName
  });

  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  res.json({
    success: true,
    review,
    message: 'Owner response published successfully'
  });
});

// POST /api/reviews/:reviewId/like - Upvote helpful review
reviewsRouter.post('/:reviewId/like', (req, res) => {
  const likesCount = repository.likeReview(req.params.reviewId);
  if (likesCount === null) return res.status(404).json({ success: false, message: 'Review not found' });

  res.json({ success: true, likesCount });
});

module.exports = {
  reviewsRouter,
  propertyReviewsRouter
};
