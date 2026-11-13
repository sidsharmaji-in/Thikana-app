# Implementation Plan: GharDekho MVP

Evidence Confidence Labels: `[Observed]` (verified in codebase/benchmarks), `[Documented]` (standard docs/spec), `[Inferred]` (architectural deduction), `[Assumed]` (working design hypothesis).

---

## 1. Engineering Principles

1. **Vertical Slice Architecture:** Every step delivers a complete, testable vertical slice (Data Model → Service Logic → API Route → Client UI). No orphaned backend models or non-interactive UI shells.
2. **Co-Developed Automated Tests:** Every step must include unit and integration tests written alongside the code. No step is marked complete without green automated verification.
3. **Continuous Working Software:** The main branch remains perpetually deployable. Zero breaking regressions on previously shipped slices.
4. **Realistic Demo Checkpoints:** Scheduled user validation gates after foundational milestones (e.g., Step 5.3 and Step 5.6) where real students and landlords test the live workflow on mobile.

---

## 2. Step-by-Step Implementation Roadmap

### Step 5.1: Walking Skeleton & Spatial Database Foundation
- **Goal:** User can query a basic API endpoint and discover rental properties within a specified kilometer radius of coaching landmarks (Allen Samarth, Resonance) with sub-100ms response times.
- **Covers:** FR-02, NFR-01
- **Tasks:**
  - [x] Configure Prisma ORM with PostgreSQL and PostGIS extensions.
  - [x] Create Property, Room, and BedSlot relational schema with spatial latitude/longitude coordinates.
  - [x] Implement Dual-Mode Data Repository (`propertyRepository.js`) supporting Prisma Client and high-performance direct SQL.
  - [x] Seed realistic Kota localities (Talwandi, Mahaveer Nagar, Kunhari, Coral Park).
  - [x] Implement `GET /api/properties` with Haversine and `ST_DWithin` distance calculations.
- **Tests to write first/with it:** `test/sliceP1-db-schema.test.js` (29 automated tests verifying schema constraints, spatial queries, and API response envelopes).
- **Acceptance Criteria:** `GET /api/properties?city=Kota&radius=2` returns properties ordered by ascending distance with calculated `distanceKm` field in `< 100ms`.
- **Definition of Done:** 29 tests passing, PostGIS migration scripts verified, zero database deadlocks.
- **Risks / Notes:** Local developer environments without PostGIS must fall back gracefully to mathematical Haversine calculations without crash.

---

### Step 5.2: Phone OTP Authentication, RFC 7519 Session Rotation & RBAC
- **Goal:** Students and landlords can securely sign in with an Indian mobile number via a 6-digit SMS OTP, receive a signed 15-minute JWT, rotate sessions via `HttpOnly` refresh cookie, and verify Aadhaar identity.
- **Covers:** FR-01, FR-07, NFR-03
- **Tasks:**
  - [x] Build `authService.js` with cryptographic OTP generation and 5-minute expiry store.
  - [x] Implement `POST /api/auth/otp/send` and `POST /api/auth/otp/verify`.
  - [x] Enforce RFC 7519 JWT generation with 15-minute access token and 7-day cryptographically hashed refresh token cookie.
  - [x] Add Role-Based Access Control (RBAC) middleware supporting `tenant`, `owner`, and `admin` roles.
  - [x] Build Aadhaar DigiLocker verification endpoint storing strictly masked numbers (`XXXXXXXX1234`).
  - [x] Implement responsive client OTP login modal in `client/index.html`.
- **Tests to write first/with it:** `test/sliceP2-auth-rbac.test.js` (46 tests verifying OTP generation, rate limiting, JWT rotation, cookie security, and DigiLocker masking).
- **Acceptance Criteria:** Valid OTP issues JWT and sets secure cookie. Invalid or expired OTP returns HTTP 400. Masked Aadhaar never exposes full 12 digits.
- **Definition of Done:** 46 tests green, refresh token rotation tested against replay attacks, zero plain-text tokens in database.
- **Risks / Notes:** Mobile users on slow SMS networks need 30-second resend cooldown timers to avoid spamming the gateway.

