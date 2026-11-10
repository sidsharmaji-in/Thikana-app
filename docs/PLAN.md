# PLAN — GharDhundo 🏠
### India's Trusted Rental Marketplace for Students & Working Professionals

_Last updated: November 2026 | pro-dev-studio methodology_

---

## 1. Goal & Success Criteria

| | |
|---|---|
| **What it is** | A two-sided mobile-first Indian rental marketplace connecting property owners with students and working professionals seeking rooms, PGs, shared accommodations, and studios |
| **Who it's for** | **Tenants:** Students and working professionals relocating from hometowns to study/work in Tier 1–3 Indian cities · **Owners:** Property owners, landlords, PG operators listing spare rooms, full flats, stores, or studios |
| **Core job to nail** | Let a student who just arrived in a new city find a verified, affordable room with accurate amenities, real photos, and transparent pricing — in under 10 minutes |
| **Success looks like** | Tenant finds and contacts a matching room in <10 min · Owner lists a property in <5 min · Maps show real location + 5 nearby places · Shared room shows live occupancy + per-person cost · Zero hidden surprises after moving in |

---

## 2. Research Notes

### Market Gap Analysis

| App | What it does | What it misses |
|---|---|---|
| **OYO** | Hotel-style short stays, some PGs | Long-term rentals, shared room split pricing, student focus |
| **NoBroker** | Property listings, brokerage-free | No amenity verification, no shared room engine, weak maps |
| **MagicBricks / 99acres** | Real estate classifieds | Aimed at buyers/investors, too formal for students, no room-sharing |
| **Zolo / Stanza Living** | Managed PGs | Only their own properties, not open marketplace, expensive |
| **Housing.com** | Premium listings | No budget filter for ₹2,000–₹5,000/month rooms, no Hindi UI |

**The Gap We Own:**
- Shared room slot engine (1/2/3/4 people per room, individual pricing)
- Indian-specific amenity checklist (Jal timing, inverter backup, DTH, common bathroom queue)
- Trust layer (owner identity verification, tenant review system)
- Student/professional filters (hostel rules, gender preference, entry timing)
- Hyperlocal map view with Swiggy zones, hospital, metro distance
- Budget PG rooms ₹2,000–₹15,000/month range focus

### Psychology of Indian Rental Market
- **Trust deficit:** Tenants fear losing advance money (1–3 months deposit) on false listings
- **Information asymmetry:** Owners hide defects; tenants can't verify amenities pre-visit
- **Arrival anxiety:** A student arriving alone in a new city needs to feel safe, guided, and not exploited
- **WhatsApp culture:** All communication happens on WhatsApp — in-app chat must feel as natural
- **Language barrier:** Hindi/regional language UI increases adoption in Tier 2/3 cities

### Tech Stack Decisions
- **React Native + Expo** (Android priority, iOS later) — Expo Router for navigation
- **Node.js + Express** backend with **PostgreSQL + PostGIS** for geospatial queries
- **Google Maps Platform:** Maps JS SDK, Places API, Geocoding API, Distance Matrix API
- **Firebase:** Push notifications (FCM), Auth (OTP via SMS)
- **Cloudinary:** Image upload, optimization, transformation
- **MSG91 / Twilio India:** SMS OTP delivery
- **Razorpay:** Optional token advance payment (future phase)

---

## 3. Users & Core Flows

### Tenant Journey (Primary Flow)
```
App Open → Onboarding (3 screens, skippable) → Role: Tenant
→ OTP Login (phone) → Location permission
→ Home: Search bar + Map + Nearby listings
→ Filters: Budget · Room type · Gender · Amenities
→ Map pins showing listings → Tap pin → Preview card
→ Full listing detail: Photos · Amenities · Floor · Sharing · Price per person
→ Nearby places (hospital, metro, market, petrol pump)
→ Contact Owner (WhatsApp-style in-app chat / direct WhatsApp)
→ Save listing → Schedule visit → Review after move-in
```

### Owner Journey (Primary Flow)
```
App Open → Role: Owner (Makan Maalik)
→ OTP Login → Dashboard (My Properties)
→ Add Property → Location pin on map → Photos upload (min 5)
→ Amenity checklist → Room configuration (1/2/3/4 sharing)
→ Price per person per configuration → Availability toggle
→ View inquiries → Respond to tenants → Mark as occupied
→ Reviews received → Renew/update listing
```

