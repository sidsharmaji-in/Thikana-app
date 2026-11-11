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