---

### Step 5.3: High-Concurrency Bed Slot Sharing & 10-Minute Lock Engine
- **Goal:** Students can reserve a specific vacant bed slot in a shared hostel room with an atomic 10-minute hold. Simultaneous booking attempts from competitors receive an instant HTTP 409 Conflict.
- **Covers:** FR-03, NFR-02
- **Tasks:**
  - [x] Implement `bedLockService.js` providing atomic lease acquisition, TTL expiration, and manual release.
  - [x] Expose `POST /api/rooms/:roomId/beds/:slot/lock` and `DELETE /api/rooms/:roomId/beds/:slot/lock`.
  - [x] Implement conflict handling returning HTTP 409 with `Retry-After: 600` and remaining seconds payload.
  - [x] Build real-time countdown timer badge on the client room booking modal.
- **Tests to write first/with it:** `test/sliceP3-realtime-locks.test.js` (30 tests verifying atomic locks, parallel racing conditions, automatic lease expiry, and release mechanics).
- **Acceptance Criteria:** When 10 parallel requests target the same bed slot, exactly 1 wins (HTTP 200) and 9 fail with HTTP 409 Conflict.
- **Definition of Done:** 30 tests green, concurrency stress verified with zero double-allocations.
- **Risks / Notes:** In-memory lock store must maintain clean timers to prevent memory leaks if client disconnects.

---

### Step 5.4: Presigned Cloud Media Upload Pipeline & Watermarking
- **Goal:** Property owners can upload multiple high-resolution room photos directly to cloud storage without overloading the application server, receiving responsive CDN URLs with GharDekho watermarks.
- **Covers:** FR-06, NFR-03
- **Tasks:**
  - [x] Implement `mediaService.js` supporting AWS S3, Cloudflare R2, Cloudinary, and Local Disk adapters.
  - [x] Expose `POST /api/media/presign` with strict MIME allowlist (`image/jpeg`, `image/png`, `image/webp`) and 10MB size ceiling.
  - [x] Implement HMAC-SHA256 signature verification for local and S3 endpoints.
  - [x] Expose `POST /api/media/confirm` generating 120px, 480px, and 1200px responsive image variants with trust watermark metadata.
  - [x] Integrate multi-photo file picker with progress bar into owner listing modal.
- **Tests to write first/with it:** `test/sliceP4-media-pipeline.test.js` (64 tests verifying signature validation, MIME rejection, size enforcement, and responsive URL generation).
- **Acceptance Criteria:** Uploading valid JPEG returns responsive image URLs and watermark tag. Uploading `.exe` or 15MB file returns HTTP 400 Bad Request.
- **Definition of Done:** 64 tests passing, zero server memory spikes during uploads.
- **Risks / Notes:** Slow 3G uplinks require client-side image compression before invoking presigned upload.

---

### Step 5.5: Property Creation Wizard & Hyperlocal Proximity Discovery Radar
- **Goal:** Property owners can list a PG room in a 5-step wizard, and students can search using the proximity radar with interactive coaching landmark chips.
- **Covers:** FR-02, FR-04, NFR-01
- **Tasks:**
  - [x] Build 5-step listing form in `client/index.html` (Basic Info, Location Coordinates, Amenities, Sharing Slots, Photos).
  - [x] Enforce minimum 3 room photos requirement before listing activation.
  - [x] Build coaching institute quick-filter pills (Allen Samarth, Resonance, Vibrant, Motion, PW Vidyapeeth).
  - [x] Render transparent Kota reality indicators: Municipal Jal hours, Generator Backup, Gate Curfew.
  - [x] Implement client-side debounce (250ms) on keyword search input.
- **Tests to write first/with it:** `test/sliceP1-db-schema.test.js` & `test/slice4-owner-wizard.test.js` (55 tests verifying listing submission, validation, and proximity search rendering).
- **Acceptance Criteria:** Completing 5-step wizard creates active property visible on explore feed within 200ms.
- **Definition of Done:** Full wizard flow functional, form validation prevents incomplete submissions.
- **Risks / Notes:** Owners frequently forget to enter room dimensions; provide sensible defaults (e.g. 12x10 sqft).

