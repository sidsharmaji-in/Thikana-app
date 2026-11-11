/**
 * VibeMatcher - Algorithmic Compatibility Engine for Indian Student Accommodations
 * Computes deterministic, explainable roommate compatibility across 5 weighted dimensions:
 * 1. Sleep Schedule Alignment (25%)
 * 2. Study Noise & Focus Routine (25%)
 * 3. Target Exam & Peer Synergy (20%)
 * 4. Dietary Ethics & Kitchen Rules (15%)
 * 5. Cleanliness, AC & Lifestyle Habits (15%)
 */

const EXAM_AFFINITIES = {
  NEET: ['NEET', 'AIIMS', 'MEDICAL_FOUNDATION'],
  JEE: ['JEE_MAIN', 'JEE_ADVANCED', 'ENGINEERING_FOUNDATION'],
  GOVT: ['UPSC', 'SSC', 'BANKING', 'STATE_PSC'],
  COLLEGE: ['ENGINEERING', 'COMMERCE', 'ARTS', 'SCIENCE'],
  WORKING: ['TECH', 'FINANCE', 'TEACHING', 'OTHER']
};

/**
 * Standardize exam category
 */
function normalizeExamCategory(examString = '') {
  const str = String(examString).toUpperCase();
  if (str.includes('NEET') || str.includes('MEDICAL') || str.includes('AIIMS') || str.includes('BIO')) return 'NEET';
  if (str.includes('JEE') || str.includes('IIT') || str.includes('ENGINEER')) return 'JEE';
  if (str.includes('UPSC') || str.includes('GOVT') || str.includes('SSC') || str.includes('CIVIL')) return 'GOVT';
  if (str.includes('COLLEGE') || str.includes('B.TECH') || str.includes('B.COM') || str.includes('DEGREE')) return 'COLLEGE';
  return 'GENERAL';
}

/**
 * Standardize sleep schedule
 */
function normalizeSleep(schedule = '') {
  const s = String(schedule).toLowerCase();
  if (s.includes('early') || s.includes('5:00') || s.includes('6:00') || s.includes('10:00') || s.includes('10:30')) return 'early_bird';
  if (s.includes('owl') || s.includes('1:00') || s.includes('2:00') || s.includes('3:00') || s.includes('late')) return 'night_owl';
  return 'balanced';
}

/**
 * Standardize noise preference
 */
function normalizeNoise(noise = '') {
  const n = String(noise).toLowerCase();
  if (n.includes('silent') || n.includes('silence') || n.includes('pin_drop') || n.includes('pin drop') || n.includes('peace') || n.includes('quiet')) return 'silent';
  if (n.includes('music') || n.includes('lofi') || n.includes('lo-fi') || n.includes('soft') || n.includes('mild')) return 'mild';
  return 'discussion';
}

/**
 * Standardize diet preference
 */
function normalizeDiet(diet = '') {
  const d = String(diet).toLowerCase();
  if (d.includes('strict') || d.includes('pure') || d.includes('veg') && !d.includes('non')) return 'pure_veg';
  if (d.includes('egg') || d.includes('eggetarian')) return 'eggetarian';
  return 'non_veg_ok';
}

/**
 * Computes pairwise compatibility between two student profiles
 * @param {Object} candidate - Seeker student profile
 * @param {Object} occupant - Existing room occupant profile
 * @returns {Object} compatibility report
 */
