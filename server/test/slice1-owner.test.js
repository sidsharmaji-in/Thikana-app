// Slice 1: Owner Listing Engine Automated Verification Test
const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Slice 1: Owner Listing Verification Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Validation Test: Reject property with missing title
    const res1 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      title: "",
      city: "Kota",
      locality: "Talwandi",
      rooms: [{ maxOccupancy: 2, pricePerPerson: 4000 }]
    });
    assert(res1.status === 400, "Rejects property with empty title (HTTP 400)");
    assert(res1.data.message.includes('title is required'), "Returns descriptive error for missing title");

    // 2. Validation Test: Reject property with missing photos (min 3)
    const res2 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      title: "Valid PG Title",
      city: "Kota",
      locality: "Talwandi",
      propertyType: "pg",
      rooms: [{ maxOccupancy: 2, pricePerPerson: 4000 }],
      photos: ["https://example.com/photo1.jpg"] // only 1 photo
    });
    assert(res2.status === 400, "Rejects property with less than 3 photos (HTTP 400)");

    // 3. Success Test: Publish full 20+ amenity verified listing
    const validPropertyPayload = {
      title: "Test Shrinath Boys Hostel & Study PG",
      description: "Direct owner listing with 24hr RO water, generator backup, and attached western bathroom.",
      propertyType: "pg",
      category: "sharing_room",
      genderPreference: "male",
      city: "Kota",
      locality: "Rajeev Gandhi Nagar",
      address: "Plot 105, Coaching corridor, Kota",
      coordinates: { lat: 25.1388, lng: 75.8344 },
      floor: 2,
      totalFloors: 4,
      hasLift: true,
      flooring: "Vitrified Tiles",
      depositMonths: 1,
      depositAmount: 4500,
      noticePeriodDays: 30,
      rules: {
        curfewTime: "10:30 PM",
        visitorsAllowed: "In lobby only",
        cookingAllowed: false,
        smokingAllowed: false,
        ownerOnPremises: true
      },
      rooms: [
        {
          id: "room-test-01",
          label: "Room 201 (Triple Sharing)",
          maxOccupancy: 3,
          currentOccupancy: 0,
          pricePerPerson: 4500,
          areaSqft: 240,
          bathroomType: "attached",
          hasBalcony: true,
          furnishing: "fully",
          slots: [
            { slotId: "s-1", status: "available", tenantName: null },
            { slotId: "s-2", status: "available", tenantName: null },
            { slotId: "s-3", status: "available", tenantName: null }
          ]
        }
      ],
      amenities: {
        electricityBackup: "Generator (Full 24hr)",
        waterSupply: "24 Hours (RO + Tank)",
        waterTiming: "24x7 Uninterrupted",
        hotWater: "Geyser Included",
        wifi: "Fiber 100 Mbps",
        cooling: "Desert Cooler",
        kitchen: "Tiffin Service Nearby",
        bathroom: "Attached Western",
        washingMachine: true,
        parking: "Two-Wheeler",
        security: "CCTV 24x7",
        tiffinNearby: true
      },
      nearbyPlaces: [
        { name: "Allen Career Institute", distance: "200m" },
        { name: "City Pharmacy", distance: "150m" }
      ],
      photos: [
        "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800",
        "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800",
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800",
        "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800"
      ],
      owner: {
        id: "owner-satish",
        name: "Satish Sharma",
        phone: "+91 98290 12345",
        whatsapp: "919829012345",
        responseRate: "Instant",
        isKycDone: true
      }
    };

    const res3 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, validPropertyPayload);

    assert(res3.status === 201, "Successfully published property listing (HTTP 201)");
    assert(res3.data.success === true, "Response reports success = true");
    const createdId = res3.data.property.id;
    assert(Boolean(createdId), `Generated property ID: ${createdId}`);

    // 4. Verification Test: Check property in GET /api/properties
    const res4 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/properties/${createdId}`,
      method: 'GET'
    });
    assert(res4.status === 200, "Created property is retrievable via GET /api/properties/:id");
    assert(res4.data.property.title === "Test Shrinath Boys Hostel & Study PG", "Retrieved property has matching title");
    assert(res4.data.property.rooms[0].slots.length === 3, "Retrieved room has 3 dynamic sharing slots");

    // 5. Test Availability Toggling (Pause / Resume listing)
    const res5 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/properties/${createdId}/toggle-availability`,
      method: 'PUT'
    });
    assert(res5.status === 200, "Successfully toggled property availability (HTTP 200)");
    assert(res5.data.isAvailable === false, "Listing is paused (isAvailable = false)");

    // Resume listing
    const res6 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/properties/${createdId}/toggle-availability`,
      method: 'PUT'
    });
    assert(res6.data.isAvailable === true, "Listing is resumed (isAvailable = true)");

    // 6. Test Delete Property
    const res7 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/properties/${createdId}`,
      method: 'DELETE'
    });
    assert(res7.status === 200, "Successfully deleted listing (HTTP 200)");

    // Verify deletion
    const res8 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/properties/${createdId}`,
      method: 'GET'
    });
    assert(res8.status === 404, "Deleted property returns 404 Not Found");

    console.log(`\n📊 Results: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
    process.exit(0);

  } catch (err) {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  }
}

runTests();