---

### Step 5.6: Real-Time In-App WebSocket Chat & Room Visit Scheduling
- **Goal:** Students and landlords can exchange messages in real-time within an inquiry thread, see typing indicators, and book scheduled room visits with calendar confirmations.
- **Covers:** FR-05, NFR-01
- **Tasks:**
  - [x] Implement `wsHub.js` WebSocket connection manager with heartbeat and inquiry room multiplexing.
  - [x] Expose `GET /api/inquiries` and `POST /api/inquiries`.
  - [x] Add visit request state machine (`visit_requested` → `visit_confirmed` → `completed`).
  - [x] Integrate instant 1-click WhatsApp direct connect button with pre-filled message text.
  - [x] Build responsive chat modal with message sound and notification badges.
- **Tests to write first/with it:** `test/sliceP3-realtime-locks.test.js` & `test/slice5-chat-visits.test.js` (62 tests verifying WebSocket handshakes, broadcast isolation, visit scheduling, and WhatsApp URL generation).
- **Acceptance Criteria:** Sending message in active inquiry broadcasts to connected recipient within 50ms. Visit status transitions update both parties' views.
- **Definition of Done:** 62 tests green, WebSocket reconnect logic verified across client disconnects.
- **Risks / Notes:** Mobile browsers kill background WebSocket connections; ensure automatic reconnection on window focus.

---

### Step 5.7: Playwright Multi-Device E2E Test Suite & GitHub Actions CI
- **Goal:** Automated continuous integration pipeline validates full user journeys on both Desktop Chrome and Mobile Pixel 7 viewports on every commit.
- **Covers:** NFR-04, NFR-05
- **Tasks:**
  - [x] Configure Playwright (`playwright.config.js`) for Desktop Chrome (1280x720) and Mobile Pixel 7 (412x915).
  - [x] Author comprehensive E2E test specs: `e2e/pwa-full-journey.spec.js`, `e2e/pwa-mobile-journey.spec.js`, `e2e/owner-journey.spec.js`.
  - [x] Automate test server lifecycle using `webServer` config block.
  - [x] Build GitHub Actions CI workflow (`.github/workflows/ci.yml`) running lint, unit, integration, and E2E suites.
- **Tests to write first/with it:** All 18 Playwright end-to-end tests covering search, OTP login, bed locking, chat, and listing publishing.
- **Acceptance Criteria:** `npx playwright test` passes 18/18 tests in headless mode across both desktop and mobile viewports with zero flaky failures.
- **Definition of Done:** 18/18 E2E tests green, CI pipeline terminates cleanly under 3 minutes.
- **Risks / Notes:** CSS animations can cause race conditions during button clicks; use Playwright web-first assertions (`toBeVisible()`).

---

### Step 5.8: Production Hardening, Observability, Pino Logs & Docker Deployment
- **Goal:** System is fully packaged into production-ready multi-stage Docker container with structured JSON logging, Sentry error monitoring, `X-Request-ID` correlation, and readiness probes.
- **Covers:** NFR-06
- **Tasks:**
  - [x] Implement `logger.js` utilizing Pino with ISO timestamps and child request logger.
  - [x] Build `requestId.js` middleware generating immutable UUIDs and `X-Response-Time` headers.
  - [x] Implement deep healthcheck endpoints (`/health` liveness and `/health/ready` database/memory readiness).
  - [x] Configure Sentry exception capture with sanitization of sensitive phone and token fields.
  - [x] Author multi-stage `Dockerfile` and `docker-compose.yml` with non-root security profile.
