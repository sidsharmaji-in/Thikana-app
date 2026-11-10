# TESTLOG — GharDekho 🏠

Record what was actually run, not what was intended.

## Slice 0 — Scaffold (2026-11-10)
- **Status:** ✅ COMPLETED & VERIFIED
- **API Server:** Running on `http://localhost:4000`
- **Endpoints Verified:**
  - `GET /api/stats` -> 4 properties, 12 beds (4 occupied, 8 available), active cities: Kota, Pune, Jaipur, Delhi.
  - `GET /api/properties` -> Returns verified seed listings with complete Indian amenity checklist and sharing slots.
  - `POST /api/properties/:id/book-slot` -> Bed reservation functionality tested.
  - Static file serving -> `client/index.html` with Mix A+C Swiggy dark theme.
- **Design Tokens:** Active in `client/css/tokens.css` and `mobile/src/theme/theme.ts`.
- **Next Slice:** Slice 1 (Owner: Multi-Step Property Listing wizard refinement with Cloudinary photo uploads & Google Maps pin picker).

## Slice 1 — Owner: List a Property (2026-11-10)
- **Status:** ✅ COMPLETED & VERIFIED
- **Automated Test Suite:** `npm run test:slice1` (`server/test/slice1-owner.test.js`)
- **Results:** 14 Passed, 0 Failed
- **Features Verified:**
  - 5-Step Owner Wizard UI (`Basic Info` -> `Location & Pin` -> `20+ Indian Amenities` -> `Room Sharing & Price` -> `Photo Upload & Review`)
  - Server validation on `POST /api/properties`: Reject missing title (HTTP 400), reject less than 3 photos (HTTP 400)
  - Full property creation with dynamic bed slot generation (Single, Double, 3-Bed, 4-Bed split room)
  - Full 20+ amenity checklist toggles (24hr power backup, water supply timing, geyser, wifi, cooler, AC, attached western bathroom, CCTV, single girl safe)
  - Owner dashboard listing controls: Toggle availability (Active / Paused) via `PUT /api/properties/:id/toggle-availability`
  - Property deletion via `DELETE /api/properties/:id`
  - Real-time live card preview before publishing
- **Next Slice:** Slice 2 — Tenant: Search & Interactive Map Feed (Haversine geospatial distance filter, map pin clusters, and bottom sheet filter).

## Slice 2 — Tenant: Search & Interactive Map Feed (2026-11-10)
- **Status:** ✅ COMPLETED & VERIFIED
- **Automated Test Suite:** `npm run test:slice2` (`server/test/slice2-search-map.test.js`)
- **Results:** 17 Passed, 0 Failed (Cumulative: 31 Passed, 0 Failed)
- **Features Verified:**
  - Haversine geospatial distance calculation (`lat`, `lng`, `radiusKm=5`) with real-time distance badge (`0.4 km away`)
  - Filter Bottom Sheet Modal with budget slider (₹1,000 to ₹30,000), property type, tenant gender preference, and sharing occupancy
  - Essential Indian Amenities filtering (24hr Power Backup, 24hr Water RO, Attached Western Bath, WiFi, AC, Single Girl Safe)
  - Sorting algorithms verified (`distance` nearest first, `price_asc`, `price_desc`, `rating`)
  - Interactive Map View with road grid, river, coaching landmark zone, user GPS beacon, and price pins (`₹3.8k`, `₹5.5k`)
  - Slide-up Map Float Card on pin tap with room photo, verified badge, and instant "Inspect & Book" CTA
  - List View ↔ Map View instant toggle
- **Next Slice:** Slice 3 — Full Listing Detail & Hyperlocal Amenities (Photo gallery carousel with full-screen zoom, floor & bathroom specifications, Jal timing alert cards, nearby hospital/metro markers).

## Slice 3 — Full Listing Detail & Hyperlocal Amenities (2026-11-10)
- **Status:** ✅ COMPLETED & VERIFIED
- **Automated Test Suite:** `npm run test:slice3` (`server/test/slice3-detail.test.js`)
- **Results:** 20 Passed, 0 Failed (Cumulative: 51 Passed, 0 Failed)
- **Features Verified:**
  - Photo Gallery Carousel with interactive Next (`›`) and Previous (`‹`) controls, image counter (`📸 1/3 Photos`), and active thumbnail strip
  - Hyperlocal Indian Realities Breakdown Cards:
    - 💧 Water Supply: Jal Board timing schedule + 1000L rooftop storage backup + Geyser alert
    - ⚡ Power Cut Resilience: 24hr Generator vs Inverter breakdown with WiFi continuity assurance
  - Key Property Specifications: Floor level (e.g. 2 of 4), Vitrified tile flooring, Lift status, Gender exclusivity, Security deposit, and Notice period
  - Split-Room Bed Allocation Table: Room label, Area (sqft), Furnishing status, Attached/Common bathroom, and per-head monthly pricing
  - Verified 20+ Amenities Checklist: High-speed WiFi, Desert cooler, Attached Western bath, Mess/Tiffin tie-up, CCTV, and Gate curfew timing
  - Distance-verified Landmark & Transit List (walking distance to Coaching Institute, Pharmacy, and Bus Stop)
  - Interactive "Schedule a Room Visit" directly inside detail sheet: Date selector (`Today`, `Tomorrow`, `Sunday`) and Time slot pills (`10:00 AM`, `11:30 AM`, `04:00 PM`, `06:30 PM`), submitting lead to `POST /api/inquiries`
  - Zero-Brokerage Direct Owner Connect: WhatsApp CTA with customized message and direct Call button
