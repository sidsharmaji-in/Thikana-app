/**
 * GharDekho — Bilingual i18n Translation Dictionary & Engine (Slice P9)
 * Supports English ('en') and Hindi / Hinglish ('hi') with Devanagari script.
 * Tailored for students and parents from Kota, Rajasthan, Bihar, UP, MP & Delhi.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GharI18n = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'ghar_preferred_lang';

  const translations = {
    en: {
      // Brand & Navigation
      'brand.name': 'GharDekho',
      'brand.tagline': 'Zero-Brokerage Student Housing',
      'role.tenant': 'Kirayedaar',
      'role.owner': 'Owner',
      'nav.search_placeholder': 'Search by coaching (Allen, Resonance), metro, locality...',
      'nav.filters': 'Filters',
      'nav.all_cities': 'All Cities',
      'nav.all_hubs': 'All Hubs',
      'nav.kota_hub': '🎯 Kota (NEET/JEE Hub)',
      'nav.pune_hub': '💼 Pune (IT & Colleges)',
      'nav.jaipur_hub': '🎓 Jaipur (MNIT & Uni)',
      'nav.delhi_hub': '🏛️ Delhi (Metro & UPSC)',
      'nav.sign_in': '👤 Sign In',
      'nav.dark_mode': '🌙 Dark Mode',
      'nav.light_mode': '☀️ Light',
      'nav.khojo': 'Khojo',
      'nav.map': 'Map',
      'nav.saved': 'Saved',
      'nav.chat': 'Chat',
      'nav.profile': 'Profile',

      // Listings & Radar
      'listings.verified_students': 'Verified for Students',
      'listings.beds_available': 'Beds Available',
      'listings.per_month': '/month',
      'listings.view_details': 'View Rooms & Beds',
      'listings.shortlist': 'Shortlist',
      'listings.shortlisted': 'Shortlisted',
      'listings.zero_brokerage': '0% Brokerage',
      'listings.verified_badge': 'Verified Listing',
      'listings.coaching_distance': 'from coaching',
      'listings.water_timing': 'Water Schedule',
      'listings.power_backup': 'Power Backup',
      'listings.curfew': 'Curfew Time',

      // Bed Slots & Rooms
      'bed.hold_10m': 'Hold 10m',
      'bed.hold_500': '₹500 Hold',
      'bed.reserved': 'Reserved',
      'bed.occupied': 'Occupied',
      'bed.available': 'Vacant / Available',
      'bed.vibe_match': 'Vibe Match',
      'bed.hold_modal_title': 'Reserve Bed Slot with ₹500 Token Advance',
      'bed.hold_modal_subtitle': '100% Refundable · Holds bed for 24 hours · Digital receipt provided',
      'bed.pay_token_btn': 'Pay ₹500 & Lock for 24 Hours',

      // Filters
      'filter.title': 'Filter Rental Accommodations',
      'filter.max_budget': 'Max Budget (₹/Month)',
      'filter.sharing_type': 'Sharing / Occupancy',
      'filter.single_room': 'Single Room (1-Bed)',
      'filter.double_sharing': 'Double Sharing (2-Bed)',
      'filter.triple_sharing': 'Triple Sharing (3-Bed)',
      'filter.four_bed_split': '4-Bed Split',
      'filter.amenities': 'Essential Hyperlocal Amenities',
      'filter.wifi': 'High-Speed WiFi',
      'filter.ro_water': 'RO Drinking Water',
      'filter.power_backup': 'Generator Power Backup',
      'filter.attached_bath': 'Attached Bathroom',
      'filter.mess_food': 'Mess / Food Included',
      'filter.apply': 'Apply Filters',
      'filter.reset': 'Reset',

      // Owner Wizard
      'wizard.step1_title': 'Basic Property Information',
      'wizard.step2_title': 'Rooms, Sharing & Bed Slots',
      'wizard.step3_title': 'Hyperlocal Reality Checks',
      'wizard.step4_title': 'High-Quality Photographs',
      'wizard.step5_title': 'Review & Publish Listing',
      'wizard.publish_btn': 'Publish Listing',

      // Toasts & Alerts
      'toast.lang_switched': '🌐 Language changed to English',
      'toast.lang_switched_hi': '🌐 भाषा बदली गई: हिंदी (Devanagari Active)',
      'toast.otp_sent': 'OTP sent to mobile number',
      'toast.slot_locked': 'Bed slot locked for 10 minutes',
      'toast.token_paid': '₹500 Token advance paid! Bed held for 24 hours.'
    },

    hi: {
      // Brand & Navigation
      'brand.name': 'घरदेखो',
      'brand.tagline': 'जीरो-दलाली छात्र आवास एवं पीजी',
      'role.tenant': 'किरायेदार (छात्र)',
      'role.owner': 'मकान मालिक',
      'nav.search_placeholder': 'कोचिंग (Allen, Resonance), मेट्रो या इलाके से खोजें...',
      'nav.filters': 'फ़िल्टर',
      'nav.all_cities': 'सभी शहर',
      'nav.all_hubs': 'सभी केंद्र',
      'nav.kota_hub': '🎯 कोटा (NEET/JEE केंद्र)',
      'nav.pune_hub': '💼 पुणे (आईटी व कॉलेज)',
      'nav.jaipur_hub': '🎓 जयपुर (MNIT व वि.वि.)',
      'nav.delhi_hub': '🏛️ दिल्ली (मेट्रो व UPSC)',
      'nav.sign_in': '👤 लॉगिन करें',
      'nav.dark_mode': '🌙 डार्क मोड',
      'nav.light_mode': '☀️ लाइट',
      'nav.khojo': 'खोजें',
      'nav.map': 'नक्शा',
      'nav.saved': 'पसंदीदा',
      'nav.chat': 'बातचीत',
      'nav.profile': 'प्रोफ़ाइल',

      // Listings & Radar
      'listings.verified_students': 'छात्रों हेतु सत्यापित',
      'listings.beds_available': 'बेड उपलब्ध',
      'listings.per_month': '/माह',
      'listings.view_details': 'कमरे व बेड देखें',
      'listings.shortlist': 'पसंद करें',
      'listings.shortlisted': 'पसंदीदा',
      'listings.zero_brokerage': '0% दलाली',
      'listings.verified_badge': 'सत्यापित पीजी/हॉस्टल',
      'listings.coaching_distance': 'कोचिंग से दूरी',
      'listings.water_timing': 'पानी का समय (जल आपूर्ति)',
      'listings.power_backup': 'बिजली बैकअप',
      'listings.curfew': 'हॉस्टल बंद होने का समय',

      // Bed Slots & Rooms
      'bed.hold_10m': '10 मिनट होल्ड',
      'bed.hold_500': '₹500 टोकन',
      'bed.reserved': 'आरक्षित (होल्ड)',
      'bed.occupied': 'भरा हुआ',
      'bed.available': 'खाली बेड',
      'bed.vibe_match': 'वाइब मैच',
      'bed.hold_modal_title': '₹500 टोकन पेशगी देकर 24 घंटे हेतु बेड आरक्षित करें',
      'bed.hold_modal_subtitle': '100% वापस योग्य · 24 घंटे बेड सुरक्षित · डिजिटल रसीद उपलब्ध',
      'bed.pay_token_btn': '₹500 जमा करें और 24 घंटे के लिए लॉक करें',

      // Filters
      'filter.title': 'किराये के कमरे एवं पीजी फ़िल्टर करें',
      'filter.max_budget': 'अधिकतम बजट (₹/माह)',
      'filter.sharing_type': 'कमरा शेयरिंग प्रकार',
      'filter.single_room': 'सिंगल कमरा (1 बेड)',
      'filter.double_sharing': 'डबल शेयरिंग (2 बेड)',
      'filter.triple_sharing': 'ट्रिपल शेयरिंग (3 बेड)',
      'filter.four_bed_split': '4-बेड शेयरिंग',
      'filter.amenities': 'अति आवश्यक स्थानीय सुविधाएं',
      'filter.wifi': 'हाई-स्पीड वाई-फ़ाई',
      'filter.ro_water': 'आर.ओ. पीने का पानी',
      'filter.power_backup': 'जेनरेटर बिजली बैकअप',
      'filter.attached_bath': 'अटैच्ड बाथरूम',
      'filter.mess_food': 'मेस का खाना उपलब्ध',
      'filter.apply': 'फ़िल्टर लागू करें',
      'filter.reset': 'रीसेट करें',

      // Owner Wizard
      'wizard.step1_title': 'कमरे/हॉस्टल की बुनियादी जानकारी',
      'wizard.step2_title': 'कमरे, शेयरिंग और बेड स्लॉट',
      'wizard.step3_title': 'जमीनी हकीकत (पानी, बिजली, नियम)',
      'wizard.step4_title': 'कमरे की असली तस्वीरें',
      'wizard.step5_title': 'जांचें और प्रकाशित करें',
      'wizard.publish_btn': 'कमरा लिस्ट करें',

      // Toasts & Alerts
      'toast.lang_switched': '🌐 Language changed to English',
      'toast.lang_switched_hi': '🌐 भाषा बदली गई: हिंदी (देवनागरी सक्रिय)',
      'toast.otp_sent': 'मोबाइल नंबर पर OTP भेजा गया',
      'toast.slot_locked': 'बेड स्लॉट 10 मिनट के लिए लॉक हुआ',
      'toast.token_paid': '₹500 टोकन जमा हुआ! बेड 24 घंटे के लिए आरक्षित।'
    }
  };

  let currentLang = 'en';

  function init() {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'hi' || saved === 'en') {
          currentLang = saved;
        }
      }
    } catch (e) {
      // Local storage unaccessible
    }
    return currentLang;
  }

  function getLanguage() {
    return currentLang;
  }

  function setLanguage(lang) {
    if (lang !== 'en' && lang !== 'hi') {
      lang = 'en';
    }
    currentLang = lang;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, lang);
      }
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('lang', lang);
        if (lang === 'hi') {
          document.documentElement.classList.add('lang-hi');
        } else {
          document.documentElement.classList.remove('lang-hi');
        }
      }
    } catch (e) {}
    return currentLang;
  }

  function t(key, fallback) {
    const dict = translations[currentLang] || translations.en;
    if (dict && typeof dict[key] === 'string') {
      return dict[key];
    }
    const enDict = translations.en;
    if (enDict && typeof enDict[key] === 'string') {
      return enDict[key];
    }
    return fallback !== undefined ? fallback : key;
  }

  function translateDom(container) {
    const rootEl = container || (typeof document !== 'undefined' ? document : null);
    if (!rootEl || typeof rootEl.querySelectorAll !== 'function') return;

    // Elements with data-i18n
    const translatable = rootEl.querySelectorAll('[data-i18n]');
    translatable.forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        const translated = t(key);
        if (translated) {
          el.textContent = translated;
        }
      }
    });

    // Elements with data-i18n-placeholder
    const inputs = rootEl.querySelectorAll('[data-i18n-placeholder]');
    inputs.forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        const translated = t(key);
        if (translated) {
          el.setAttribute('placeholder', translated);
        }
      }
    });

    // Elements with data-i18n-title
    const titled = rootEl.querySelectorAll('[data-i18n-title]');
    titled.forEach((el) => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        const translated = t(key);
        if (translated) {
          el.setAttribute('title', translated);
        }
      }
    });
  }

  return {
    init,
    getLanguage,
    setLanguage,
    t,
    translateDom,
    translations,
    STORAGE_KEY
  };
});

