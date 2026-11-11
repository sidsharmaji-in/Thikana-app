/**
 * RoommateService - Manages Student Roommate Profiles and Room Compatibility Checks
 */

const { computePairwiseVibe, computeRoomVibe } = require('./vibeMatcher');
const repository = require('../data/repository');

class RoommateService {
  constructor() {
    // In-memory student profiles store keyed by userId or phone
    this.profiles = new Map();
    this.seedDefaultProfiles();
  }

  seedDefaultProfiles() {
    const defaults = [
      {
        userId: 'user-aryan-01',
        name: 'Aryan Sharma',
        phone: '9876500001',
        hometown: 'Jaipur, RJ',
        city: 'Kota',
        targetExam: 'JEE',
        courseOrProfession: 'Allen 12th JEE Main & Adv',
        sleepSchedule: 'early_bird',
        studyNoisePreference: 'silent',
        diet: 'pure_veg',
        cleanlinessLevel: 4,
        acPreference: 'moderate',
        bio: 'Focused on JEE Advanced 2027. Wake up at 5:30 AM for Allen Samarth morning batch. Strict silence during 7 PM-11 PM revision.',
        habits: ['Early Bird 🌅', 'Silent Study 📚', 'Vegetarian 🥗', 'Tea Lover ☕']
      },
      {
        userId: 'user-priyansh-02',
        name: 'Priyansh Mishra',
        phone: '9876500002',
        hometown: 'Patna, BR',
        city: 'Kota',
        targetExam: 'NEET',
        courseOrProfession: 'Resonance NEET Dropper',
        sleepSchedule: 'night_owl',
        studyNoisePreference: 'mild',
        diet: 'eggetarian',
        cleanlinessLevel: 4,
        acPreference: 'heavy_night',
        bio: 'NEET aspirant studying biology till 1:30 AM. Don’t mind soft lofi study music.',
        habits: ['Night Owl 🦉', 'Soft Music 🎧', 'Eggetarian 🥚', 'Non-Smoker 🚭']
      },
      {
        userId: 'user-rahul-03',
        name: 'Rahul Meena',
        phone: '9876500003',
        hometown: 'Alwar, RJ',
        city: 'Kota',
        targetExam: 'JEE',
        courseOrProfession: 'Vibrant Academy 11th JEE',
        sleepSchedule: 'early_bird',
        studyNoisePreference: 'silent',
        diet: 'pure_veg',
        cleanlinessLevel: 5,
        acPreference: 'moderate',
        bio: 'Aiming for IIT Delhi Computer Science. Love discussing physics HC Verma problems.',
        habits: ['Early Bird 🌅', 'Silent Study 📚', 'Pure Veg 🥗', 'Discipline ⭐']
      },
      {
        userId: 'user-dev-04',
        name: 'Devashish Rao',
        phone: '9876500004',
        hometown: 'Varanasi, UP',
        city: 'Kota',
        targetExam: 'NEET',
        courseOrProfession: 'Allen Samarth NEET 12th',
        sleepSchedule: 'early_bird',
        studyNoisePreference: 'silent',
        diet: 'pure_veg',
        cleanlinessLevel: 4,
        acPreference: 'moderate',
        bio: 'Early morning botany & zoology learner. Looking for like-minded NEET buddy to quiz each other.',
        habits: ['Early Bird 🌅', 'NEET Peer 🩺', 'Pure Veg 🥗', 'Quiet Hours 🤫']
      }
    ];

    defaults.forEach(p => this.profiles.set(p.userId, p));
  }

  /**
   * Retrieves profile by userId or creates a default fallback
   */
  getProfile(userId) {
    if (!userId) return null;
    return this.profiles.get(userId) || null;
  }