### Shared Room Engine Flow
```
Room added → Owner selects "Sharing room" → Sets max occupancy (e.g. 4)
→ Sets price per person (e.g. ₹3,500/month each)
→ Tenant views: "2/4 slots filled" → Sees existing tenants (optional profiles)
→ Applies for a slot → Owner approves → Slot marked occupied
```

---

## 4. Information Architecture

### Bottom Navigation (5 tabs — thumb-reachable)
```
🏠 Khojo (Search/Home)
🗺️  Map View
❤️  Saved
💬  Messages
👤  Profile
```

### Owner Bottom Navigation
```
📋 My Listings
➕  Add Property
💬  Inquiries
⭐  Reviews
👤  Profile
```

### Screen Inventory

| ID | Screen Name | Role | Priority |
|---|---|---|---|
| S01 | Splash / Onboarding | Both | P0 |
| S02 | Role Selection | Both | P0 |
| S03 | OTP Phone Login | Both | P0 |
| S04 | Home / Search Feed | Tenant | P0 |
| S05 | Map View with Pins | Tenant | P0 |
| S06 | Listing Detail | Tenant | P0 |
| S07 | Photo Gallery | Tenant | P0 |
| S08 | Nearby Places (Maps) | Tenant | P1 |
| S09 | Contact / Chat | Both | P0 |
| S10 | Saved Listings | Tenant | P1 |
| S11 | Filters Sheet | Tenant | P0 |
| S12 | Search Results | Tenant | P0 |
| S13 | Owner Dashboard | Owner | P0 |
| S14 | Add Property (Step 1–5) | Owner | P0 |
| S15 | Photo Upload | Owner | P0 |
| S16 | Amenity Checklist | Owner | P0 |
| S17 | Room/Sharing Config | Owner | P0 |
| S18 | Inquiry Management | Owner | P0 |
| S19 | Reviews (Received/Given) | Both | P1 |
| S20 | Profile & Settings | Both | P1 |
| S21 | Notifications | Both | P1 |
| S22 | Verification Status | Owner | P2 |
| S23 | Shared Room Slots View | Tenant | P1 |

---