function computePairwiseVibe(candidate = {}, occupant = {}) {
  // 1. Sleep Schedule (Weight: 25)
  const cSleep = normalizeSleep(candidate.sleepSchedule || candidate.sleepHabit);
  const oSleep = normalizeSleep(occupant.sleepSchedule || occupant.sleepHabit);
  let sleepScore = 0;
  if (cSleep === oSleep) {
    sleepScore = 25;
  } else if (cSleep === 'balanced' || oSleep === 'balanced') {
    sleepScore = 21;
  } else {
    // Direct clash: Early Bird vs Night Owl (lights on / alarm rings)
    sleepScore = 6;
  }

  // 2. Study Noise & Routine (Weight: 25)
  const cNoise = normalizeNoise(candidate.studyNoisePreference || candidate.studyHabit);
  const oNoise = normalizeNoise(occupant.studyNoisePreference || occupant.studyHabit);
  let noiseScore = 0;
  if (cNoise === oNoise) {
    noiseScore = 25;
  } else if ((cNoise === 'silent' && oNoise === 'mild') || (cNoise === 'mild' && oNoise === 'silent')) {
    noiseScore = 19;
  } else if ((cNoise === 'mild' && oNoise === 'discussion') || (cNoise === 'discussion' && oNoise === 'mild')) {
    noiseScore = 17;
  } else {
    // Silent study seeker vs Group discussion enthusiast
    noiseScore = 5;
  }

  // 3. Exam & Academic Synergy (Weight: 20)
  const cExam = normalizeExamCategory(candidate.targetExam || candidate.courseOrProfession);
  const oExam = normalizeExamCategory(occupant.targetExam || occupant.courseOrProfession);
  let examScore = 0;
  if (cExam === oExam && cExam !== 'GENERAL') {
    examScore = 20; // Shared syllabus, test series, doubts
  } else if ((cExam === 'NEET' && oExam === 'JEE') || (cExam === 'JEE' && oExam === 'NEET')) {
    examScore = 17; // Both rigorous coaching routines (Physics/Chem overlap)
  } else if (cExam === 'GOVT' || oExam === 'GOVT') {
    examScore = 14;
  } else {
    examScore = 12;
  }

  // 4. Dietary Ethics (Weight: 15)
  const cDiet = normalizeDiet(candidate.diet || candidate.dietaryPreference);
  const oDiet = normalizeDiet(occupant.diet || occupant.dietaryPreference);
  let dietScore = 0;
  if (cDiet === oDiet) {
    dietScore = 15;
  } else if ((cDiet === 'pure_veg' && oDiet === 'eggetarian') || (cDiet === 'eggetarian' && oDiet === 'pure_veg')) {
    dietScore = 13;
  } else if ((cDiet === 'eggetarian' && oDiet === 'non_veg_ok') || (cDiet === 'non_veg_ok' && oDiet === 'eggetarian')) {
    dietScore = 13;
  } else {
    // Pure vegetarian vs Non-veg consumer in small shared PG room
    dietScore = 5;
  }

  // 5. Cleanliness & Lifestyle (Weight: 15)
  const cClean = Number(candidate.cleanlinessLevel) || 4;
  const oClean = Number(occupant.cleanlinessLevel) || 4;
  const cleanDiff = Math.abs(cClean - oClean);
  let lifestyleScore = Math.max(4, 15 - (cleanDiff * 3.5));

  // AC preference matching bonus / penalty
  const cAc = candidate.acPreference || 'moderate';
  const oAc = occupant.acPreference || 'moderate';
  if (cAc !== 'moderate' && oAc !== 'moderate' && cAc !== oAc) {
    lifestyleScore = Math.max(3, lifestyleScore - 3);
  }

  const rawTotal = Math.round(sleepScore + noiseScore + examScore + dietScore + lifestyleScore);
  const overallScore = Math.min(100, Math.max(0, rawTotal));

  // Determine qualitative tier
  let matchLevel = 'Fair Match 👍';
  if (overallScore >= 92) matchLevel = 'Super Vibe 🔥';
  else if (overallScore >= 80) matchLevel = 'Great Match ✨';
  else if (overallScore < 60) matchLevel = 'Mismatched ⚠️';

  // Discover synergies & friction points
  const synergies = [];
  const frictions = [];

  if (cSleep === oSleep) {
    synergies.push(`Synchronized sleep schedule (${cSleep.replace('_', ' ')})`);
  } else if (sleepScore <= 10) {
    frictions.push(`Sleep routine clash: ${cSleep.replace('_', ' ')} vs ${oSleep.replace('_', ' ')} (lights/alarms)`);
  }

  if (cNoise === oNoise) {
    synergies.push(`Identical study style (${cNoise} focus)`);
  } else if (noiseScore <= 10) {
    frictions.push(`Study sound mismatch: prefers ${cNoise} while roommate prefers ${oNoise}`);
  }

  if (cExam === oExam && cExam !== 'GENERAL') {
    synergies.push(`Shared ${cExam} competitive focus & mutual doubt clearing`);
  } else if ((cExam === 'NEET' && oExam === 'JEE') || (cExam === 'JEE' && oExam === 'NEET')) {
    synergies.push('Both enrolled in rigorous coaching test cycles (physics/chemistry peer help)');
  }

  if (cDiet === oDiet) {
    synergies.push(`Matching dietary preference (${cDiet.replace('_', ' ')})`);
  } else if (dietScore <= 6) {
    frictions.push(`Dietary difference: ${cDiet.replace('_', ' ')} vs ${oDiet.replace('_', ' ')}`);
  }

  return {
    overallScore,
    matchLevel,
    occupantName: occupant.name || occupant.tenantName || 'Current Roommate',
    occupantHometown: occupant.hometown || occupant.city || 'India',
    dimensions: {
      sleep: { score: Math.round(sleepScore), max: 25, candidate: cSleep, occupant: oSleep },
      studyNoise: { score: Math.round(noiseScore), max: 25, candidate: cNoise, occupant: oNoise },
      examSynergy: { score: Math.round(examScore), max: 20, candidate: cExam, occupant: oExam },
      diet: { score: Math.round(dietScore), max: 15, candidate: cDiet, occupant: oDiet },
      lifestyle: { score: Math.round(lifestyleScore), max: 15, candidateClean: cClean, occupantClean: oClean }
    },
    synergies,
    frictions
  };
}