- **Tests to write first/with it:** `test/sliceP6-observability-docker.test.js` (63 tests verifying Pino formats, request correlation headers, probe statuses, and container definitions).
- **Acceptance Criteria:** `curl /health/ready` returns HTTP 200 with database health status. 100% of logs output valid JSON. Docker container boots cleanly.
- **Definition of Done:** 63 tests passing, total test suite count reaches 467 tests across all 13 suites with 100% pass rate.
- **Risks / Notes:** Sensitive environment secrets must be injected at runtime via environment variables, never hardcoded in Docker images.

---

### Step 5.9: Roommate Vibe & Compatibility Matching Engine (Slice P7 - Shipped)
- **Goal:** Students can calculate deterministic compatibility scores against occupants of shared hostel rooms based on sleep schedule, study noise, exam focus (NEET/JEE), and dietary ethics before booking a bed.
- **Covers:** FR-08, NFR-01
- **Tasks:**
  - [x] Implement `vibeMatcher.js` computing 5-dimension compatibility scores (Sleep 25%, Noise 25%, Exam 20%, Diet 15%, Cleanliness 15%).
  - [x] Implement `roommateService.js` managing student habit profiles and aggregate room vibe scores.
  - [x] Expose `/api/roommates` routes (`GET /profile/me`, `PUT /profile/me`, `POST /compatibility/compare`, `GET /rooms/:propertyId/:roomId/vibe-check`, `GET /explore`).
  - [x] Integrate `⚡ Room Vibe Check` pill, visual dimension breakdown bars, positive synergies, and friction alerts into PWA modal.
  - [x] Add student study habits customization modal (`openMyHabitsModal`).
- **Tests to write first/with it:** `test/sliceP7-roommate-vibe.test.js` (53 tests verifying heuristic normalization, pairwise matches, room-level aggregation, and HTTP endpoints).
- **Acceptance Criteria:** Exact matches score 100% (Super Vibe 🔥); clashes yield score < 50% (Mismatched ⚠️) with friction warnings; empty rooms report 100% Fresh Clean Slate.
- **Definition of Done:** 53 tests passing, zero regression on existing 449 backend tests and 18 Playwright E2E tests (520 total platform tests).

---

### Step 5.10: Refundable ₹500 Token Advance Payment Integration (Slice P8 - Ready)
- **Goal:** Students and parents can pay a small ₹500 refundable token advance via UPI to convert a 10-minute temporary bed lock into a 24-hour confirmed physical visit reservation.
- **Covers:** FR-09, NFR-03
- **Tasks:**
  - [ ] Implement `paymentService.js` supporting Razorpay Orders API and webhook signature verification (`razorpay_signature`).
  - [ ] Expose `POST /api/payments/token-advance/order` and `POST /api/payments/token-advance/verify`.
  - [ ] Extend bed lock service to upgrade lock status from `active` (10m) to `token_confirmed` (24h) upon verified payment.
  - [ ] Provide automated UPI refund webhook if tenant cancels visit at least 6 hours in advance.
- **Tests to write first/with it:** `test/sliceP8-token-payment.test.js` (Simulating order creation, HMAC-SHA256 signature verification, tamper rejection, and 24-hour lock transition).
- **Acceptance Criteria:** Valid signature verifies payment and locks bed for 24 hours. Tampered signature returns HTTP 400.
- **Definition of Done:** Integration tests pass, mock Razorpay gateway verified, zero credentials exposed.

---

### Step 5.11: Bilingual Hindi / Hinglish UI Localization & Devanagari Fonts (Slice P9 - Completed)
- **Goal:** Non-English speaking parents from rural Rajasthan, Bihar, and UP can browse properties, Jal supply alerts, and curfew rules in natural Hindi.
- **Covers:** FR-10, NFR-04
- **Tasks:**
  - [x] Create i18n dictionary (`client/js/i18n.js`) with English and Hindi (Devanagari) translations for all labels, placeholders, titles, and chips.
  - [x] Add language switch toggle (`EN / हिंदी`) in client navigation header with DOM translation engine.
  - [x] Integrate Google Noto Sans Devanagari font rendering cleanly on low-end Android mobile displays.
  - [x] Implement persistent storage (`localStorage.getItem('ghar_preferred_lang')`) across user sessions.