## 5. Data Model & API

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        uuid id PK
        string phone_number UK
        string name
        string profile_photo_url
        enum role "tenant|owner|both"
        string city
        boolean is_verified
        timestamp created_at
    }

    PROPERTIES {
        uuid id PK
        uuid owner_id FK
        string title
        text description
        enum property_type "room|pg|flat|studio|store"
        string address_line
        string city
        string locality
        decimal latitude
        decimal longitude
        geometry location "PostGIS POINT"
        enum gender_preference "male|female|any"
        boolean is_available
        boolean is_verified
        decimal deposit_amount
        integer notice_period_days
        timestamp created_at
        timestamp updated_at
    }

    ROOMS {
        uuid id PK
        uuid property_id FK
        string room_label
        integer floor_number
        enum floor_type "ground|first|second|terrace"
        integer max_occupancy
        integer current_occupancy
        decimal price_per_person
        decimal area_sqft
        boolean has_attached_bathroom
        boolean has_balcony
        boolean is_furnished
        enum furnishing "fully|semi|bare"
        timestamp available_from
    }

    AMENITIES {
        uuid id PK
        uuid property_id FK
        boolean electricity_backup "inverter/generator"
        enum water_supply "24hr|timing_based|tanker"
        string water_timing
        boolean wifi
        boolean ac
        boolean ceiling_fan
        boolean cooler
        boolean tv_dth
        boolean kitchen_allowed
        enum kitchen_type "separate|common|none"
        enum bathroom_type "attached|common"
        boolean washing_machine
        boolean fridge
        boolean parking_two_wheeler
        boolean parking_four_wheeler
        boolean security_guard
        boolean cctv
        boolean lift
        boolean geyser
        boolean tiffin_service_nearby
        string additional_rules
    }

    PROPERTY_PHOTOS {
        uuid id PK
        uuid property_id FK
        string url
        string cloudinary_public_id
        enum photo_type "exterior|room|bathroom|kitchen|common_area"
        integer sort_order
        boolean is_primary
    }

    ROOM_SHARING_SLOTS {
        uuid id PK
        uuid room_id FK
        uuid tenant_id FK
        enum status "available|occupied|reserved"
        date occupied_since
        date vacating_on
    }

    INQUIRIES {
        uuid id PK
        uuid property_id FK
        uuid tenant_id FK
        uuid owner_id FK
        text message
        enum status "pending|responded|visit_scheduled|closed"
        timestamp created_at
    }

    MESSAGES {
        uuid id PK
        uuid inquiry_id FK
        uuid sender_id FK
        text content
        boolean is_read
        timestamp sent_at
    }

    REVIEWS {
        uuid id PK
        uuid property_id FK
        uuid reviewer_id FK
        integer rating "1-5"
        text comment
        boolean is_verified_tenant
        timestamp created_at
    }

    SAVED_LISTINGS {
        uuid id PK
        uuid tenant_id FK
        uuid property_id FK
        timestamp saved_at
    }

    USERS ||--o{ PROPERTIES : "owns"
    PROPERTIES ||--o{ ROOMS : "has"
    PROPERTIES ||--|| AMENITIES : "has"
    PROPERTIES ||--o{ PROPERTY_PHOTOS : "has"
    ROOMS ||--o{ ROOM_SHARING_SLOTS : "has slots"
    USERS ||--o{ ROOM_SHARING_SLOTS : "occupies"
    PROPERTIES ||--o{ INQUIRIES : "receives"
    USERS ||--o{ INQUIRIES : "sends"
    INQUIRIES ||--o{ MESSAGES : "has"
    PROPERTIES ||--o{ REVIEWS : "has"
    USERS ||--o{ SAVED_LISTINGS : "saves"
    PROPERTIES ||--o{ SAVED_LISTINGS : "saved in"
```

### Key API Endpoints

```
Auth
  POST /auth/send-otp          → Trigger OTP via SMS
  POST /auth/verify-otp        → Verify OTP, return JWT
  GET  /auth/me                → Get current user profile

Properties
  GET  /properties             → Search with filters (lat, lng, radius, budget, type, amenities)
  POST /properties             → Create new listing (Owner)
  GET  /properties/:id         → Full listing detail
  PUT  /properties/:id         → Update listing (Owner)
  DELETE /properties/:id       → Soft-delete listing
  GET  /properties/nearby      → PostGIS ST_DWithin query (5km radius default)

Rooms
  POST /properties/:id/rooms   → Add room config
  PUT  /rooms/:id              → Update room
  GET  /rooms/:id/slots        → Get sharing slots status

Photos
  POST /properties/:id/photos  → Upload via Cloudinary signed URL
  DELETE /photos/:id           → Remove photo

Inquiries
  POST /inquiries              → Tenant sends inquiry
  GET  /inquiries/:id/messages → Get chat thread
  POST /inquiries/:id/messages → Send message
  PUT  /inquiries/:id          → Update status (owner)

Saved
  POST   /saved/:propertyId    → Save listing
  DELETE /saved/:propertyId    → Unsave
  GET    /saved                → List saved properties

Reviews
  POST /properties/:id/reviews → Post review (verified tenant only)
  GET  /properties/:id/reviews → Get reviews

Notifications
  POST /notifications/register → Register FCM token
```

### Geospatial Query Example (PostGIS)
```sql
-- Find properties within 5km of user, sorted by distance
SELECT p.*, 
  ST_Distance(p.location, ST_SetSRID(ST_Point($lng, $lat), 4326)::geography) AS distance_meters
FROM properties p
WHERE 
  ST_DWithin(p.location, ST_SetSRID(ST_Point($lng, $lat), 4326)::geography, 5000)
  AND p.is_available = true
  AND p.price_per_person BETWEEN $min_price AND $max_price
ORDER BY distance_meters ASC
LIMIT 50;
```

---

## 6. Stack Decisions

| Area | Choice | Why |
|---|---|---|
| **Mobile Framework** | React Native + Expo (SDK 52+) | JS/TS team, cross-platform, Expo Router for navigation, EAS for builds |
| **Navigation** | Expo Router (file-based) | Deep linking, typed routes, tab + stack natively |
| **State (server)** | TanStack Query v5 | Caching, pagination, optimistic updates for map pins |
| **State (client)** | Zustand | Lightweight, filters, auth state |
| **Styling** | NativeWind (Tailwind for RN) + design tokens | Consistent spacing, dark mode, tokens.ts |
| **Maps** | react-native-maps + Google Maps | Real map, pins, clustering, Street View |
| **Backend** | Node.js + Express + TypeScript | Familiar, fast to build |
| **Database** | PostgreSQL 16 + PostGIS 3 | Geospatial queries, relational integrity |
| **ORM** | Prisma | Type-safe, schema migrations, PostGIS support via raw queries |
| **Auth** | Firebase Auth (Phone OTP) | Easiest SMS OTP for India, free tier generous |
| **Images** | Cloudinary | Transform, optimize, CDN delivery |
| **Push Notifications** | Firebase Cloud Messaging (FCM) | Android + iOS, free |
| **SMS OTP** | MSG91 (India) | ₹0.15/OTP, DLT-registered for India |
| **Testing (Mobile)** | Jest + React Native Testing Library + Detox (E2E) | Unit, component, end-to-end |
| **Testing (API)** | Jest + Supertest | API integration tests |
| **CI/CD** | GitHub Actions + EAS Build | Automated builds and OTA updates |
| **Hosting (API)** | Railway / Render | Simple PostgreSQL + Node deploy |

---

## 7. Design Directions

> [!IMPORTANT]
> Per pro-dev-studio methodology, **you must pick a direction before any UI code is written.** Three options below — choose A, B, C, or describe a mix.

---

### 🅰️ Direction A — "Warm Desi Trust" *(Recommended)*
**Feel:** Earthy, warm, trustworthy — feels like home, like a known desi brand

```
Palette:
  Background:    #FFF8F0  (warm cream)
  Surface:       #FFFFFF
  Primary:       #E85D04  (deep saffron-orange)
  Accent:        #2D6A4F  (forest green — trust, growth)
  Text Primary:  #1A1A1A
  Text Muted:    #6B7280
  Border:        #E5D5C5
  Success:       #2D6A4F
  Warning:       #F59E0B
  Danger:        #DC2626

Typography:
  Display:  Poppins Bold (warm, modern, works in Hindi)
  Body:     Noto Sans (excellent Devanagari support for Hindi UI)
  Mono:     JetBrains Mono (for prices/numbers)

Shape:    radius-sm: 8px · radius-md: 16px · radius-lg: 24px
          Cards with soft box-shadow (#0001 24px)
Density:  Comfortable (Indian users prefer info-rich screens)
Motion:   Spring physics (Reanimated), listing cards slide in from bottom

Good for: Building trust with first-generation smartphone users,
          warm home-finding emotion, Hindi-first markets
Risk:     May look "too traditional" for Gen Z urban professionals
```

---

### 🅱️ Direction B — "Crisp Urban Professional"
**Feel:** Clean, clinical, information-dense — NoBroker meets LinkedIn

```
Palette:
  Background:    #F5F7FA
  Surface:       #FFFFFF
  Primary:       #1E40AF  (professional blue)
  Accent:        #0EA5E9  (sky blue highlights)
  Text Primary:  #111827
  Text Muted:    #6B7280
  Border:        #E2E8F0
  Success:       #059669
  Warning:       #D97706
  Danger:        #DC2626

Typography:
  Display:  Inter Bold (sharp, modern)
  Body:     Inter Regular
  Mono:     Fira Code

Shape:    radius-sm: 4px · radius-md: 8px · radius-lg: 12px
          Hairline borders, minimal shadow
Density:  Compact (more listings visible per screen)
Motion:   Subtle fades, 200ms ease-out transitions

Good for: Working professionals, urban metros, data-forward users
          who want to compare many listings quickly
Risk:     Cold, lacks emotional warmth for the "new city alone" feeling
```

---

### 🅲️ Direction C — "Bold Youth Dark"
**Feel:** Gen-Z, Zomato-meets-dark-mode energy for student demographic

```
Palette:
  Background:    #0F172A  (deep navy)
  Surface:       #1E293B
  Primary:       #F97316  (vivid orange)
  Accent:        #A78BFA  (purple highlight)
  Text Primary:  #F8FAFC
  Text Muted:    #94A3B8
  Border:        #334155
  Success:       #22C55E
  Warning:       #F59E0B
  Danger:        #EF4444

Typography:
  Display:  Space Grotesk ExtraBold (punchy, Gen-Z)
  Body:     DM Sans (clean, readable dark mode)
  Mono:     JetBrains Mono

Shape:    radius-sm: 12px · radius-md: 20px · radius-lg: 32px
          Dark cards, neon accent glows (subtle)
Density:  Airy (card-based, swipeable like Tinder for rooms)
Motion:   Springy, card-swipe gestures, parallax photos

Good for: Student demographic 18–26, college towns, hostels,
          fun "swipe to find your room" experience
Risk:     Harder to read in bright Indian sunlight, may alienate
          older owners or Tier 3 users on low-end phones
```

> **Direction Selected:** **Mix A + C ("Warm Saffron Energy on Deep Dark Slate")**  
> _Combines Direction A's trusted Indian warmth and home-finding emotion with Direction C's modern, dark slate aesthetic (Swiggy / Zomato inspired) for students and young professionals._

---

## 8. Vertical Slices (Build Order)

```mermaid
flowchart TD
    S0["🏗️ Slice 0\nScaffold + Auth"] --> S1
    S1["📍 Slice 1\nOwner: List Property"] --> S2
    S2["🗺️ Slice 2\nTenant: Search + Map"] --> S3
    S3["📋 Slice 3\nFull Listing Detail + Amenities"] --> S4
    S4["🛏️ Slice 4\nShared Room Slot Engine"] --> S5
    S5["💬 Slice 5\nInquiry + In-App Chat"] --> S6
    S6["⭐ Slice 6\nReviews + Verification"] --> S7
    S7["🔔 Slice 7\nNotifications + Saved"] --> S8
    S8["🛡️ Slice 8\nHardening: a11y, Perf, Security"]
```

---

- [x] **Slice 0 — Scaffold** ✅ _(Completed & Verified)_
  - Expo project + Expo Router + TypeScript foundation
  - Mock & SQLite/PostgreSQL rental database schema with seed data
  - Mix A+C Design token system (`theme.ts`, `tokens.css`)
  - Mobile web simulator + responsive wide viewport
  - Base components: Button, Card, Input, Badge, Bottom Sheet
  - Initial API endpoints (`GET /api/properties`, `GET /api/stats`, `POST /api/properties/:id/book-slot`)
  - Repository live on GitHub (`sidsharmaji/ghardekho`) with MIT License

- [x] **Slice 1 — Owner: List a Property** ✅ _(Completed & Verified)_
  - Multi-step property form (5 steps: Basic info → Location pin → Photos → Amenities → Pricing)
  - Google Maps location picker (coordinates pin + landmark distance)
  - Photo upload manager with minimum photo requirements
  - Amenity checklist (all 20+ items: power backup, water supply timing, geyser, wifi, AC, attached/common bath, CCTV, single girl safe)
  - Room sharing config (1/2/3/4 sharing slots + dynamic slot generator + rent per person + deposit)
  - Property goes live on submit into local API & runtime store
  - UI states: form validation · photo preview · success confirmation · live listing card preview
  - Tests: `server/test/slice1-owner.test.js` (14/14 tests passing)

- [x] **Slice 2 — Tenant: Search + Map View** ✅ _(Completed & Verified)_
  - Home screen: search bar + city selector + interactive map view
  - Haversine location-based distance calculation & 5km radius filter
  - Interactive map canvas with custom dark grid, user GPS beacon, and interactive price pins (`₹3.8k`, `₹5.5k`)
  - Slide-up Map Float Preview card on pin tap with instant "Inspect & Book"
  - Filter bottom sheet: budget range slider (₹1,000–₹30,000) · property type · gender preference · sharing occupancy · 6 essential Indian amenities
  - List view ↔ Map view toggle with active filter badges
  - UI states: no results empty state with reset · distance badges · offline caching
  - Tests: `server/test/slice2-search-map.test.js` (17/17 tests passing)

- [x] **Slice 3 — Full Listing Detail** ✅ _(Completed & Verified)_
  - Photo gallery carousel (interactive next/prev, active thumbnail strip, photo counter)
  - Hyperlocal Indian Realities breakdown cards (Jal timing schedule, 24hr power backup, WiFi continuity)
  - Key property specs bar (floor number, vitrified tiles, lift status, gender preference, deposit, notice period)
  - Split-room bed allocation table with live vacant beds and per-person rent
  - Verified 20+ amenity chips grid (WiFi, cooler/AC, attached Western bath, tiffin nearby, CCTV, gate curfew)
  - Distance-verified nearby places (walking distance to coaching, hospital, bus stop)
  - Interactive "Schedule a Room Visit" directly in sheet with date/time slot picker
  - Zero-brokerage direct owner connect (WhatsApp CTA + Call button)
  - Tests: `server/test/slice3-detail.test.js` (20/20 tests passing)

- [ ] **Slice 4 — Shared Room Slot Engine**
  - Owner: set max occupancy per room, price per slot
  - Tenant view: "2 of 4 slots occupied" visual (bed icons)
  - Apply for a slot → owner approves/rejects
  - Slot status: available / reserved / occupied
  - Tenant profile cards for existing roommates (name + photo, opt-in)
  - _UI states:_ all slots full (waitlist option) · slot approved notification · roommate preview
  - _Tests:_ slot availability logic · concurrent booking edge case

- [ ] **Slice 5 — Inquiry + In-App Chat**
  - Tenant sends inquiry with message
  - In-app chat thread (WhatsApp-like bubbles)
  - Owner sees all inquiries on dashboard
  - Visit scheduling (pick date/time)
  - Chat push notifications (FCM)
  - _UI states:_ message sending · read receipts · owner offline banner · chat history pagination
  - _Tests:_ message ordering · FCM token registration · unread count

- [ ] **Slice 6 — Reviews + Verification**
  - Review form: 1–5 stars + text (tenant after move-in, 30 days post inquiry)
  - Verified tenant badge on review (must have had an inquiry marked as moved-in)
  - Owner response to review
  - Property review summary on listing card
  - Owner identity verification flow (Aadhaar / PAN upload → manual review)
  - _UI states:_ review pending approval · owner verification badge · flag review
  - _Tests:_ review submission · verified badge logic · rating average calculation

- [ ] **Slice 7 — Notifications + Saved Listings**
  - Save/unsave property (heart icon, instant feedback)
  - Saved listings tab with freshness indicator (price changed, now occupied)
  - Push notifications: new inquiry, new message, slot approved, review received
  - Notification preferences in settings
  - _UI states:_ saved listing now gone (soft delete notice) · notification permission denied

- [ ] **Slice 8 — Hardening**
  - **A11y:** VoiceOver/TalkBack labels on all interactive elements, minimum 48dp targets, contrast check
  - **Performance:** FlashList for all lists, expo-image with blurhash, map cluster optimization
  - **Security:** JWT expiry + refresh, rate limiting on OTP, input sanitization, SQL injection prevention via Prisma
  - **Offline:** Cached last-search results, queued messages, stale data banner
  - **Indian mobile:** Test on low-end Android (Redmi 9A class, 2GB RAM), 2G/3G network simulation
  - **Reduce Motion:** All animations respect `useReducedMotion()`

- [ ] **Slice 9 — Handoff**
  - README with setup, env vars, deploy instructions
  - API documentation (Swagger/OpenAPI)
  - Design system docs (`DESIGN.md` finalized)
  - App Store / Play Store listing assets

---

## 9. Feature Matrix (Full Product)

### Tenant Features

| Feature | Slice | Priority |
|---|---|---|
| OTP phone login | 0 | P0 |
| Search by city/locality | 2 | P0 |
| Map view with pins + clusters | 2 | P0 |
| Filter by budget (₹1K–₹30K range) | 2 | P0 |
| Filter by room type (room/PG/flat/studio) | 2 | P0 |
| Filter by gender preference | 2 | P0 |
| Filter by amenities (WiFi/AC/attached bath) | 2 | P0 |
| Photo gallery (carousel + full-screen) | 3 | P0 |
| Full amenity detail view | 3 | P0 |
| Floor + bathroom + kitchen details | 3 | P0 |
| Sharing occupancy display | 4 | P0 |
| Exact Google Maps location | 3 | P0 |
| Nearby places (hospital, market, metro) | 3 | P1 |
| Owner profile + response rate | 3 | P1 |
| Contact via in-app chat | 5 | P0 |
| WhatsApp direct option | 3 | P1 |
| Save/unsave listings | 7 | P1 |
| Apply for sharing slot | 4 | P1 |
| Write review after stay | 6 | P1 |
| Push notifications | 7 | P1 |
| Hindi language toggle | 8 | P2 |
| Roommate profile view | 4 | P2 |
| Virtual tour (video) | future | P3 |

### Owner Features

| Feature | Slice | Priority |
|---|---|---|
| OTP phone login | 0 | P0 |
| Multi-step property listing form | 1 | P0 |
| Map location picker (drop pin) | 1 | P0 |
| Photo upload (min 5, max 20) | 1 | P0 |
| Full amenity checklist | 1 | P0 |
| Room sharing configuration | 1 | P0 |
| Toggle availability on/off | 1 | P0 |
| View all inquiries dashboard | 5 | P0 |
| In-app chat with tenants | 5 | P0 |
| Approve/reject sharing slot requests | 4 | P1 |
| Mark property as occupied/available | 1 | P0 |
| View + respond to reviews | 6 | P1 |
| Push notifications for inquiries | 7 | P1 |
| Owner identity verification | 6 | P2 |
| Analytics (views, contacts, conversion) | future | P3 |
| Featured listing boost | future | P3 |

---

## 10. Full Amenity Checklist (20+ Items)

```
💡 ELECTRICITY
  ☐ 24-hour electricity
  ☐ Inverter backup
  ☐ Generator backup
  ☐ Electricity included in rent

💧 WATER
  ☐ 24-hour water supply
  ☐ Timing-based supply → specify timing (e.g. 6–8 AM, 6–8 PM)
  ☐ Tanker water
  ☐ Hot water / Geyser

🌐 CONNECTIVITY
  ☐ WiFi included in rent
  ☐ WiFi available (self-pay)
  ☐ Cable TV / DTH

❄️ COOLING & HEATING
  ☐ AC (air conditioner)
  ☐ Ceiling fan
  ☐ Cooler / Desert cooler
  ☐ Room heater

🛋️ FURNISHING
  ☐ Fully furnished (bed + mattress + wardrobe + study table + chair)
  ☐ Semi-furnished (some items)
  ☐ Unfurnished / bare

🍳 KITCHEN
  ☐ Separate kitchen (private use)
  ☐ Common kitchen (shared with other tenants)
  ☐ Cooking not allowed
  ☐ Fridge available
  ☐ Gas connection

🚿 BATHROOM
  ☐ Attached private bathroom
  ☐ Common bathroom (shared)
  ☐ Western seat toilet
  ☐ Indian seat toilet
  ☐ Washing machine available

🚗 PARKING
  ☐ Two-wheeler parking
  ☐ Four-wheeler parking
  ☐ Covered parking

🔒 SECURITY
  ☐ Security guard (24-hour)
  ☐ Security guard (day only)
  ☐ CCTV cameras
  ☐ Gated/locked entry

🏢 BUILDING
  ☐ Lift available
  ☐ Terrace/rooftop access
  ☐ Ground floor
  ☐ Floor number: ___

📋 RULES & EXTRAS
  ☐ Entry timing: __ PM (curfew/timing if applicable)
  ☐ Visitors allowed / not allowed
  ☐ Non-veg cooking: allowed / not allowed
  ☐ Pets allowed
  ☐ Smoking allowed in room
  ☐ Tiffin service nearby
  ☐ Owner lives on premises
  ☐ Single girl safe (verified by owner)
```

---

## 11. System Architecture

```mermaid
flowchart TD
    subgraph Mobile["📱 React Native + Expo App"]
        A1[Tenant App] 
        A2[Owner App]
        A3[Expo Router Navigation]
        A4[TanStack Query Cache]
        A5[Zustand State]
    end

    subgraph API["⚙️ Node.js + Express API"]
        B1[Auth Routes - OTP/JWT]
        B2[Property Routes]
        B3[Search + Geospatial]
        B4[Chat/Inquiry Routes]
        B5[Review Routes]
        B6[Notification Service]
    end

    subgraph DB["🗄️ Database"]
        C1[(PostgreSQL 16\n+ PostGIS 3)]
        C2[Prisma ORM]
    end

    subgraph Services["☁️ External Services"]
        D1[Firebase Auth\nPhone OTP]
        D2[Firebase FCM\nPush Notifications]
        D3[Cloudinary\nImage CDN]
        D4[Google Maps Platform\nMaps, Places, Geocoding]
        D5[MSG91\nSMS OTP India]
        D6[Razorpay\nPayments - Future]
    end

    Mobile -->|HTTPS REST + JWT| API
    API --> C2 --> C1
    Mobile --> D4
    API --> D1
    API --> D2
    API --> D5
    Mobile --> D3
    API --> D3
```

---

## 12. Business Model

| Revenue Stream | Mechanism | Phase |
|---|---|---|
| **Free for all** | 3 listings free per owner, unlimited tenant searches | MVP |
| **Featured listings** | ₹99–₹299/month per property (highlighted, top position) | Phase 2 |
| **Owner subscription** | ₹499/month for unlimited listings + analytics | Phase 2 |
| **Token advance** | ₹500 advance via Razorpay (platform fee 2%) | Phase 3 |
| **Verified badge** | ₹199 one-time owner verification | Phase 2 |
| **City premium** | Auto-boost in metro city searches | Phase 3 |

> [!NOTE]
> **MVP is completely free for both owners and tenants.** Revenue features come in Phase 2 after finding product-market fit. This matches OYO and NoBroker's early strategy.

---

## 13. Psychological Trust Framework

### The Trust Stack (what makes tenants trust a listing)

```
Level 1 — Visual proof: Real photos (5+), no stock images, timestamp on photos
Level 2 — Detail accuracy: Exact amenity checklist, floor, water timing, entry rules
Level 3 — Social proof: Reviews from verified tenants, rating 4.2+ badge
Level 4 — Owner identity: Name, photo, phone (partially masked), time on platform
Level 5 — Platform signal: "GharDhundo Verified" badge (manual review process)
```

### Anti-Fraud Measures
- Minimum 5 photos required (auto-reject low-quality via Cloudinary AI)
- Address verification via Google Maps pin (can't be in ocean or jungle)
- Owner phone OTP is mandatory (no fake accounts)
- Review only by verified tenants (must have an inquiry marked "moved-in")
- Price change notification to saved-listing users

---

## 14. Localization Plan

| Language | Priority | Notes |
|---|---|---|
| English | P0 | Default, tech-savvy users |
| Hindi | P1 | Largest Indian market, Tier 2/3 cities |
| Marathi | P2 | Maharashtra (Mumbai, Pune) |
| Bengali | P2 | West Bengal (Kolkata) |
| Tamil | P3 | Chennai |

**i18n library:** `i18n-js` with `expo-localization`
**Devanagari font:** Noto Sans Devanagari (pre-bundled)
**Hindi UI keys:** Stored in `src/locales/hi.json`

---

## 15. Indian Market Specifics

| Indian Context | App Solution |
|---|---|
| "Jal timing" (water hours) | Water supply type + timing field (e.g., "6–8 AM only") |
| "Bijli backup" (power cuts) | Inverter/Generator checkbox, hours of backup |
| Advance/deposit (1–3 months) | Deposit amount field, refund policy text |
| "Ladki ke liye safe hai?" | "Single girl safe" checkbox + verified badge |
| WhatsApp as primary comm | "Chat on WhatsApp" fallback button on every listing |
| Rs. denominated pricing | INR only, range sliders ₹1,000–₹30,000 |
| Shared bathrooms normal | Common bathroom count, timing, cleanliness rating |
| "Tiffin nearby" common ask | Tiffin service nearby checkbox |
| Owner on premises | "Owner lives here" checkbox (some prefer, some don't) |
| Late-night return rules | Entry timing field (e.g., "Must return by 10 PM") |

---

## 16. Risks & Open Questions

| Risk | Severity | Mitigation |
|---|---|---|
| Fake listings with stolen photos | HIGH | Cloudinary reverse image check, report button, 48hr listing review |
| Owner ghost-listing (unavailable but shown) | HIGH | 30-day auto-expiry, owner must renew |
| WhatsApp dependency (users go off-platform) | MEDIUM | In-app chat value: notifications, history, verification layer |
| PostGIS complex geospatial queries slow | MEDIUM | Spatial indexes (GIST), query optimization, Redis cache |
| SMS OTP delivery fails (DLT issues in India) | MEDIUM | Fallback to Twilio India |
| Low-end Android performance | MEDIUM | FlashList, image compression, offline-first design |
| Owner's property in village with no GPS precision | LOW | Allow approximate pin with "exact location shared after contact" |
| Play Store policy (advance payments) | MEDIUM | Phase 3 only, comply with RBI and Play Store payment policies |

### Open Questions
1. **App name final?** "GharDhundo" is placeholder — needs domain + trademark check
2. **Expo or bare React Native?** Expo recommended unless deep native modules needed
3. **Self-hosted maps or Google Maps?** Google Maps has the best Indian data coverage
4. **Phase 1 city focus?** Launch in 1–2 cities first (Suggested: Jaipur, Pune) for quality control
5. **Owner KYC mandatory?** Current plan: optional, becomes mandatory for "Verified" badge

---

## Appendix: App Name Ideas

| Name | Meaning | .com available? |
|---|---|---|
| GharDhundo | "Find a home" (Hindi) | Check |
| KiraDar | "Tenant" (Hindi/Urdu) | Check |
| NayaSheher | "New city" (Hindi) | Check |
| ApnaKamra | "My room" (Hindi) | Check |
| BaseraNow | "Dwelling/Settlement" | Check |
| RentSaathi | "Rent companion" (Saathi = friend) | Check |
| NestIndia | English + India focus | Check |

> [!TIP]
> Run these through India trademark registry (ipindia.gov.in) and check GoDaddy/.in domain availability before finalizing.

---

*This plan follows the pro-dev-studio methodology. Next: Choose design direction (A/B/C), then proceed to Slice 0 scaffold.*
