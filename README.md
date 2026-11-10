# GharDekho 🏠
### India's Trusted, Zero-Brokerage Student & Professional Rental Marketplace

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build & Tests](https://img.shields.io/badge/Automated%20Tests-227%20Passed%20(100%25)-success.svg)](./docs/TESTLOG.md)
[![OpenAPI 3.0](https://img.shields.io/badge/API%20Spec-OpenAPI%203.0-blue.svg)](./docs/openapi.yaml)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Ready-orange.svg)](./client/sw.js)
[![Accessibility](https://img.shields.io/badge/a11y-TalkBack%20%26%20WCAG%20AA-purple.svg)](./docs/DESIGN.md)

An open-source, mobile-first rental discovery platform designed to solve student housing fragmentation, eliminate broker exploitation, and provide transparent rental listings across Indian education and tech hubs (Kota, Pune, Jaipur, Delhi NCR).

---

## 🌟 The Core Problem We Solve

Every year, millions of students and young professionals relocate to cities like Kota (JEE/NEET coaching), Pune (IT hubs/colleges), and Delhi. They encounter:
1. **The Trust Deficit:** Fear of losing 1–3 months advance deposit on false listings or doctored photos.
2. **Information Asymmetry:** Landlords hiding critical defects (erratic water supply, zero power backup during heatwaves, common bathroom queues).
3. **No Split-Room Engine:** Classifieds list full apartments, leaving students seeking budget ₹3,000–₹5,000/month shared rooms without individual bed tracking.
4. **Broker Exploitation:** Heavy commissions (15 days to 1 month rent) charged by local brokers.

**GharDekho** solves this with an authentic, zero-brokerage, bed-by-bed split room sharing engine, verified hyperlocal realities, and direct Makan Maalik connections.

---

## 🚀 Key Functional Capabilities (Slices 0–8)

### 1. Dual-Role Experience (Kirayedaar ↔ Makan Maalik)
- **Kirayedaar (Tenant):** Search rooms, toggle between List View and Interactive Dark Grid Map, filter by budget, gender, sharing occupancy, and coaching distance.
- **Makan Maalik (Owner):** 5-step listing wizard, photo upload manager, live bed occupancy controls, and direct tenant inquiry management.

### 2. Smart Shared-Room Slot Engine & Roommate Compatibility
- Bed-level state & lock management (`available` -> `reserved` -> `occupied`).
- Concurrency and double-booking prevention (`HTTP 400`).
- **Roommate Vibe Cards:** Study course/exam, sleep habits (Early Bird 🌅 vs Night Owl 🦉), and compatibility vibe score (e.g., 98%).
- **Waitlist Queue Engine:** Join waitlist when all beds are occupied; receive instant alerts when a slot opens up.

### 3. Hyperlocal Indian Realities Checklist
- **Jal Board Water Timing:** 24hr continuous RO drinking water vs fixed morning/evening municipal supply hours.
- **Power Backup Resilience:** 24x7 Generator support vs Inverter backup for continuous study sessions.
- **Bathroom Configurations:** Attached Western with geyser vs Common bathrooms.
- **Nearby Places:** Distance-verified walking times to coaching institutes (Allen Samarth, Resonance), metro stations, and tiffin centers.

### 4. Inquiry & WhatsApp-Style In-App Chat
- Real-time conversation threads with read receipts (`✓` sent, `✓✓` read).
- Quick-reply chips tailored for students and owners.
- In-chat room visit schedule confirmation/rescheduling with automated Concierge notifications.

### 5. Verified Resident Reviews & Owner Aadhaar KYC
- Verified resident badge automatically assigned by cross-referencing move-in inquiry history.
- Public Makan Maalik response threading.
- Community helpful review upvoting.
- Government ID & Aadhaar KYC verification awarding the `Shield Verified Makan Maalik` trust badge.

### 6. Notifications Center & Shortlisted Rooms Freshness
- Slide-up Notification Center with unread counter badge.
- Event-driven automatic alerts on new messages, visit confirmations, bed vacancies, and reviews.
- Wishlist with live freshness indicators (`⚡ 1 Bed Left`, `🛑 Fully Occupied`, `⚠️ Listing Paused`).
- Notification channel preferences (WhatsApp, SMS, Vacancy alerts).

### 7. Hardening, Security, a11y & Offline PWA
- **Security:** HTTP security headers (`nosniff`, `SAMEORIGIN`, `strict-origin`), sliding-window rate limiting (`HTTP 429`), and robust XSS input sanitization.
- **Offline PWA:** Service worker (`sw.js`) with cache-first and network fallback strategies, stale data warning banner, and offline action queue batch synchronization.
- **Accessibility:** Screen reader live announcer (`aria-live="polite"`), dialog focus traps, minimum 44px/48dp touch targets, and `@media (prefers-reduced-motion: reduce)` support.
- **Low-End Android Optimization:** 250ms search debouncing and zero-jank transforms tested for budget devices (Redmi 9A / 2GB RAM).

---

## 📁 Repository Architecture

```
ghardekho/
├── client/                     # Progressive Web App (PWA) Client
│   ├── css/
│   │   ├── tokens.css          # Mix A+C Design tokens (Deep Slate + Saffron)
│   │   └── styles.css          # Responsive mobile simulator styles & a11y rules
│   ├── js/
│   │   └── app.js              # State engine, UI controllers & offline store
│   ├── sw.js                   # Service Worker for offline asset caching
│   └── index.html              # Accessible semantic mobile shell
├── server/                     # Node.js + Express Backend API
│   ├── src/
│   │   ├── data/
│   │   │   └── seed.js         # Verified rental seed data for Kota, Pune, Jaipur, Delhi
│   │   └── index.js            # REST API routes, middlewares & in-memory store
│   └── test/                   # Comprehensive automated test suites (Slices 1–8)
│       ├── slice1-owner.test.js
│       ├── slice2-search-map.test.js
│       ├── slice3-detail.test.js
│       ├── slice4-slots.test.js
│       ├── slice5-chat.test.js
│       ├── slice6-reviews.test.js
│       ├── slice7-notifications.test.js
│       └── slice8-hardening.test.js
├── docs/                       # Architecture, Design & Publishing Documentation
│   ├── openapi.yaml            # OpenAPI 3.0 REST API specification
│   ├── PLAN.md                 # Complete master engineering architecture plan
│   ├── DESIGN.md               # Mix A+C design tokens, typography & a11y specs
│   ├── TESTLOG.md              # Historical verification test logs (227 tests)
│   └── STORE_LISTING.md        # Play Store / App Store copy & Data Safety kit
├── .env.example                # Environment variables template
├── package.json                # Project dependencies & automated test scripts
└── LICENSE                     # OSI-approved MIT License
```

---

## 🛠️ Quickstart & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 1. Clone & Install
```bash
git clone https://github.com/sidsharmaji/ghardekho.git
cd ghardekho
npm install
```

### 2. Run the Development Server
```bash
npm start
```
The server will boot on `http://localhost:4000`:
- **Web App / Simulator:** Open `http://localhost:4000` in your browser.
- **Health Check:** `http://localhost:4000/api/health`
- **Properties Feed:** `http://localhost:4000/api/properties`

---

## 🧪 Automated Testing Suite (227 Tests)

GharDekho follows a strict plan-first engineering methodology. Every slice is verified with automated tests covering happy paths, validation rejections, and edge cases:

```bash
# Run the entire test suite across all slices (Slices 1–8)
npm test

# Run individual slice suites
npm run test:slice1    # Owner 5-step listing wizard & CRUD (14 tests)
npm run test:slice2    # Haversine distance search & geospatial map (17 tests)
npm run test:slice3    # Full listing detail & hyperlocal realities (20 tests)
npm run test:slice4    # Shared room slot engine & roommate matching (32 tests)
npm run test:slice5    # In-app chat, read receipts & visit status (29 tests)
npm run test:slice6    # Verified reviews & Aadhaar owner KYC (28 tests)
npm run test:slice7    # Notifications center & saved freshness (50 tests)
npm run test:slice8    # Hardening, anti-XSS, rate limit & offline a11y (37 tests)
```

**Total Verified Tests:** **227 Passed, 0 Failed (100% Green)**.

---

## 📖 API Documentation (OpenAPI 3.0)

The complete REST API specification is documented in [docs/openapi.yaml](./docs/openapi.yaml). You can view and test it directly using [Swagger Editor](https://editor.swagger.io/) or Postman.

### Key Endpoint Groups:
- `GET /api/properties`: Search properties by city, budget, sharing, amenities, radius.
- `POST /api/properties`: Publish new rental property listing.
- `PUT /api/properties/:id/rooms/:roomId/slots/:slotId/status`: Toggle bed slot occupancy.
- `POST /api/properties/:id/rooms/:roomId/waitlist`: Join waitlist for full rooms.
- `POST /api/inquiries`: Initiate room visit inquiry and chat thread.
- `POST /api/inquiries/:id/messages`: Exchange real-time in-app chat messages.
- `POST /api/properties/:id/reviews`: Post resident review with verified check.
- `POST /api/properties/:id/verify-owner`: Submit Aadhaar KYC verification.
- `GET /api/saved`: Retrieve shortlisted rooms with live vacancy freshness badges.
- `GET /api/notifications`: Retrieve in-app notifications with unread counts.
- `POST /api/sync/offline-actions`: Synchronize operations performed while offline.
- `GET /api/health`: Monitor system uptime and service health.

---

## 🚢 Production Deployment

### Option A: Docker Deployment
```bash
# Build the production container
docker build -t ghardekho:latest .

# Run container on port 4000
docker run -d -p 4000:4000 --name ghardekho-app ghardekho:latest
```

### Option B: Cloud Hosting (Render / Railway / Fly.io / AWS ECS)
1. Fork or push your repository to GitHub.
2. Connect your repo to Render / Railway.
3. Configure build settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:** Set `PORT=4000` and `NODE_ENV=production`.
4. Your application will be live with full PWA and offline caching support!

---

## 📄 License & Open-Source Program

GharDekho is proudly licensed under the [MIT License](./LICENSE). Contributions and pull requests are warmly welcomed to help improve student housing transparency across India!