- **Tests to write first/with it:** `test/sliceP9-localization.test.js` (12 automated unit/integration tests) & Playwright bilingual journey spec `tests/e2e/04-bilingual-localization.spec.js` (6 multi-device tests).
- **Acceptance Criteria:** Toggling language updates 100% of visible labels immediately without page reload.
- **Definition of Done:** 12 unit tests + 6 Playwright tests passing on Desktop Chrome and Mobile Pixel 7. Zero layout shifts.

---

### Step 5.12: Hyperlocal Mess & Daily Tiffin Service Integration & Ratings (Slice P10 - Completed)
- **Goal:** Students can view daily mess menus, hygiene ratings, and student reviews of tiffin centers located within 300 meters of their PG.
- **Covers:** FR-02, NFR-01
- **Tasks:**
  - [x] Create `messService.js` supporting hyperlocal discovery within 300m, FSSAI hygiene ratings, daily lunch/dinner menu updates, review upvotes, and monthly room delivery subscriptions.
  - [x] Create `server/src/routes/mess.js` mounted at `/api/mess` (`/`, `/property/:propertyId`, `/:id`, `/:id/menu`, `/:id/reviews`, `/:id/subscribe`).
  - [x] Integrate Hyperlocal Mess & Tiffin Radar card and subscription prompt into client property details sheet (`renderMessSectionHtml` & `subscribeTiffinPrompt`).
  - [x] Implement automated integration test suite (`test/sliceP10-mess-services.test.js` - 15 tests).
- **Tests to write first/with it:** `test/sliceP10-mess-services.test.js` (15 automated tests).
- **Acceptance Criteria:** Mess cards display verified hygiene badges, walking distance metrics, today's lunch/dinner menu, and 1-click room delivery subscription.
- **Definition of Done:** 15 unit/integration tests passing; full regression suite (567 integration tests + 24 Playwright E2E tests) 100% green.

---

### Step 5.13: Bilingual Voice Search & Hinglish Intent Parser (Slice P11 - Completed)
- **Goal:** Students and parents can speak naturally in Hindi, English, or mixed Hinglish to search rooms (e.g., *"Allen ke paas single room 4000 ke andar with wifi"*).
- **Covers:** FR-02, FR-10, NFR-04
- **Tasks:**
  - [x] Create Hinglish natural language voice parsing engine (`client/js/voiceSearch.js`) mapping coaching landmarks (Allen, Resonance, FIITJEE), localities, budgets in rupees and hazaar, sharing occupancy, gender preferences, and amenities.
  - [x] Implement Web Speech API VoiceSearchController with graceful fallback prompt for desktop and unsupported environments.
  - [x] Integrate microphone action button (`🎙️`) into central search capsule with pulsing audio state animation.
  - [x] Implement automated test suite (`server/test/sliceP11-voice-search.test.js` - 14 tests).
- **Tests to write first/with it:** `test/sliceP11-voice-search.test.js` (14 automated tests).
- **Acceptance Criteria:** Spoken Hindi/English phrases automatically populate search query, budget ceiling, sharing type, gender, and amenities filters.
- **Definition of Done:** 14 unit tests passing; all 581 backend integration tests passing; 24 Playwright E2E tests green.

---

### Step 5.14: AI Vision Onboarding Pipeline & Operations Admin Console (Slice P12 - Completed)
- **Goal:** Landlords can upload raw room and bathroom photos and have room sharing, bed counts, and amenities auto-extracted in seconds; Platform admins have an operational moderation console for Shield Verification badge approvals and escrow audit.
- **Covers:** FR-06, FR-07, NFR-03
- **Tasks:**
  - [x] Create `visionExtractorService.js` analyzing room photographs to infer bed capacity, attached bathrooms, geysers, AC/cooling, and city-calibrated benchmark pricing.
  - [x] Implement `POST /api/properties/ai-extract-photos` endpoint pre-populating landlord listing drafts.
  - [x] Build Super Admin Console routes (`/api/admin/overview`, `/api/admin/pending-listings`, `/api/admin/listings/:id/approve`, `/api/admin/listings/:id/reject`, `/api/admin/payments/escrow`).
  - [x] Integrate 1-click `✨ AI Smart Auto-Fill from Photos` in owner listing wizard (`triggerAiVisionScan`).
  - [x] Implement automated integration test suite (`test/sliceP12-ai-onboarding-admin.test.js` - 8 tests).
