/**
 * GharDekho — Bilingual Voice Search & Hinglish Intent Parser (Slice P11)
 * Parses spoken voice transcripts in Hindi, English, and Hinglish into structured search filters.
 * Example phrases:
 *  - "Allen ke paas single room 5000 ke andar" -> { query: 'Allen', sharing: 'single', budgetMax: 5000 }
 *  - "Talwandi mein double sharing with RO water" -> { cityOrLocality: 'Talwandi', sharing: 'double', amenities: ['ro_water'] }
 *  - "Resonance coaching girls hostel with power backup" -> { query: 'Resonance', gender: 'female', amenities: ['power_backup'] }
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GharVoiceSearch = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Coaching institutes & landmark synonyms
  const COACHING_HUBS = [
    { key: 'allen', matches: ['allen', 'एलेन', 'एलन', 'alan', 'allen samarth', 'allen sankalp'] },
    { key: 'resonance', matches: ['resonance', 'रेजोनेंस', 'रेज़ोनेंस', 'reso'] },
    { key: 'fiitjee', matches: ['fiitjee', 'फिटजी', 'fitjee'] },
    { key: 'aakash', matches: ['aakash', 'आकाश', 'akash', 'byjus'] },
    { key: 'motion', matches: ['motion', 'मोशन'] },
    { key: 'pw', matches: ['physics wallah', 'pw', 'विद्यापीठ', 'vidyapeeth'] }
  ];

  // Locality & city synonyms
  const LOCALITIES = [
    { key: 'Talwandi', matches: ['talwandi', 'तलवंडी', 'तलवन्डी'] },
    { key: 'Mahaveer Nagar', matches: ['mahaveer nagar', 'महावीर नगर', 'mahavir'] },
    { key: 'Kunhari', matches: ['kunhari', 'कुन्हाड़ी', 'कुन्हाडी'] },
    { key: 'Coral Park', matches: ['coral park', 'कोरल पार्क'] },
    { key: 'Viman Nagar', matches: ['viman nagar', 'विमान नगर'] },
    { key: 'Kothrud', matches: ['kothrud', 'कोथरुड'] },
    { key: 'Laxmi Nagar', matches: ['laxmi nagar', 'लक्ष्मी नगर'] }
  ];

  // Sharing type mapping
  const SHARING_PATTERNS = [
    { type: 'single', matches: ['single', '1 bed', 'one bed', 'सिंगल', 'अकेला', 'एक बेड', 'khud ka room'] },
    { type: 'double', matches: ['double', '2 bed', 'two bed', 'डबल', 'दोस्त के साथ', 'दो बेड'] },
    { type: 'triple', matches: ['triple', '3 bed', 'three bed', 'ट्रिपल', 'तीन बेड'] },
    { type: 'four_bed_split', matches: ['4 bed', 'four bed', '4 sharing', 'चार बेड'] }
  ];

  // Gender preference patterns
  const GENDER_PATTERNS = [
    { gender: 'female', matches: ['girls', 'girls pg', 'ladkiyon', 'लड़कियों', 'गर्ल्स', 'female'] },
    { gender: 'male', matches: ['boys', 'boys pg', 'ladko', 'लड़कों', 'बॉयज', 'male'] }
  ];

  // Amenity patterns
  const AMENITY_PATTERNS = [
    { key: 'wifi', matches: ['wifi', 'wi-fi', 'इंटरनेट', 'वाईफाई', 'internet'] },
    { key: 'power_backup', matches: ['power backup', 'generator', 'लाइट बैकअप', 'बिजली बैकअप', 'inverter'] },
    { key: 'ro_water', matches: ['ro water', 'drinking water', 'पीने का पानी', 'आरो'] },
    { key: 'attached_bath', matches: ['attached bathroom', 'attached bath', 'अटैच्ड बाथरूम', 'पर्सनल लेट बाथ'] },
    { key: 'mess_food', matches: ['mess', 'food', 'tiffin', 'खाना', 'मेस', 'टिफ़िन'] }
  ];

  function parseVoiceTranscript(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      return { raw: '', query: '', filters: {} };
    }

    const clean = rawText.trim().toLowerCase();
    const result = {
      raw: rawText.trim(),
      query: '',
      filters: {}
    };

    // 1. Extract Budget Max (e.g., "5000 ke andar", "under 4000", "below 6000", "₹4500", "4 हजार")
    const budgetMatch = clean.match(/(?:under|below|max|maximum|budget|andar|tak|rupaye|₹)?\s*(\d{3,5})\s*(?:rupees|rs|inr|tak|ke andar|se kam)?/i);
    if (budgetMatch && budgetMatch[1]) {
      const amount = parseInt(budgetMatch[1], 10);
      if (amount >= 1500 && amount <= 30000) {
        result.filters.maxBudget = amount;
      }
    } else {
      // Check for Hindi हजार (hazaar / k)
      const hazaarMatch = clean.match(/(\d+)\s*(?:hazaar|हजार|k)/i);
      if (hazaarMatch && hazaarMatch[1]) {
        result.filters.maxBudget = parseInt(hazaarMatch[1], 10) * 1000;
      }
    }

    // 2. Extract Coaching Landmark
    for (const coach of COACHING_HUBS) {
      if (coach.matches.some((m) => clean.includes(m))) {
        result.filters.coaching = coach.key;
        if (!result.query) result.query = coach.key;
        break;
      }
    }

    // 3. Extract Locality
    for (const loc of LOCALITIES) {
      if (loc.matches.some((m) => clean.includes(m))) {
        result.filters.locality = loc.key;
        if (!result.query) result.query = loc.key;
        break;
      }
    }

    // 4. Extract Sharing Preference
    for (const share of SHARING_PATTERNS) {
      if (share.matches.some((m) => clean.includes(m))) {
        result.filters.sharingType = share.type;
        break;
      }
    }

    // 5. Extract Gender Preference
    for (const g of GENDER_PATTERNS) {
      if (g.matches.some((m) => clean.includes(m))) {
        result.filters.gender = g.gender;
        break;
      }
    }

    // 6. Extract Amenities
    const amenities = [];
    for (const amen of AMENITY_PATTERNS) {
      if (amen.matches.some((m) => clean.includes(m))) {
        amenities.push(amen.key);
      }
    }
    if (amenities.length > 0) {
      result.filters.amenities = amenities;
    }

    // If query is still empty, use cleaned raw terms stripped of filler words
    if (!result.query) {
      const stopwords = ['chahiye', 'mein', 'ke', 'paas', 'room', 'hostel', 'pg', 'dekho', 'hai', 'kripya', 'for', 'in', 'near'];
      const words = clean.split(/\s+/).filter(w => !stopwords.includes(w) && isNaN(Number(w)));
      result.query = words.join(' ');
    }

    return result;
  }

  // Voice Recognizer Controller for Web Speech API
  class VoiceSearchController {
    constructor(options = {}) {
      this.isListening = false;
      this.recognition = null;
      this.onResult = options.onResult || (() => {});
      this.onError = options.onError || (() => {});
      this.onStateChange = options.onStateChange || (() => {});
      this.lang = options.lang || 'hi-IN'; // Default Hindi / Hinglish

      this.initRecognition();
    }

    initRecognition() {
      if (typeof window === 'undefined') return;
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        this.isSupported = false;
        return;
      }
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = this.lang;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStateChange({ isListening: true });
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const parsed = parseVoiceTranscript(transcript);
        this.onResult({ transcript, parsed });
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        this.onStateChange({ isListening: false });
        this.onError(event);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.onStateChange({ isListening: false });
      };
    }

    startListening(lang) {
      if (!this.recognition) return false;
      if (lang) this.recognition.lang = lang;
      try {
        this.recognition.start();
        return true;
      } catch (e) {
        return false;
      }
    }

    stopListening() {
      if (!this.recognition) return;
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  return {
    parseVoiceTranscript,
    VoiceSearchController,
    COACHING_HUBS,
    LOCALITIES,
    SHARING_PATTERNS
  };
});
