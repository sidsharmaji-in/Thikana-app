/**
 * GharDekho — Bilingual Voice Search & Hinglish Intent Parser Test Suite (Slice P11)
 * Validates natural voice parsing for coaching hubs (Allen, Resonance), localities (Talwandi),
 * budgets in rupees and hazaar, sharing occupancy, gender preferences, and amenities.
 */

const assert = require('assert');
const { parseVoiceTranscript } = require('../../client/js/voiceSearch.js');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✅ PASS: ${desc}`);
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(`     Error: ${err.message}`);
  }
}

console.log('🧪 Starting Slice P11: Bilingual Voice Search & Hinglish Parser Tests...\n');

// 1. Coaching Landmark Intent
console.log('--- 1. Coaching Landmark & Hub Extraction ---');

it('Extracts Allen coaching from English spoken phrase', () => {
  const res = parseVoiceTranscript('Show me rooms near Allen coaching');
  assert.strictEqual(res.filters.coaching, 'allen');
  assert(res.query.includes('allen'));
});

it('Extracts Allen coaching from Devanagari Hindi spoken phrase', () => {
  const res = parseVoiceTranscript('एलेन के पास कमरा चाहिए');
  assert.strictEqual(res.filters.coaching, 'allen');
});

it('Extracts Resonance coaching from Hinglish phrase', () => {
  const res = parseVoiceTranscript('Resonance coaching ke paas PG hostel');
  assert.strictEqual(res.filters.coaching, 'resonance');
});

// 2. Budget Extraction (Numeric & Hazaar)
console.log('\n--- 2. Budget Extraction & Currency Normalization ---');

it('Parses explicit numeric budget with "under 5000"', () => {
  const res = parseVoiceTranscript('Allen ke paas under 5000');
  assert.strictEqual(res.filters.maxBudget, 5000);
});

it('Parses budget with Hindi suffix "4500 se kam"', () => {
  const res = parseVoiceTranscript('Talwandi mein 4500 se kam room');
  assert.strictEqual(res.filters.maxBudget, 4500);
});

it('Parses Hindi "हजार" (hazaar) multiplier into integer (4 हजार -> 4000)', () => {
  const res = parseVoiceTranscript('4 हजार के अंदर कमरा');
  assert.strictEqual(res.filters.maxBudget, 4000);
});

// 3. Sharing Occupancy & Gender Filters
console.log('\n--- 3. Sharing Occupancy & Gender Preference ---');

it('Identifies single occupancy room request', () => {
  const res = parseVoiceTranscript('Single room with attached bathroom');
  assert.strictEqual(res.filters.sharingType, 'single');
});

it('Identifies double sharing room in Hindi ("दोस्त के साथ" / "double")', () => {
  const res = parseVoiceTranscript('Talwandi double sharing PG');
  assert.strictEqual(res.filters.sharingType, 'double');
});

it('Identifies female/girls hostel preference in Hindi ("लड़कियों का हॉस्टल")', () => {
  const res = parseVoiceTranscript('Allen ke paas लड़कियों का हॉस्टल');
  assert.strictEqual(res.filters.gender, 'female');
});

it('Identifies male/boys hostel preference in Hinglish ("boys PG")', () => {
  const res = parseVoiceTranscript('Kunhari boys PG with food');
  assert.strictEqual(res.filters.gender, 'male');
});

// 4. Hyperlocal Amenity Intent Parsing
console.log('\n--- 4. Hyperlocal Amenities Intent Parsing ---');

it('Extracts RO drinking water and Power Backup amenities', () => {
  const res = parseVoiceTranscript('Room with generator power backup and RO water');
  assert(res.filters.amenities.includes('power_backup'));
  assert(res.filters.amenities.includes('ro_water'));
});

it('Extracts mess/food preference in Hindi ("मेस का खाना")', () => {
  const res = parseVoiceTranscript('Talwandi mein mess ka khana chahiye');
  assert(res.filters.amenities.includes('mess_food'));
});

// 5. Complex Multi-Intent Natural Utterances
console.log('\n--- 5. Complex Multi-Intent Natural Utterances ---');

it('Parses complex real-world student search utterance', () => {
  const utterance = 'Allen Samarth ke paas double sharing boys room 4000 ke andar with wifi';
  const res = parseVoiceTranscript(utterance);
  
  assert.strictEqual(res.filters.coaching, 'allen');
  assert.strictEqual(res.filters.sharingType, 'double');
  assert.strictEqual(res.filters.gender, 'male');
  assert.strictEqual(res.filters.maxBudget, 4000);
  assert(res.filters.amenities.includes('wifi'));
});

it('Gracefully handles empty or gibberish input without crashing', () => {
  const res = parseVoiceTranscript('');
  assert.strictEqual(res.raw, '');
  assert.deepStrictEqual(res.filters, {});
});

// Finish Summary
console.log(`\n📊 Results: ${passedTests} Passed, ${totalTests - passedTests} Failed`);
if (passedTests === totalTests) {
  console.log('🎙️ All Slice P11 Bilingual Voice Search tests passed successfully!\n');
  process.exit(0);
} else {
  console.error('💥 Some Slice P11 tests failed!\n');
  process.exit(1);
}