- **Tests to write first/with it:** `test/sliceP12-ai-onboarding-admin.test.js` (8 automated tests).
- **Acceptance Criteria:** Photo uploads automatically populate room occupancy, bed slots, and local amenities; Admin approvals grant Shield Verification badges.
- **Definition of Done:** 8 integration tests passing; full suite of 589 integration tests and 24 Playwright E2E browser journeys passing (613 total tests, 100% green).

---

## 3. Demo-to-Real-User Checkpoints

- **Checkpoint 1 (After Step 5.3):**
  - *Audience:* 3 Kota coaching students + 2 landlords.
  - *Script:* Search properties around Allen Samarth; attempt simultaneous reservation of Bed 1 in Room 201; observe 10-minute hold and instant 409 Conflict.
  - *Validation Target:* Users understand why the bed is locked and appreciate the transparent countdown timer.
- **Checkpoint 2 (After Step 5.6):**
  - *Audience:* 5 hostel owners in Talwandi.
  - *Script:* Publish a new 6-bed hostel listing with photos; accept a room visit request from a student tester; exchange 3 chat messages.
  - *Validation Target:* Owner completes listing in under 4 minutes on an Android smartphone without assistance.

---

## 4. Post-MVP Backlog

1. **AI Roommate Compatibility Matching (Phase 2):** Match students based on study hours, NEET/JEE mock score targets, and quiet hours.
2. **Refundable ₹500 Token Advance (Razorpay):** Optional micro-deposit hold converting a 10-minute bed lock into a 24-hour physical visit reservation.
3. **Hyperlocal Mess & Tiffin Rating Engine:** Student-voted reviews of daily food menus across Kota mess centers.
4. **Bilingual Hindi / Hinglish Voice Search:** Audio-enabled search input for non-English typing parents.

---

## 5. AI Coding Agent Prompt Starters

### Prompt Starter for Step 5.1
```text
Context: read docs/research/03-requirements.md (FR-02, NFR-01) and docs/research/04-architecture.md.
Task: Implement Step 5.1: Walking Skeleton & Spatial Database Foundation.
Constraints: Follow Node.js/Express and PostGIS schema; create propertyRepository.js with dual-mode fallback; write automated integration tests alongside code.
Done when: GET /api/properties?city=Kota&radius=2 returns ordered results with distanceKm; test/sliceP1-db-schema.test.js passes 29/29 tests; zero unhandled errors.
```

### Prompt Starter for Step 5.2
```text
Context: read docs/research/03-requirements.md (FR-01, FR-07) and docs/research/04-architecture.md.
Task: Implement Step 5.2: Phone OTP Authentication, RFC 7519 Session Rotation & RBAC.
Constraints: Enforce 10-digit Indian phone regex; 15-min JWT access token; HttpOnly 7-day refresh cookie; masked Aadhaar storage.
Done when: test/sliceP2-auth-rbac.test.js passes 46/46 tests; token rotation resists replay attacks; masked Aadhaar never stores full 12 digits.
```

### Prompt Starter for Step 5.3
```text
Context: read docs/research/03-requirements.md (FR-03, NFR-02) and docs/research/04-architecture.md.
Task: Implement Step 5.3: High-Concurrency Bed Slot Sharing & 10-Minute Lock Engine.
Constraints: Atomic lease acquisition; 10-minute TTL; return HTTP 409 Conflict with standard Retry-After header on collision.
Done when: test/sliceP3-realtime-locks.test.js passes 30/30 tests; parallel race condition guarantees single winner; zero double bookings.
```

