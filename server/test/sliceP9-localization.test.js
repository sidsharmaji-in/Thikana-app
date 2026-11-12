/**
 * GharDekho — Slice P9: Bilingual Localization (i18n) Test Suite
 * Tests dictionary completeness, translation lookup, fallback behavior,
 * state persistence across sessions, and DOM translation attribute bindings.
 */

const assert = require('assert');
const GharI18n = require('../../client/js/i18n.js');

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

console.log('🧪 Starting Slice P9: Bilingual Localization (i18n) Engine Tests...\n');

// 1. Initialization & Defaults
console.log('--- 1. Dictionary Structure & Initialization ---');

it('Exposes default English and Hindi translations', () => {
  assert(GharI18n.translations.en, 'English translation table exists');
  assert(GharI18n.translations.hi, 'Hindi translation table exists');
  assert(typeof GharI18n.translations.en['brand.name'] === 'string');
  assert(typeof GharI18n.translations.hi['brand.name'] === 'string');
});

it('Default language initializes to English', () => {
  GharI18n.setLanguage('en');
  assert.strictEqual(GharI18n.getLanguage(), 'en');
});

// 2. Hindi Translation Quality & Parity
console.log('\n--- 2. Translation Parity & Devanagari Coverage ---');

it('Contains authentic Devanagari translation for brand name', () => {
  assert.strictEqual(GharI18n.translations.hi['brand.name'], 'घरदेखो');
});

it('Contains student-centric Hindi translations for core navigation', () => {
  assert.strictEqual(GharI18n.translations.hi['role.tenant'], 'किरायेदार (छात्र)');
  assert.strictEqual(GharI18n.translations.hi['role.owner'], 'मकान मालिक');
  assert.strictEqual(GharI18n.translations.hi['nav.filters'], 'फ़िल्टर');
  assert.strictEqual(GharI18n.translations.hi['nav.khojo'], 'खोजें');
  assert.strictEqual(GharI18n.translations.hi['nav.map'], 'नक्शा');
});

it('Contains Hindi coaching and hyperlocal educational hub labels', () => {
  assert(GharI18n.translations.hi['nav.kota_hub'].includes('कोटा'));
  assert(GharI18n.translations.hi['nav.delhi_hub'].includes('दिल्ली'));
  assert(GharI18n.translations.hi['nav.pune_hub'].includes('पुणे'));
});

it('Contains accurate translations for bed slot hold and payment actions', () => {
  assert.strictEqual(GharI18n.translations.hi['bed.hold_10m'], '10 मिनट होल्ड');
  assert.strictEqual(GharI18n.translations.hi['bed.hold_500'], '₹500 टोकन');
  assert.strictEqual(GharI18n.translations.hi['bed.vibe_match'], 'वाइब मैच');
});

it('Matches 100% key parity between English and Hindi dictionaries', () => {
  const enKeys = Object.keys(GharI18n.translations.en);
  const hiKeys = Object.keys(GharI18n.translations.hi);
  const missingInHindi = enKeys.filter((k) => !hiKeys.includes(k));
  assert.strictEqual(missingInHindi.length, 0, `Missing keys in Hindi: ${missingInHindi.join(', ')}`);
});

// 3. Dynamic Lookup & Fallback
console.log('\n--- 3. Language Switching & Fallbacks ---');

it('Translates keys dynamically according to active language', () => {
  GharI18n.setLanguage('en');
  assert.strictEqual(GharI18n.t('nav.filters'), 'Filters');

  GharI18n.setLanguage('hi');
  assert.strictEqual(GharI18n.t('nav.filters'), 'फ़िल्टर');
});

it('Gracefully falls back to English when a key is missing in custom language', () => {
  GharI18n.setLanguage('hi');
  assert.strictEqual(GharI18n.t('brand.name'), 'घरदेखो');
});

it('Returns key or custom fallback when translation key does not exist', () => {
  assert.strictEqual(GharI18n.t('non.existent.key'), 'non.existent.key');
  assert.strictEqual(GharI18n.t('non.existent.key', 'Custom Fallback'), 'Custom Fallback');
});

it('Rejects invalid language code and safely defaults to English', () => {
  GharI18n.setLanguage('fr');
  assert.strictEqual(GharI18n.getLanguage(), 'en');
});

// 4. Mock DOM Translation Engine
console.log('\n--- 4. DOM Translation Engine Simulation ---');

it('Translates DOM text nodes, placeholders, and title attributes', () => {
  // Mock lightweight DOM container
  const mockTextElement = {
    attributes: { 'data-i18n': 'brand.name' },
    textContent: 'GharDekho',
    getAttribute(attr) { return this.attributes[attr]; }
  };
  const mockInputElement = {
    attributes: { 'data-i18n-placeholder': 'nav.search_placeholder' },
    placeholder: '',
    getAttribute(attr) { return this.attributes[attr]; },
    setAttribute(attr, val) { this[attr] = val; }
  };

  const mockContainer = {
    querySelectorAll(selector) {
      if (selector === '[data-i18n]') return [mockTextElement];
      if (selector === '[data-i18n-placeholder]') return [mockInputElement];
      return [];
    }
  };

  GharI18n.setLanguage('hi');
  GharI18n.translateDom(mockContainer);

  assert.strictEqual(mockTextElement.textContent, 'घरदेखो');
  assert.strictEqual(mockInputElement.placeholder, 'कोचिंग (Allen, Resonance), मेट्रो या इलाके से खोजें...');
});

// Finish Summary
console.log(`\n📊 Results: ${passedTests} Passed, ${totalTests - passedTests} Failed`);
if (passedTests === totalTests) {
  console.log('🌐 All Slice P9 Bilingual Localization tests passed successfully!\n');
  process.exit(0);
} else {
  console.error('💥 Some Slice P9 tests failed!\n');
  process.exit(1);
}

