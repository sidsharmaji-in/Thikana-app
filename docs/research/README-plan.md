# GharDekho Research & Execution Plan Index

Comprehensive product, architecture, testing, and release strategy built with the `vibe-research-to-ship` methodology.

---

## 1. Top 5 Findings

1. **Competitor Blind Spot on Indian Realities:** Stanza Living and NoBroker treat student housing as standard corporate rentals, ignoring critical Kota student survival factors: municipal water hours (Jal timing), generator backup capacity, and strict gate curfews.
2. **Double-Booking Chaos During Admission Rush:** In April–July peak seasons, landlords receive 20+ simultaneous phone inquiries, leading to double-booked rooms and broken promises. GharDekho's atomic 10-minute temporary bed lock completely eliminates this race condition.
3. **Brokerage Parasitism & Call Center Paywalls:** NoBroker charges ₹999–₹2,499 just to unlock contact numbers, while local auto drivers demand 15-day rent cuts. A frictionless direct-connect model with instant WhatsApp integration wins immediate student trust.
4. **Mobile Device Constraints in Tier-2/3 India:** Over 75% of student users access the platform on budget Android phones ($80–$120) over congested 4G. A zero-framework, ultra-lightweight (< 50KB) PWA delivers 3x faster FCP than heavy React/Next.js single-page apps.
5. **Aadhaar Data Sensitivity & Regulatory Risk:** Under the Digital Personal Data Protection Act (DPDP Act 2023), storing unmasked national identity documents exposes platforms to severe penalties. GharDekho strictly truncates and masks Aadhaar numbers (`XXXXXXXX1234`) with zero raw biometric storage.

---

## 2. MVP Scope in a Few Lines

GharDekho MVP provides a fast, zero-brokerage mobile PWA for student coaching accommodation in Kota:
- **Tenant Experience:** Phone SMS OTP sign-in, walking proximity search radar to coaching hubs (Allen, Resonance), transparent municipal water/power indicators, real-time 10-minute atomic bed slot locking, and direct in-app chat with 1-click WhatsApp fallback.
- **Landlord Experience:** 5-step property listing wizard with multi-photo presigned direct cloud uploads, DigiLocker masked Aadhaar verification, and instant room visit request confirmations.
- **Engineering Foundation:** Node.js Express modular monolith, PostGIS spatial calculations, Redis/Memory concurrency lock engine, Pino structured logging, Sentry error telemetry, and a multi-stage Dockerized deployment verified by 467 automated tests.

---

## 3. Plan Deliverables & File Navigation

| Phase | Deliverable File | Description |
|---|---|---|
| **Phase 0** | [00-project-brief.md](00-project-brief.md) | Problem statement, users, classification, constraints, and codebase inventory. |
| **Phase 1** | [01-market-research.md](01-market-research.md) | Competitor analysis (Stanza, Zolo, NoBroker), pricing models, student pain points, and trends. |
| **Phase 2** | [02-reverse-engineering.md](02-reverse-engineering.md) | 8-layer product teardowns of Stanza Living, NoBroker, and WhatsApp groups; feature matrix. |
| **Phase 3** | [03-requirements.md](03-requirements.md) | Personas, 3 differentiation pillars, FR-01–FR-07 (Given/When/Then), NFR-01–NFR-06, and MoSCoW. |
| **Phase 4** | [04-architecture.md](04-architecture.md) | System overview Mermaid diagram, tech decision records, ER data model, API catalog, and RBAC matrix. |
| **Phase 5** | [05-implementation-plan.md](05-implementation-plan.md) | Vertical slices (Step 5.1 to 5.8), validation checkpoints, backlog, and AI prompt starters. |
| **Phase 6** | [06-test-plan.md](06-test-plan.md) | Full testing pyramid, RTM matrix, white/gray/black box allocation, and Playwright multi-device suites. |
| **Phase 7** | [07-release-checklist.md](07-release-checklist.md) | Quality gates, production readiness, UAT results, DPDP compliance, and staged launch plan. |

---

## 4. First Three Actions

1. **Verify Complete Automated Test Baseline:**
   ```bash
   npm test
   npm run test:e2e
   ```
   *Expected:* 449 unit/integration tests and 18 Playwright E2E browser tests pass with 100% green status.
2. **Launch Staging Environment via Docker Compose:**
   ```bash
   docker-compose up -d --build
   curl http://localhost:4000/health/ready
   ```
   *Expected:* Multi-stage Alpine container boots and deep readiness probe reports `{"status":"ready","database":"healthy"}`.
3. **Execute Kota Beta Cohort Onboarding:**
   - Seed 50 verified Talwandi/Kunhari hostel listings with water supply timings.
   - Run Checkpoint 1 UAT with 6 coaching students to validate real-time bed locking under simulated admission rush.

---

## 5. What Could Not Be Verified

- **Physical SMS Gateway Throughput Under High Network Congestion:** In local and CI environments, SMS OTP delivery was verified via deterministic mock dispatch and session stores. Physical telecommunication delivery latency over Indian DLT carrier networks under extreme regional festival congestion could not be physically benchmarked without live SMS credits.
