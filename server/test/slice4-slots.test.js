// Slice 4: Shared Room Slot Engine & Roommate Verification Test
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
  console.log('🧪 Starting Slice 4: Shared Room Slot Engine & Roommate Verification Tests...\n');
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
    // 0. Ensure idempotent setup (reset s3 and s4 in room-k1 to available)
    await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/rooms/room-k1/slots/s3/status',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { status: 'available' });

    await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/rooms/room-k1/slots/s4/status',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { status: 'available' });

    // 1. Fetch seed property detail with shared rooms
    const res1 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01',
      method: 'GET'
    });
    assert(res1.status === 200, "GET /api/properties/prop-kota-01 responds with 200 OK");
    const property = res1.data.property;
    const room4Bed = property.rooms.find(r => r.id === 'room-k1');
    assert(Boolean(room4Bed), "Found 4-Bed Split Sharing Room (room-k1)");
    assert(room4Bed.slots.length === 4, "Room has exactly 4 bed slots matching maxOccupancy");

    // 2. Roommate profile compatibility verification
    const slot1 = room4Bed.slots.find(s => s.slotId === 's1');
    assert(slot1.status === 'occupied', "Slot 1 is marked as occupied");
    assert(slot1.tenantName.includes('Aryan'), `Occupant verified: ${slot1.tenantName}`);
    assert(Boolean(slot1.roommateProfile), "Slot 1 contains verified roommateProfile");
    assert(Boolean(slot1.roommateProfile.courseOrProfession), `Course/Exam: ${slot1.roommateProfile.courseOrProfession}`);
    assert(Array.isArray(slot1.roommateProfile.habits) && slot1.roommateProfile.habits.length > 0, 
      `Habit tags verified: ${slot1.roommateProfile.habits.join(', ')}`);
    assert(slot1.roommateProfile.vibeScore >= 90, `Compatibility vibe score verified: ${slot1.roommateProfile.vibeScore}%`);

    // 3. Double-booking prevention (concurrency / lock test)
    const doubleBookRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/book-slot',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      roomId: 'room-k1',
      slotId: 's1', // Already occupied
      tenantName: 'Intruder Tenant',
      tenantPhone: '+91 99999 88888'
    });
    assert(doubleBookRes.status === 400, "Prevents booking an already occupied slot (HTTP 400)");
    assert(doubleBookRes.data.success === false, "Response returns success = false on double booking");

    // 4. Reserve an available bed slot
    const bookVacantRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/book-slot',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      roomId: 'room-k1',
      slotId: 's3', // Available
      tenantName: 'Naveen Choudhary',
      tenantPhone: '+91 98888 77777',
      status: 'reserved'
    });
    assert(bookVacantRes.status === 200, "Successfully reserves vacant bed slot (HTTP 200)");
    assert(bookVacantRes.data.slot.status === 'reserved', "Slot status transitioned to 'reserved'");
    assert(bookVacantRes.data.slot.tenantName === 'Naveen Choudhary', "Slot tenant name properly recorded");

    // 5. Owner status update: Approve reservation to occupied
    const ownerApproveRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/rooms/room-k1/slots/s3/status',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      status: 'occupied',
      roommateProfile: {
        courseOrProfession: 'NEET 2027 Dropper',
        hometown: 'Bikaner, RJ',
        habits: ['Morning Person 🌅', 'Vegetarian 🥗'],
        vibeScore: 95
      }
    });
    assert(ownerApproveRes.status === 200, "Owner can transition slot from reserved to occupied (HTTP 200)");
    assert(ownerApproveRes.data.slot.status === 'occupied', "Slot status is now 'occupied'");
    assert(ownerApproveRes.data.room.currentOccupancy === 3, "Room occupancy updated to 3/4");

    // 6. Test invalid status value validation
    const invalidStatusRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/rooms/room-k1/slots/s3/status',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      status: 'invalid_status_xyz'
    });
    assert(invalidStatusRes.status === 400, "Rejects invalid status value with HTTP 400");

    // 7. Test Waitlist registration for full room
    const waitlistRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/rooms/room-k2/waitlist',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      tenantName: 'Sanjay Bishnoi',
      tenantPhone: '+91 98291 55667',
      preferredDate: '2026-12-15',
      notes: 'Need bed near Allen Samarth'
    });
    assert(waitlistRes.status === 201, "Successfully joined room waitlist (HTTP 201)");
    assert(waitlistRes.data.waitlistPosition >= 1, `Assigned waitlist queue position: #${waitlistRes.data.waitlistPosition}`);
    const newWaitlistId = waitlistRes.data.entry.id;

    // 8. Retrieve room waitlist
    const getWaitlistRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/rooms/room-k2/waitlist',
      method: 'GET'
    });
    assert(getWaitlistRes.status === 200, "Owner/Tenant can retrieve room waitlist (HTTP 200)");
    assert(getWaitlistRes.data.waitlist.some(w => w.tenantName === 'Sanjay Bishnoi'), 
      "Waitlist contains newly registered applicant");

    // 9. Owner assigns waitlisted candidate to vacant bed
    const wlRoom1Res = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/rooms/room-k1/waitlist',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      tenantName: 'Raghav Mathur',
      tenantPhone: '+91 94142 33441',
      preferredDate: '2026-11-20',
      notes: 'Immediate move-in'
    });
    assert(wlRoom1Res.status === 201, "Added Raghav to room-k1 waitlist");
    const raghavWlId = wlRoom1Res.data.entry.id;

    // Owner assigns Raghav to vacant bed (s4) in room-k1
    const assignRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/properties/prop-kota-01/rooms/room-k1/waitlist/${raghavWlId}/assign`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    assert(assignRes.status === 200, "Owner successfully assigns waitlisted candidate to vacant bed (HTTP 200)");
    assert(assignRes.data.assignedSlot.tenantName === 'Raghav Mathur', "Vacant bed assigned to candidate");
    assert(assignRes.data.room.currentOccupancy === 4, "Room is now fully occupied (4/4)");

    // 10. Owner releases beds back to vacant for complete cleanup
    const releaseRes4 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/rooms/room-k1/slots/s4/status',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      status: 'available'
    });
    assert(releaseRes4.status === 200, "Owner marks bed s4 as vacant/available (HTTP 200)");
    assert(releaseRes4.data.slot.status === 'available', "Slot s4 status is now 'available'");
    assert(releaseRes4.data.slot.tenantName === null, "Tenant information cleared from vacant slot");

    const releaseRes3 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/rooms/room-k1/slots/s3/status',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      status: 'available'
    });
    assert(releaseRes3.status === 200, "Owner marks bed s3 back to available (HTTP 200)");
    assert(releaseRes3.data.room.currentOccupancy === 2, "Room occupancy restored back to original 2/4");

    // 11. Delete waitlist entry
    const delWlRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/properties/prop-kota-01/rooms/room-k2/waitlist/${newWaitlistId}`,
      method: 'DELETE'
    });
    assert(delWlRes.status === 200, "Waitlist entry can be cancelled/removed (HTTP 200)");

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n📊 Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
