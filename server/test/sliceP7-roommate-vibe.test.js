// Slice P7: Roommate Vibe & Compatibility Matching Engine Tests
const http = require('http');
const { computePairwiseVibe, computeRoomVibe, normalizeSleep, normalizeNoise, normalizeDiet, normalizeExamCategory } = require('../src/services/vibeMatcher');
const { roommateService } = require('../src/services/roommateService');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

function request(apiPath, options = {}, data = null) {
  const reqOptions = {
    hostname: '127.0.0.1',
    port: 4000,
    path: apiPath,
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-bypass-rate-limit': 'test',
      ...(options.headers || {})
    }
  };
  return makeRequest(reqOptions, data);
}

async function runTests() {
  console.log('🧪 Starting Slice P7: Roommate Vibe & Compatibility Engine Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- 1. Algorithmic Normalization Tests ---
  console.log('--- 1. Normalization & Heuristic Parsers ---');
  assert(normalizeSleep('Early bird wake 5:00 AM') === 'early_bird', 'Normalizes early bird schedule');
  assert(normalizeSleep('Night owl past 2 AM') === 'night_owl', 'Normalizes night owl schedule');
  assert(normalizeSleep('Flexible 11:30 PM') === 'balanced', 'Normalizes balanced schedule');

  assert(normalizeNoise('Pin drop silence during revision') === 'silent', 'Normalizes silent noise preference');
  assert(normalizeNoise('Lofi study music') === 'mild', 'Normalizes mild music preference');
  assert(normalizeNoise('Group doubts discussion') === 'discussion', 'Normalizes discussion preference');

  assert(normalizeDiet('Strictly pure vegetarian') === 'pure_veg', 'Normalizes pure veg diet');
  assert(normalizeDiet('Eggetarian') === 'eggetarian', 'Normalizes eggetarian diet');
  assert(normalizeDiet('Non-veg friendly') === 'non_veg_ok', 'Normalizes non-veg diet');

  assert(normalizeExamCategory('Allen 12th JEE Advanced') === 'JEE', 'Normalizes JEE exam category');
  assert(normalizeExamCategory('Resonance Medical NEET') === 'NEET', 'Normalizes NEET exam category');
  assert(normalizeExamCategory('UPSC Civil Services') === 'GOVT', 'Normalizes GOVT exam category');

  // --- 2. Pairwise Vibe Matching Tests ---
  console.log('\n--- 2. Pairwise Compatibility Scoring ---');
  const perfectStudentA = {
    name: 'Aman',
    sleepSchedule: 'early_bird',
    studyNoisePreference: 'silent',
    targetExam: 'JEE',
    diet: 'pure_veg',
    cleanlinessLevel: 4,
    acPreference: 'moderate'
  };

  const perfectStudentB = {
    name: 'Bharat',
    sleepSchedule: 'early_bird',
    studyNoisePreference: 'silent',
    targetExam: 'JEE',
    diet: 'pure_veg',
    cleanlinessLevel: 4,
    acPreference: 'moderate'
  };

  const perfectMatch = computePairwiseVibe(perfectStudentA, perfectStudentB);
  assert(perfectMatch.overallScore === 100, `Identical profiles score 100% (got: ${perfectMatch.overallScore})`);
  assert(perfectMatch.matchLevel === 'Super Vibe 🔥', `Identical profiles categorized as 'Super Vibe 🔥' (got: ${perfectMatch.matchLevel})`);
  assert(perfectMatch.dimensions.sleep.score === 25, 'Sleep dimension gives full 25 points');
  assert(perfectMatch.dimensions.studyNoise.score === 25, 'Study noise dimension gives full 25 points');
  assert(perfectMatch.dimensions.examSynergy.score === 20, 'Exam synergy dimension gives full 20 points');
  assert(perfectMatch.dimensions.diet.score === 15, 'Diet dimension gives full 15 points');
  assert(perfectMatch.synergies.length >= 3, `Discovers positive synergies (found: ${perfectMatch.synergies.length})`);
  assert(perfectMatch.frictions.length === 0, 'Zero friction points for identical habits');

  const clashingStudent = {
    name: 'Vikram',
    sleepSchedule: 'night_owl',
    studyNoisePreference: 'discussion',
    targetExam: 'COLLEGE',
    diet: 'non_veg_ok',
    cleanlinessLevel: 1,
    acPreference: 'heavy_night'
  };

  const clashMatch = computePairwiseVibe(perfectStudentA, clashingStudent);
  assert(clashMatch.overallScore < 50, `Clashing habits yield score < 50 (got: ${clashMatch.overallScore})`);
  assert(clashMatch.matchLevel === 'Mismatched ⚠️', `Clashing habits categorized as 'Mismatched ⚠️' (got: ${clashMatch.matchLevel})`);
  assert(clashMatch.frictions.length >= 3, `Identifies real friction points (found: ${clashMatch.frictions.length})`);

  // --- 3. Room-Level Aggregate Compatibility Tests ---
  console.log('\n--- 3. Room-Level Compatibility Engine ---');
  const emptyRoomResult = computeRoomVibe(perfectStudentA, []);
  assert(emptyRoomResult.overallRoomVibe === 100, 'Empty room returns 100% vibe score');
  assert(emptyRoomResult.matchLevel === 'Fresh Clean Slate ✨', 'Empty room marked as Fresh Clean Slate');

  const multiOccupantResult = computeRoomVibe(perfectStudentA, [
    { tenantName: 'Aryan', roommateProfile: perfectStudentB },
    { tenantName: 'Vikram', roommateProfile: clashingStudent }
  ]);
  assert(multiOccupantResult.occupantCount === 2, 'Evaluates both occupants in shared room');
  assert(multiOccupantResult.overallRoomVibe > 50 && multiOccupantResult.overallRoomVibe < 90, 
    `Calculates balanced average room vibe (got: ${multiOccupantResult.overallRoomVibe}%)`);
  assert(multiOccupantResult.occupantBreakdowns.length === 2, 'Preserves individual occupant breakdowns');

  // --- 4. HTTP API Endpoints Verification ---
  console.log('\n--- 4. HTTP API Route Endpoints ---');

  // Test GET /api/roommates/profile/me
  const myProfileRes = await request('/api/roommates/profile/me');
  assert(myProfileRes.status === 200, 'GET /api/roommates/profile/me returns 200 OK');
  assert(myProfileRes.data.success === true, 'Profile response indicates success: true');
  assert(Boolean(myProfileRes.data.data.userId), 'Profile contains userId');
  assert(Array.isArray(myProfileRes.data.data.habits), 'Profile contains habit tags');

  // Test PUT /api/roommates/profile/me (Validation & Upsert)
  const invalidUpdateRes = await request('/api/roommates/profile/me', { method: 'PUT' }, {
    cleanlinessLevel: 10 // Invalid (> 5)
  });
  assert(invalidUpdateRes.status === 400, 'Rejects invalid cleanliness level (> 5) with HTTP 400');
  assert(invalidUpdateRes.data.error === 'INVALID_CLEANLINESS_LEVEL', 'Returns descriptive validation error code');

  const validUpdateRes = await request('/api/roommates/profile/me', { method: 'PUT' }, {
    userId: 'test-user-p7',
    name: 'Test Aspirant',
    city: 'Kota',
    targetExam: 'NEET',
    sleepSchedule: 'early_bird',
    studyNoisePreference: 'silent',
    diet: 'pure_veg',
    cleanlinessLevel: 5,
    bio: 'NEET 2027 aspirant aiming for SMS Medical College Jaipur.'
  });
  assert(validUpdateRes.status === 200, 'PUT /api/roommates/profile/me returns 200 OK for valid payload');
  assert(validUpdateRes.data.data.cleanlinessLevel === 5, 'Cleanliness level successfully updated to 5');
  assert(validUpdateRes.data.data.habits.includes('Early Bird 🌅'), 'Auto-generated Early Bird habit tag');
  assert(validUpdateRes.data.data.habits.includes('Pure Veg 🥗'), 'Auto-generated Pure Veg habit tag');

  // Test POST /api/roommates/compatibility/compare
  const compareRes = await request('/api/roommates/compatibility/compare', { method: 'POST' }, {
    profileA: perfectStudentA,
    profileB: perfectStudentB
  });
  assert(compareRes.status === 200, 'POST /api/roommates/compatibility/compare returns 200 OK');
  assert(compareRes.data.data.overallScore === 100, 'Comparison API correctly reports 100% match');
  assert(compareRes.data.data.dimensions.sleep.max === 25, 'Dimensions breakdown returns sleep max 25');

  const compareMissingRes = await request('/api/roommates/compatibility/compare', { method: 'POST' }, {});
  assert(compareMissingRes.status === 400, 'Rejects comparison with missing profiles with HTTP 400');

  // Test GET /api/roommates/rooms/:propertyId/:roomId/vibe-check
  const roomVibeRes = await request('/api/roommates/rooms/prop-kota-01/room-k1/vibe-check');
  assert(roomVibeRes.status === 200, 'GET room vibe-check returns 200 OK for prop-kota-01 room-k1');
  assert(roomVibeRes.data.success === true, 'Room vibe-check returns success: true');
  assert(typeof roomVibeRes.data.data.overallRoomVibe === 'number', `Room vibe returns numeric score: ${roomVibeRes.data.data.overallRoomVibe}%`);
  assert(roomVibeRes.data.data.occupiedSlotsCount >= 1, `Accurately reports occupied slots count: ${roomVibeRes.data.data.occupiedSlotsCount}`);
  assert(Array.isArray(roomVibeRes.data.data.occupantBreakdowns), 'Provides breakdown for each room occupant');

  // Test Room Vibe 404 for invalid property
  const invalidRoomVibeRes = await request('/api/roommates/rooms/invalid-prop-id/room-k1/vibe-check');
  assert(invalidRoomVibeRes.status === 404, 'Returns 404 Not Found for non-existent property');

  // Test GET /api/roommates/explore
  const exploreRes = await request('/api/roommates/explore?city=Kota');
  assert(exploreRes.status === 200, 'GET /api/roommates/explore returns 200 OK');
  assert(exploreRes.data.data.total >= 3, `Discovers roommates in Kota (found: ${exploreRes.data.data.total})`);
  assert(exploreRes.data.data.roommates[0].city === 'Kota', 'All returned roommates belong to Kota');

  // Test explore with NEET filter
  const exploreNeetRes = await request('/api/roommates/explore?city=Kota&targetExam=NEET');
  assert(exploreNeetRes.status === 200, 'GET /api/roommates/explore with targetExam=NEET returns 200 OK');
  assert(exploreNeetRes.data.data.roommates.every(r => r.targetExam === 'NEET'), 'All filtered roommates have targetExam=NEET');

  // --- Summary ---
  console.log(`\n📊 Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('✨ All Slice P7 Roommate Vibe & Compatibility tests passed successfully!\n');
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

