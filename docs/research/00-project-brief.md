# Project Brief: GharDekho 🏠

## 1. One-Line Problem Statement
Students and young working professionals relocating to Tier 1–3 Indian coaching and IT hubs (Kota, Pune, Jaipur, Delhi) face exploitation, fake broker listings, hidden utility schedules, and double-booking anxiety when searching for affordable, verified shared PG rooms and bed slots.

## 2. Users and Buyers
- **Primary Demand Users (Kirayedaar / Tenants):**
  - **Aspirants & Students:** 17–23 year olds moving for NEET/JEE/UPSC coaching (e.g. Kota Vigyan Nagar/Talwandi, Delhi Mukherjee Nagar/Old Rajinder Nagar) on tight monthly budgets (₹2,500 – ₹7,000/head).
  - **Young Professionals:** 21–28 year olds starting IT/corporate jobs (e.g. Pune Hinjawadi, Bengaluru HSR/Electronic City) needing flexible shared flats or studios.
- **Primary Supply Users (Makan Maalik / Landlords):**
  - Local property owners, hostel superintendents, and PG operators managing 1 to 50 rooms with multiple bed slots looking for zero-brokerage, verified student occupancy and timely rent.
- **Buyers / Monetization:**
  - In MVP: 100% Free for both tenants and owners (network liquidity phase).
  - Post-MVP: Landlords pay for premium featured boosts (₹199–₹499/mo), instant KYC verification shields, and 2% token advance hold fee.

## 3. Domain & Platform
- **Domain:** PropTech / Two-Sided Student Housing & PG Rental Marketplace (India Tier 1–3 focus).
- **Platform:** Mobile-first responsive Web App (PWA) + Headless Playwright automated E2E web suite, built on Node.js/Express, Docker, and PostGIS-ready PostgreSQL architecture.

## 4. Classification
- **Category:** Two-Sided Rental Marketplace & Bed Slot Allocation Engine.
- **Complexity Tier:** **Moderate-to-Complex** (Phone SMS OTP auth, RFC 7519 JWT session rotation, real-time WebSocket pub/sub messaging, 10-minute anti-concurrency distributed bed locking with HTTP 409 conflict interceptors, presigned direct S3/Cloudinary media pipeline, PostGIS geospatial radius indexing).
- **Risk Profile:** **Medium-High** (Handles personal mobile numbers, Aadhaar/DigiLocker KYC documents, identity verification, landlord tenant communication, and physical room visit scheduling).

## 5. Constraints
- **Target Geography:** Indian subcontinent coaching and IT hubs with hyper-localized Indian realities (Jal timing, inverter/generator power backup, attached Western toilet, curfew times, single-girl safety badges).
- **Connectivity:** Must support offline progressive caching (PWA Service Worker) and resilient operation on low-cost Android hardware (e.g. Redmi / Realme on unstable 4G networks).
- **Cost:** Zero external runtime fee dependencies in default development mode (built-in Mock SMS provider, Local Disk media streaming, and in-memory dual-mode repository).
- **Compliance:** Digital Personal Data Protection Act (DPDP Act India 2023), Aadhaar masking (displaying only last 4 digits `XXXXXXXX1234`), and zero stored raw biometric credentials.

## 6. Existing Work Found in Codebase
- **Backend Architecture:** Modular Express server (`server/src/app.js`, `server/src/index.js`) with routes for auth, properties, slots, reviews, inquiries, notifications, media, sync, and health.
- **Dual-Mode Repository:** `server/src/data/repository.js` with in-memory persistence and PostGIS-compatible Prisma schema (`prisma/schema.prisma`).
- **Real-Time Hub:** `server/src/realtime/hub.js` (WebSocket + SSE event hub) for live chat, typing indicators, and visit updates.
- **Bed Lock Service:** `server/src/services/bedLockService.js` (10-minute temporary lease engine with HTTP 409 Conflict handling).
- **Media Pipeline:** `server/src/services/mediaStorage.js` supporting Cloudinary, AWS S3, and Local Disk direct uploads with responsive formats.
- **Frontend Client:** Single-page PWA shell (`client/index.html`, `client/css/styles.css`, `client/js/app.js`) with Mix A+C Design System (Warm Saffron `#FF6B00` + Dark Slate `#06090E`).
- **Test Coverage:** 467 automated tests passing (449 backend integration tests across 13 suites + 18 Playwright headless E2E tests).

## 7. Assumptions to Validate
- `[Assumed]` Students prioritize walking distance to coaching centers (< 500m) and 24x7 power/water over modern luxury amenities.
- `[Assumed]` Independent PG owners will actively manage bed slot availability on a mobile phone if WhatsApp-style instant chat is provided.
- `[Inferred]` Preventing simultaneous double-booking during Kota admission peak cycles (April–June) is the #1 operational hurdle for landlords.

## 8. Open Questions
1. Should Aadhaar DigiLocker verification be strictly mandatory for owners before publishing their first room listing?
2. At what transaction milestone should Razorpay advance token booking fees (₹500 refundable token) be activated?

