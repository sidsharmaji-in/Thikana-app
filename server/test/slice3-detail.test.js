// Slice 3: Full Listing Detail & Hyperlocal Verification Test
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
  console.log('🧪 Starting Slice 3: Full Listing Detail & Hyperlocal Amenities Tests...\n');
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
    // 1. Fetch seed property detail
    const res1 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01',
      method: 'GET'
    });
    assert(res1.status === 200, "GET /api/properties/prop-kota-01 responds with 200 OK");
    const p = res1.data.property;

    // 2. Photo gallery verification
    assert(Array.isArray(p.photos) && p.photos.length >= 3, 
      `Listing contains high-resolution photo gallery (found ${p.photos.length} photos)`);
    assert(p.photos[0].startsWith('http'), "Photo URLs are valid accessible links");

    // 3. Hyperlocal water & power amenities verification
    assert(Boolean(p.amenities.waterSupply), `Water supply schedule verified: ${p.amenities.waterSupply}`);
    assert(Boolean(p.amenities.waterTiming), `Jal timing alerts verified: ${p.amenities.waterTiming}`);
    assert(Boolean(p.amenities.electricityBackup), `Power cut resilience verified: ${p.amenities.electricityBackup}`);
    assert(Boolean(p.amenities.bathroom), `Bathroom type verified: ${p.amenities.bathroom}`);

    // 4. Room sharing configuration & bed slot integrity
    assert(Array.isArray(p.rooms) && p.rooms.length > 0, "Contains room configurations");
    const room = p.rooms[0];
    assert(room.slots.length === room.maxOccupancy, 
      `Slot count (${room.slots.length}) matches maxOccupancy (${room.maxOccupancy})`);
    assert(room.pricePerPerson > 0, `Per-person rent verified: ₹${room.pricePerPerson}/month`);

    // 5. Nearby Places & Transit verified distances
    assert(Array.isArray(p.nearbyPlaces) && p.nearbyPlaces.length > 0, "Nearby places list present");
    assert(p.nearbyPlaces.some(n => n.name.includes('Allen') || n.distance.includes('m')), 
      `Coaching / landmark distance verified: ${p.nearbyPlaces[0].name} (${p.nearbyPlaces[0].distance})`);

    // 6. Owner profile & zero-brokerage contact info
    assert(Boolean(p.owner.name), `Owner name verified: ${p.owner.name}`);
    assert(Boolean(p.owner.whatsapp), `WhatsApp direct number present: ${p.owner.whatsapp}`);
    assert(Boolean(p.owner.responseRate), `Owner response rate verified: ${p.owner.responseRate}`);

    // 7. Test 404 for invalid property ID
    const res2 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-non-existent-999',
      method: 'GET'
    });
    assert(res2.status === 404, "Invalid property ID returns HTTP 404 Not Found");

    // 8. Test In-Sheet "Schedule a Room Visit" Integration
    const visitPayload = {
      propertyId: "prop-kota-01",
      tenantName: "Rohan Verma",
      tenantPhone: "+91 98111 22334",
      message: "Scheduled visit for Tomorrow at 11:30 AM to inspect Room 204.",
      scheduledVisitDate: "Tomorrow 11:30 AM"
    };
    const res3 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/inquiries',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, visitPayload);
    assert(res3.status === 201, "Successfully booked scheduled room visit (HTTP 201)");
    assert(res3.data.inquiry.scheduledVisitDate === "Tomorrow 11:30 AM", "Visit date and time slot stored properly");

    // 9. Verify inquiry is retrieved by owner dashboard
    const res4 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/inquiries',
      method: 'GET'
    });
    assert(res4.status === 200, "Owner retrieves inquiries list with 200 OK");
    const foundInq = res4.data.inquiries.find(i => i.tenantName === "Rohan Verma");
    assert(Boolean(foundInq), "Owner dashboard receives lead with tenant visit schedule");

    console.log(`\n📊 Results: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
    process.exit(0);

  } catch (err) {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  }
}

runTests();