/**
 * Computes aggregate compatibility of a candidate against all active occupants of a shared room
 * @param {Object} candidate - Seeker profile
 * @param {Array} occupants - Array of occupant profiles
 * @returns {Object} aggregated room vibe assessment
 */
function computeRoomVibe(candidate = {}, occupants = []) {
  const activeOccupants = occupants.filter(o => o && (o.tenantName || o.name || o.roommateProfile));
  
  if (activeOccupants.length === 0) {
    return {
      overallRoomVibe: 100,
      matchLevel: 'Fresh Clean Slate ✨',
      roomSummary: 'Zero existing roommates. You set the room culture and study hours!',
      occupantBreakdowns: [],
      aggregatedSynergies: ['Empty room: pick your favorite bed slot and establish your own routine.'],
      aggregatedFrictions: []
    };
  }

  const breakdowns = activeOccupants.map(occ => {
    const profile = occ.roommateProfile || occ;
    return computePairwiseVibe(candidate, {
      ...profile,
      tenantName: occ.tenantName || occ.name || profile.name
    });
  });

  const sumScores = breakdowns.reduce((acc, curr) => acc + curr.overallScore, 0);
  const avgScore = Math.round(sumScores / breakdowns.length);

  let matchLevel = 'Fair Match 👍';
  if (avgScore >= 90) matchLevel = 'Super Vibe 🔥';
  else if (avgScore >= 78) matchLevel = 'Great Match ✨';
  else if (avgScore < 60) matchLevel = 'Mismatched ⚠️';

  // Aggregate all unique synergies and frictions
  const synSet = new Set();
  const fricSet = new Set();
  breakdowns.forEach(b => {
    b.synergies.forEach(s => synSet.add(s));
    b.frictions.forEach(f => fricSet.add(f));
  });

  return {
    overallRoomVibe: avgScore,
    matchLevel,
    occupantCount: activeOccupants.length,
    occupantBreakdowns: breakdowns,
    aggregatedSynergies: Array.from(synSet),
    aggregatedFrictions: Array.from(fricSet)
  };
}

module.exports = {
  computePairwiseVibe,
  computeRoomVibe,
  normalizeExamCategory,
  normalizeSleep,
  normalizeNoise,
  normalizeDiet
};
