# Requirements Specification: GharDekho

## 1. Personas and Jobs-to-be-Done

### Persona A: Aryan Sharma (NEET Aspirant, 18, from Alwar relocating to Kota)
- **Job-to-be-Done:** "When I arrive in Kota with my parents, I want to find a quiet, budget-friendly 2-sharing PG within 10 minutes walk from Allen Samarth, so that I don't waste study time commuting or get cheated by local auto-driver brokers."
- **Critical Frustrations:** Water cuts right before morning class, noisy roommates, and landlords demanding 3 months deposit.

### Persona B: Ramesh Ji (Makan Maalik / Landlord, 56, Talwandi Kota)
- **Job-to-be-Done:** "When coaching batch admissions begin in April, I want to list my 6 spare hostel rooms and fill all 16 bed slots with verified, disciplined students, so that my rooms don't sit vacant and I don't pay 15 days brokerage commission."
- **Critical Frustrations:** Double-booking confusion on phone calls, late night WhatsApp spam, and tenants leaving without notice.

---

## 2. Differentiation Strategy (Our 3 Pillars)

1. **Hyperlocal Indian Realities Transparency:** Explicitly display municipal water hours (Jal timing), generator backup capability, attached Western toilets, gate curfews, and single-girl safety status.
2. **Bed-Slot Concurrency Engine:** 10-minute temporary reservation lease hold on bed slots preventing double-booking races (HTTP 409 Conflict with `Retry-After`).
3. **Frictionless Zero-Brokerage Connect:** Native in-app real-time messaging with instant WhatsApp direct fallback and zero paywalls for tenant-landlord communication.

---

## 3. Functional Requirements (FR)

### FR-01: Phone SMS OTP Authentication & Session Hardening
- **User Story:** As a user (tenant or owner), I want to log in using my 10-digit Indian mobile number with a one-time SMS passcode, so that I can securely manage my listings and inquiries without remembering passwords.
- **Priority:** **Must**
- **Acceptance Criteria:**
  - *Given* a user enters a valid 10-digit Indian mobile number (`+91[6-9]XXXXXXXXX`), *When* they click "Send OTP", *Then* a 6-digit numeric OTP is dispatched with a 5-minute expiry window.
  - *Given* the correct OTP is entered, *When* verified, *Then* the server returns a signed RFC 7519 Access Token (15-min) and sets a secure `HttpOnly` Refresh Token (7-day).

### FR-02: Hyperlocal Search & Proximity Radar
- **User Story:** As a student, I want to filter rental properties by coaching institute area (e.g. Allen, Resonance), city, budget (₹1K–₹30K), and amenities, so that I only see relevant rooms.
- **Priority:** **Must**
- **Acceptance Criteria:**
  - *Given* a keyword or coaching landmark query, *When* entered into the search bar, *Then* results update within 250ms (debounced) with exact Haversine / PostGIS calculated distance in kilometers.
  - *Given* active filters (e.g. Kota, Budget <= ₹5,000, 4-Sharing), *When* applied, *Then* only matching properties are displayed.

### FR-03: Shared Room Slot Engine & 10-Minute Bed Locking
- **User Story:** As a student, I want to reserve a specific vacant bed slot in a shared room with a temporary 10-minute lock, so that another applicant cannot steal it while I am confirming details with my parents.
- **Priority:** **Must**
- **Acceptance Criteria:**
  - *Given* a vacant bed slot in a room, *When* student A clicks "Reserve Bed Slot", *Then* an atomic 10-minute lease lock is acquired.
  - *Given* student A holds the active lock, *When* student B attempts to reserve or book the same bed slot, *Then* the server returns HTTP 409 Conflict with standard `Retry-After: 600` header and remaining lease seconds.

### FR-04: Multi-Step Property Listing Wizard (Owner Flow)
- **User Story:** As a property owner, I want to list my PG room across 5 structured steps (Basic info, Location pin, Amenities, Sharing pricing, Photos), so that students see full accurate details.
- **Priority:** **Must**
- **Acceptance Criteria:**
  - *Given* an owner enters title, city, locality, and at least 3 room photos, *When* they click "Publish Property Now", *Then* the listing transitions to live and is retrievable on the explore feed with unique property ID.

### FR-05: Real-Time WhatsApp-Style In-App Messaging
- **User Story:** As a tenant, I want to chat with the landlord in real time to schedule a room visit, so that I can get answers instantly without sharing my phone publicly.
- **Priority:** **Must**
- **Acceptance Criteria:**
  - *Given* an active inquiry thread, *When* a participant sends a message, *Then* WebSocket broadcasting pushes the message to all subscribed room clients with typing indicators and read receipts.
  - *Given* a room visit date and time slot is requested, *When* the owner accepts, *Then* the inquiry status transitions to `visit_confirmed` with automatic notification dispatch.