  /**
   * Upsert user's roommate profile
   */
  upsertProfile(userId, profileData = {}) {
    if (!userId) throw new Error('USER_ID_REQUIRED');

    const existing = this.profiles.get(userId) || {};
    const updated = {
      ...existing,
      ...profileData,
      userId,
      cleanlinessLevel: Number(profileData.cleanlinessLevel) || existing.cleanlinessLevel || 4,
      updatedAt: new Date().toISOString()
    };

    // Auto-generate habit tags if not supplied
    if (!updated.habits || updated.habits.length === 0) {
      const habits = [];
      if (updated.sleepSchedule === 'early_bird') habits.push('Early Bird 🌅');
      else if (updated.sleepSchedule === 'night_owl') habits.push('Night Owl 🦉');
      else habits.push('Balanced Routine ⚖️');

      if (updated.studyNoisePreference === 'silent') habits.push('Silent Study 📚');
      else if (updated.studyNoisePreference === 'mild') habits.push('Soft Music 🎧');
      else habits.push('Discussion Group 🗣️');

      if (updated.diet === 'pure_veg') habits.push('Pure Veg 🥗');
      else if (updated.diet === 'eggetarian') habits.push('Eggetarian 🥚');
      else habits.push('Non-Veg Ok 🍗');

      if (updated.targetExam) habits.push(`${updated.targetExam} Aspirant 🎯`);
      updated.habits = habits;
    }

    this.profiles.set(userId, updated);
    return updated;
  }

  /**
   * Compare candidate against a specific room's occupants
   */
  async checkRoomVibe(propertyId, roomId, candidateProfileOrUserId) {
    const property = repository.getPropertyById(propertyId);
    if (!property) {
      throw new Error('PROPERTY_NOT_FOUND');
    }

    const room = (property.rooms || []).find(r => r.roomId === roomId || r.id === roomId);
    if (!room) {
      throw new Error('ROOM_NOT_FOUND');
    }

    let candidate = null;
    if (typeof candidateProfileOrUserId === 'string') {
      candidate = this.getProfile(candidateProfileOrUserId);
    } else {
      candidate = candidateProfileOrUserId;
    }

    // If candidate has no profile, provide a sensible Kota student baseline
    if (!candidate) {
      candidate = {
        name: 'Aspiring Student',
        sleepSchedule: 'early_bird',
        studyNoisePreference: 'silent',
        targetExam: 'JEE',
        diet: 'pure_veg',
        cleanlinessLevel: 4
      };
    }

    const occupiedSlots = (room.slots || []).filter(s => s.status === 'occupied' || s.tenantName);
    
    // Enrich with occupant roommate profiles
    const occupants = occupiedSlots.map(slot => {
      if (slot.roommateProfile) {
        return {
          ...slot.roommateProfile,
          tenantName: slot.tenantName,
          slotId: slot.slotId
        };
      }
      return {
        name: slot.tenantName || 'Roommate',
        tenantName: slot.tenantName || 'Roommate',
        slotId: slot.slotId,
        sleepSchedule: 'early_bird',
        studyNoisePreference: 'silent',
        targetExam: 'NEET',
        diet: 'pure_veg',
        cleanlinessLevel: 4
      };
    });

    const assessment = computeRoomVibe(candidate, occupants);

    return {
      propertyId,
      propertyName: property.title,
      roomId,
      roomName: room.roomName || room.label || `Room ${room.roomId}`,
      totalSlots: (room.slots || []).length,
      occupiedSlotsCount: occupiedSlots.length,
      candidateProfile: candidate,
      ...assessment
    };
  }

  /**
   * Search potential flatmates / roommates in a city
   */
  exploreRoommates({ city = 'Kota', targetExam, sleepSchedule, diet, currentUserId } = {}) {
    let list = Array.from(this.profiles.values());

    if (currentUserId) {
      list = list.filter(p => p.userId !== currentUserId);
    }

    if (city) {
      list = list.filter(p => (p.city || '').toLowerCase() === city.toLowerCase());
    }

    if (targetExam) {
      list = list.filter(p => (p.targetExam || '').toUpperCase() === targetExam.toUpperCase());
    }

    if (sleepSchedule) {
      list = list.filter(p => (p.sleepSchedule || '').toLowerCase() === sleepSchedule.toLowerCase());
    }

    if (diet) {
      list = list.filter(p => (p.diet || '').toLowerCase() === diet.toLowerCase());
    }

    // If a seeker profile is provided, compute match score against each result
    const seeker = currentUserId ? this.getProfile(currentUserId) : null;

    return list.map(profile => {
      let vibe = null;
      if (seeker) {
        vibe = computePairwiseVibe(seeker, profile);
      }
      return {
        ...profile,
        matchScore: vibe ? vibe.overallScore : null,
        matchLevel: vibe ? vibe.matchLevel : null,
        synergies: vibe ? vibe.synergies : []
      };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }
}

// Singleton instance
const roommateService = new RoommateService();

module.exports = {
  roommateService,
  RoommateService
};
