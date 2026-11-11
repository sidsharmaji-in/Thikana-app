const express = require('express');
const router = express.Router();
const { roommateService } = require('../services/roommateService');
const { computePairwiseVibe } = require('../services/vibeMatcher');
const { optionalAuth } = require('../middleware/auth');

/**
 * GET /api/roommates/profile/me
 * Retrieves current authenticated user's roommate profile
 */
router.get('/profile/me', optionalAuth, (req, res) => {
  const userId = req.user?.id || req.query.userId || 'user-aryan-01';
  let profile = roommateService.getProfile(userId);

  if (!profile) {
    // Generate empty draft profile
    profile = {
      userId,
      name: req.user?.name || 'New Student',
      city: 'Kota',
      targetExam: 'JEE',
      sleepSchedule: 'early_bird',
      studyNoisePreference: 'silent',
      diet: 'pure_veg',
      cleanlinessLevel: 4,
      habits: ['Early Bird 🌅', 'Silent Study 📚', 'Vegetarian 🥗']
    };
  }

  res.json({
    success: true,
    data: profile
  });
});

/**
 * PUT /api/roommates/profile/me
 * Upserts current user's roommate compatibility profile
 */
router.put('/profile/me', optionalAuth, (req, res) => {
  const userId = req.user?.id || req.body.userId || 'user-aryan-01';
  const {
    name,
    hometown,
    city,
    targetExam,
    courseOrProfession,
    sleepSchedule,
    studyNoisePreference,
    diet,
    cleanlinessLevel,
    acPreference,
    bio,
    habits
  } = req.body;

  if (cleanlinessLevel && (cleanlinessLevel < 1 || cleanlinessLevel > 5)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_CLEANLINESS_LEVEL',
      message: 'Cleanliness level must be between 1 and 5'
    });
  }

  const updated = roommateService.upsertProfile(userId, {
    name,
    hometown,
    city: city || 'Kota',
    targetExam,
    courseOrProfession,
    sleepSchedule,
    studyNoisePreference,
    diet,
    cleanlinessLevel,
    acPreference,
    bio,
    habits
  });

  res.json({
    success: true,
    message: 'Roommate profile updated successfully',
    data: updated
  });
});

/**
 * POST /api/roommates/compatibility/compare
 * Compares two profiles or userIds pairwise
 */
router.post('/compatibility/compare', (req, res) => {
  const { profileA, profileB, userIdA, userIdB } = req.body;

  const candidateA = profileA || (userIdA ? roommateService.getProfile(userIdA) : null);
  const candidateB = profileB || (userIdB ? roommateService.getProfile(userIdB) : null);

  if (!candidateA || !candidateB) {
    return res.status(400).json({
      success: false,
      error: 'PROFILES_REQUIRED',
      message: 'Both profiles or valid userIds are required for compatibility comparison'
    });
  }

  const result = computePairwiseVibe(candidateA, candidateB);

  res.json({
    success: true,
    data: result
  });
});

/**
 * GET /api/roommates/rooms/:propertyId/:roomId/vibe-check
 * Evaluates candidate profile compatibility against current occupants of a room
 */
router.get('/rooms/:propertyId/:roomId/vibe-check', optionalAuth, async (req, res, next) => {
  try {
    const { propertyId, roomId } = req.params;
    const userId = req.user?.id || req.query.userId;
    
    // Optional candidate profile override passed in query
    let candidate = null;
    if (userId) {
      candidate = roommateService.getProfile(userId);
    }
    if (!candidate && req.query.targetExam) {
      candidate = {
        targetExam: req.query.targetExam,
        sleepSchedule: req.query.sleepSchedule || 'early_bird',
        studyNoisePreference: req.query.studyNoisePreference || 'silent',
        diet: req.query.diet || 'pure_veg',
        cleanlinessLevel: Number(req.query.cleanlinessLevel) || 4
      };
    }

    const assessment = await roommateService.checkRoomVibe(propertyId, roomId, candidate);

    res.json({
      success: true,
      data: assessment
    });
  } catch (err) {
    if (err.message === 'PROPERTY_NOT_FOUND' || err.message === 'ROOM_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: err.message,
        message: 'Property or room not found'
      });
    }
    next(err);
  }
});

/**
 * GET /api/roommates/explore
 * Discover compatible flatmates in a city
 */
router.get('/explore', optionalAuth, (req, res) => {
  const { city = 'Kota', targetExam, sleepSchedule, diet } = req.query;
  const currentUserId = req.user?.id || req.query.userId || 'user-aryan-01';

  const results = roommateService.exploreRoommates({
    city,
    targetExam,
    sleepSchedule,
    diet,
    currentUserId
  });

  res.json({
    success: true,
    data: {
      total: results.length,
      city,
      roommates: results
    }
  });
});

module.exports = router;