- **Next Slice:** Slice 4 — Shared Room Slot Engine (Bed-level occupancy, live vacancy status, roommate profiles, and booking request workflow).

## Slice 4 — Shared Room Slot Engine & Roommate Compatibility (2026-11-10)
- **Status:** ✅ COMPLETED & VERIFIED
- **Automated Test Suite:** `npm run test:slice4` (`server/test/slice4-slots.test.js`)
- **Results:** 32 Passed, 0 Failed (Cumulative across Slices 1–4: 83 Passed, 0 Failed)
- **Features Verified:**
  - Bed-Level State & Lock Management:
    - Three-state lifecycle: `available` -> `reserved` (pending token/owner approval) -> `occupied`.
    - Concurrency & double-booking prevention: attempting to book an already occupied or reserved bed returns `HTTP 400` ("Slot is already occupied or reserved").
    - Dynamic occupancy tracking: room's `currentOccupancy` updates automatically when beds are booked, approved, or vacated.
  - Opt-In Roommate Compatibility Profiles:
    - Existing occupants in shared rooms can share opt-in compatibility cards with prospective students.
    - Fields verified: Course/Exam (e.g. "Allen 12th JEE Aspirant"), Hometown (e.g. "Jaipur, RJ"), Habit tags (`Early Bird 🌅`, `Silent Study 📚`, `Vegetarian 🥗`), Sleep Schedule (`10:30 PM - 6:00 AM`), and Vibe Compatibility Match score (98%).
    - Interactive "👤 Roommate Vibe" modal dialog in client with clean UI and zero-exploitation privacy notice.
  - Full Room Waitlist Queue Engine:
    - When all beds in a shared room are occupied, the UI displays a high-visibility banner: `🔒 All Beds Currently Occupied` and a `🔔 Join Waitlist` CTA.
    - Tenant submits waitlist entry via `POST /api/properties/:id/rooms/:roomId/waitlist`.
    - Server calculates and assigns exact queue position (`#1 in queue`, `#2 in queue`).
    - Tenants and owners can query the waitlist via `GET /api/properties/:id/rooms/:roomId/waitlist`.
  - Owner Dashboard Bed & Waitlist Control Panel:
    - Interactive bed management section rendered inside owner property cards.
    - Status updates via `PUT /api/properties/:id/rooms/:roomId/slots/:slotId/status`:
      - For Vacant beds: "Fill" (mark occupied).
      - For Reserved beds: "Approve" (confirm move-in) or "Reject" (release back to vacant).
      - For Occupied beds: "Vacate" (clear occupant info and increment available beds).
    - One-click bed assignment from waitlist via `POST /api/properties/:id/rooms/:roomId/waitlist/:id/assign`: assigns candidate directly to first vacant bed, updates status, and removes candidate from queue.
    - Cancel/remove waitlist candidates via `DELETE /api/properties/:id/rooms/:roomId/waitlist/:id`.
- **Next Slice:** Slice 5 — Inquiry + In-App Chat (WhatsApp-like bubble threads, unread counter, visit confirmation, and message ordering).

## Slice 5 — Inquiry & In-App Chat System (2026-11-10)
- **Status:** ✅ COMPLETED & VERIFIED
- **Automated Test Suite:** `npm run test:slice5` (`server/test/slice5-chat.test.js`)
- **Results:** 29 Passed, 0 Failed (Cumulative across Slices 1–5: 112 Passed, 0 Failed)
- **Features Verified:**
  - In-App Messaging Engine:
    - Real-time message exchange via `POST /api/inquiries/:id/messages` supporting both `tenant` and `owner` roles.
    - Automatic validation rejecting empty whitespace-only messages (`HTTP 400`).
    - Chronological message ordering and ISO timestamps.
  - Read Receipts & Unread Tracking:
    - Thread-level unread counters for both Tenant (`unreadCountTenant`) and Owner (`unreadCountOwner`).
    - Opening a conversation (`GET /api/inquiries/:id?reader=...`) marks received messages as read (`isRead = true`) and resets the viewer's unread counter to 0.
    - Live unread badges rendered on bottom navigation tabs for both roles.
    - WhatsApp-style read ticks: single check (`✓`) for sent, double check (`✓✓`) for read.
  - Visit Status Management in Chat:
    - Dedicated endpoint `PUT /api/inquiries/:id/visit-status` supporting statuses: `confirmed`, `rescheduled`, `cancelled`, `visited`.
    - Automatically injects Concierge system message into the chat history (e.g. *"📅 Room Visit Confirmed for Tomorrow at 11:00 AM"*).
  - Rich Interactive Chat Room UI:
    - Chat header showing other party's name, role, activity status, and direct phone call CTA.
    - Saffron orange-tinted tenant bubbles (right aligned) vs dark slate-raised owner bubbles (left aligned).
    - Quick-reply chips for rapid zero-friction student queries (*"Is study desk & chair provided?"*, *"Is WiFi speed good for live lectures?"*, *"Can I come for physical room visit today at 5 PM?"*).
    - Bottom message input bar with instant Enter-key sending and automatic scroll-to-bottom behavior.
- **Next Slice:** Slice 6 — Reviews, Ratings & Owner Verification (5-star review form, verified tenant badges, owner responses, and Aadhaar trust badges).
