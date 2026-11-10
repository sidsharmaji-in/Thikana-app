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