### FR-06: Direct Cloud Media Upload Pipeline
- **User Story:** As an owner, I want to upload high-resolution photos directly to secure cloud storage without server timeouts, so that my room looks appealing.
- **Priority:** **Must**
- **Acceptance Criteria:**
  - *Given* a photo file, *When* `POST /api/media/presign` is called with MIME and size parameters, *Then* server verifies allowlist (`image/jpeg`, `image/png`, `image/webp`), enforces 10MB ceiling, and returns an HMAC-SHA256 signed presigned upload instruction.
  - *Given* upload completes, *When* confirmed, *Then* server generates responsive URLs (120px micro thumbnail, 480px card, 1200px full view) and attaches GharDekho trust watermark metadata.

### FR-07: Masked Aadhaar KYC Identity Verification
- **User Story:** As a user, I want landlords to be identity-verified, so that I know the property is legitimate and safe.
- **Priority:** **Should**
- **Acceptance Criteria:**
  - *Given* an owner submits Aadhaar verification details, *When* confirmed, *Then* user profile is marked `isKycVerified: true` with masked Aadhaar (`XXXXXXXX1234`) and property carries the Shield Verified badge.

---

## 4. Non-Functional Requirements (NFR)

| ID | Category | Target Metric | How Verified |
|---|---|---|---|
| **NFR-01** | **Performance** | API p95 response time < 150ms on search and listing detail endpoints | Automated HTTP latency benchmarks & `X-Response-Time` header |
| **NFR-02** | **Concurrency** | Zero double-bookings under simultaneous parallel reservation requests | Automated concurrency test (`sliceP3-realtime-locks.test.js`) verifying 200 OK for winner and 409 Conflict for competitor |
| **NFR-03** | **Security** | OWASP Top 10 compliance: zero stored XSS, strict CSP headers, input sanitization disarming `<script>` and `<iframe>` | Automated security suite (`slice8-hardening.test.js`) |
| **NFR-04** | **Accessibility** | WCAG 2.2 Level AA compliance: TalkBack / VoiceOver live announcer (`aria-live="polite"`), modal dialog focus traps, minimum 44px touch targets | Automated Playwright audits and DOM assertion checks |
| **NFR-05** | **Offline Resilience** | PWA Service Worker caching static shell and offline actions queue | Cache-first service worker verification in `slice8-hardening.test.js` |
| **NFR-06** | **Observability** | 100% of HTTP requests tagged with `X-Request-ID`; structured Pino JSON logs; Kubernetes liveness & readiness probes | Probe tests in `sliceP6-observability-docker.test.js` |

---

## 5. Scope Breakdown (MoSCoW)

- **Must Have (MVP Core):**
  - Phone SMS OTP auth & RFC 7519 JWT session rotation (`FR-01`).
  - Hyperlocal coaching proximity search & 5km radius filter (`FR-02`).
  - Bed slot sharing allocation & 10-minute concurrency lock engine (`FR-03`).
  - 5-step property listing wizard for Makan Maalik (`FR-04`).
  - Real-time in-app chat & room visit scheduling (`FR-05`).
  - Direct presigned cloud media upload pipeline (`FR-06`).
- **Should Have (Next Wave):**
  - Aadhaar DigiLocker KYC verification modal and masked storage (`FR-07`).
  - Roommate compatibility habit tags & vibe score matching.
  - Bilingual Hindi / English UI toggle.
- **Could Have (Future Enhancements):**
  - Video virtual room walkthrough player.
  - Razorpay ₹500 refundable token advance payment hold.
- **Won't Have This Time (Out of Scope):**
  - Long-term building master leases or physical food catering operations (Stanza Living model).
  - Telemarketing call centers or paywalled phone contacts (NoBroker model).

---

## 6. Risks and Unknowns with Retirement Plan

| Risk | Severity | Mitigation / Retirement Plan |
|---|---|---|
| **High concurrency double-booking races during Kota admission rush** | **High** | Retired via distributed 10-minute temporary bed lock service (`bedLockService.js`) returning HTTP 409 Conflict with `Retry-After`. |
| **Stolen stock photos and fake listings** | **High** | Retired via direct cloud media pipeline enforcing minimum 3 photos, MIME validation, and GharDekho trust watermark. |
| **WhatsApp disintermediation** | **Medium** | Embraced rather than fought: native in-app chat with 1-click WhatsApp direct connect button. |
| **DPDP Act 2023 Aadhaar compliance** | **High** | Retired by strictly masking all national IDs (`XXXXXXXX1234`) and storing zero raw biometric credentials. |