### Prompt Starter for Step 5.4
```text
Context: read docs/research/03-requirements.md (FR-06, NFR-03) and docs/research/04-architecture.md.
Task: Implement Step 5.4: Presigned Cloud Media Upload Pipeline & Watermarking.
Constraints: Support S3/R2/Cloudinary/Local adapters; enforce 10MB ceiling and MIME allowlist; generate responsive variants.
Done when: test/sliceP4-media-pipeline.test.js passes 64/64 tests; unsigned uploads fail; responsive URLs generated correctly.
```

### Prompt Starter for Step 5.5
```text
Context: read docs/research/03-requirements.md (FR-02, FR-04) and docs/research/04-architecture.md.
Task: Implement Step 5.5: Property Creation Wizard & Hyperlocal Proximity Discovery Radar.
Constraints: 5-step wizard with client validation; coaching landmark chips; water timing and power backup indicators.
Done when: Owner can complete listing creation; search radar filters properties by landmark and budget; client UI tests pass.
```

### Prompt Starter for Step 5.6
```text
Context: read docs/research/03-requirements.md (FR-05) and docs/research/04-architecture.md.
Task: Implement Step 5.6: Real-Time In-App WebSocket Chat & Room Visit Scheduling.
Constraints: WebSocket connection manager with heartbeat; inquiry room isolation; 1-click WhatsApp direct connect link.
Done when: Messages broadcast to connected inquiry participants in < 50ms; visit request transitions correctly; test/slice5-chat-visits.test.js passes.
```

### Prompt Starter for Step 5.7
```text
Context: read docs/research/03-requirements.md (NFR-04, NFR-05) and docs/research/04-architecture.md.
Task: Implement Step 5.7: Playwright Multi-Device E2E Test Suite & GitHub Actions CI.
Constraints: Cover Desktop Chrome (1280x720) and Mobile Pixel 7 (412x915); zero flaky timeouts; automated CI workflow.
Done when: npx playwright test passes all 18 specs; GitHub Actions CI workflow file runs clean on PRs.
```

### Prompt Starter for Step 5.8
```text
Context: read docs/research/03-requirements.md (NFR-06) and docs/research/04-architecture.md.
Task: Implement Step 5.8: Production Hardening, Observability, Pino Logs & Docker Deployment.
Constraints: Pino JSON logging; X-Request-ID and X-Response-Time headers; /health/ready deep probe; multi-stage Dockerfile.
Done when: test/sliceP6-observability-docker.test.js passes 63/63 tests; all 467 project tests green; Docker build succeeds.
```

### Prompt Starter for Step 5.9
```text
Context: read docs/research/03-requirements.md (FR-08) and docs/research/04-architecture.md.
Task: Implement Step 5.9: Roommate Vibe & Compatibility Matching Engine.
Constraints: 5-dimension scoring algorithm (Sleep 25%, Noise 25%, Exam 20%, Diet 15%, Cleanliness 15%); room-level aggregate scoring; mobile UI integration.
Done when: test/sliceP7-roommate-vibe.test.js passes 53/53 tests; total platform test count reaches 520 tests with 100% pass rate.
```

### Prompt Starter for Step 5.10
```text
Context: read docs/research/03-requirements.md (FR-09) and docs/research/04-architecture.md.
Task: Implement Step 5.10: Refundable ₹500 Token Advance Payment Integration (Razorpay).
Constraints: Razorpay Orders API, HMAC-SHA256 signature verification; upgrade 10m bed lock to 24-hour visit hold; automated refund webhook.
Done when: test/sliceP8-token-payment.test.js passes; signature validation prevents tampering; 24h lock verified.
```

### Prompt Starter for Step 5.11
```text
Context: read docs/research/03-requirements.md (FR-10, NFR-04) and docs/research/04-architecture.md.
Task: Implement Step 5.11: Bilingual Hindi / Hinglish UI Localization.
Constraints: i18n dictionary for all UI text; language toggle in header; zero layout shift; support Devanagari fonts on mobile.
Done when: Playwright test asserts Hindi strings on search bar, chips, and modals; toggle persists in localStorage.
```

