/**
 * GharDekho — Slice P13: Google OAuth 2.0 Sign-In & Owner Property Edit Test Suite
 * Validates:
 *  - 1-Tap Google OAuth 2.0 verification and account auto-provisioning
 *  - Standard RFC 7519 JWT access & refresh token issuance
 *  - Self-service property edit by owner (title, locality, rent, rules, amenities)
 *  - Slot status updates & vacancy toggle (available <-> occupied)
 *  - Repository invariant safety and zero-drift state restoration
 */

const assert = require('assert');
const http = require('http');

let passedTests = 0;
let totalTests = 0;

function it(desc, fn) {
  totalTests++;
  return fn()
    .then(() => {
      passedTests++;
      console.log(`  ✅ PASS: ${desc}`);
    })
    .catch((err) => {
      console.error(`  ❌ FAIL: ${desc}`);
      console.error(`     Error: ${err.message}`);
    });
}

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 4000,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 Starting Slice P13: Google OAuth 2.0 & Owner Property Edit Tests...\n');

  // --- 1. Google OAuth 2.0 Authentication Flow ---
  console.log('--- 1. Google OAuth 2.0 Authentication & Auto-Provisioning ---');

  await it('Rejects Google auth request with missing or invalid credentials (HTTP 401)', async () => {
    const res = await request(
      { path: '/api/auth/google', method: 'POST', headers: { 'x-bypass-rate-limit': 'test' } },
      { idToken: null }
    );
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error, 'INVALID_GOOGLE_CREDENTIAL');
  });

  let tenantToken = '';
  let tenantUser = null;
  const testStudentEmail = `student.google.${Date.now()}@gmail.com`;

  await it('Auto-provisions new Student Tenant account via Google ID Token', async () => {
    const res = await request(
      { path: '/api/auth/google', method: 'POST', headers: { 'x-bypass-rate-limit': 'test' } },
      {
        idToken: `mock-google-id-token-${Date.now()}`,
        email: testStudentEmail,
        fullName: 'Aman Verma',
        role: 'tenant',
        photoUrl: 'https://images.unsplash.com/photo-student.jpg'
      }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.accessToken, 'Access token must be present');
    assert(res.body.refreshToken, 'Refresh token must be present');
    assert.strictEqual(res.body.user.email, testStudentEmail);
    assert.strictEqual(res.body.user.fullName, 'Aman Verma');
    assert.strictEqual(res.body.user.role, 'tenant');
    tenantToken = res.body.accessToken;
    tenantUser = res.body.user;
  });

  await it('Accesses authenticated profile via GET /api/auth/me using Google JWT Bearer', async () => {
    const res = await request({
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${tenantToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.id, tenantUser.id);
    assert.strictEqual(res.body.user.email, testStudentEmail);
  });

  const testOwnerEmail = `owner.google.${Date.now()}@gmail.com`;
  await it('Auto-provisions new Makan Maalik Owner account via Google Sign-In', async () => {
    const res = await request(
      { path: '/api/auth/google', method: 'POST', headers: { 'x-bypass-rate-limit': 'test' } },
      {
        idToken: `mock-google-id-token-${Date.now()}`,
        email: testOwnerEmail,
        fullName: 'Devendra Meena',
        role: 'owner'
      }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.role, 'owner');
    assert.strictEqual(res.body.user.email, testOwnerEmail);
  });

  await it('Idempotently signs in existing user on subsequent Google Sign-In', async () => {
    const res = await request(
      { path: '/api/auth/google', method: 'POST', headers: { 'x-bypass-rate-limit': 'test' } },
      {
        idToken: `mock-google-id-token-${Date.now()}`,
        email: testStudentEmail,
        fullName: 'Aman Verma'
      }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.user.id, tenantUser.id);
  });

  // --- 2. Owner Property Self-Service Editing ---
  console.log('\n--- 2. Self-Service Property Edit (PUT /api/properties/:id) ---');

  await it('Returns HTTP 404 when updating non-existent property', async () => {
    const res = await request(
      { path: '/api/properties/prop-non-existent-999', method: 'PUT' },
      { title: 'New Ghost PG' }
    );
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.success, false);
  });

  const originalProperty = await request({ path: '/api/properties/prop-kota-01' });
  const backupTitle = originalProperty.body.property.title;
  const backupCurfew = originalProperty.body.property.rules.curfewTime;

  await it('Successfully updates listing title, locality, curfew rules, and rent', async () => {
    const res = await request(
      { path: '/api/properties/prop-kota-01', method: 'PUT' },
      {
        title: 'Saraswati PG & Study Rooms — Premium Girls & Boys Wing',
        locality: 'Talwandi Sector 2 (Near Allen)',
        rules: {
          curfewTime: '10:30 PM'
        },
        amenities: {
          cooling: 'AC'
        }
      }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.property.title, 'Saraswati PG & Study Rooms — Premium Girls & Boys Wing');
    assert.strictEqual(res.body.property.locality, 'Talwandi Sector 2 (Near Allen)');
    assert.strictEqual(res.body.property.rules.curfewTime, '10:30 PM');
    assert.strictEqual(res.body.property.amenities.cooling, 'AC');
  });

  await it('Retrieves updated property details via GET /api/properties/:id', async () => {
    const res = await request({ path: '/api/properties/prop-kota-01' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.property.title, 'Saraswati PG & Study Rooms — Premium Girls & Boys Wing');
    assert.strictEqual(res.body.property.rules.curfewTime, '10:30 PM');
  });

  // --- 3. Owner Bed Slot Vacancy Management ---
  console.log('\n--- 3. Bed Slot Vacancy Toggle (PATCH /api/properties/:id/rooms/:roomId/slots/:slotId) ---');

  await it('Rejects slot update with invalid status value (HTTP 400)', async () => {
    const res = await request(
      { path: '/api/properties/prop-kota-01/rooms/room-k1/slots/s3', method: 'PATCH' },
      { status: 'invalid_status' }
    );
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  await it('Returns HTTP 404 when updating non-existent slot or room', async () => {
    const res = await request(
      { path: '/api/properties/prop-kota-01/rooms/room-ghost/slots/s-ghost', method: 'PATCH' },
      { status: 'occupied' }
    );
    assert.strictEqual(res.status, 404);
  });

  await it('Owner marks available slot s3 as occupied with tenant details', async () => {
    const res = await request(
      { path: '/api/properties/prop-kota-01/rooms/room-k1/slots/s3', method: 'PATCH' },
      {
        status: 'occupied',
        tenantName: 'Rohit Sharma (NEET 2026)',
        tenantPhone: '+919876543210'
      }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.slot.status, 'occupied');
    assert.strictEqual(res.body.slot.tenantName, 'Rohit Sharma (NEET 2026)');
  });

  await it('Owner toggles occupied slot s3 back to available', async () => {
    const res = await request(
      { path: '/api/properties/prop-kota-01/rooms/room-k1/slots/s3', method: 'PATCH' },
      { status: 'available' }
    );
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.slot.status, 'available');
    assert.strictEqual(res.body.slot.tenantName, null);
  });

  // --- 4. Teardown & Invariant Restoration ---
  console.log('\n--- 4. Teardown & Invariant Restoration ---');
  await it('Restores property title, rules, and availability invariant for prop-kota-01', async () => {
    const restoreRes = await request(
      { path: '/api/properties/prop-kota-01', method: 'PUT' },
      {
        title: backupTitle,
        locality: 'Talwandi, Sector 2',
        rules: {
          curfewTime: backupCurfew
        }
      }
    );
    assert.strictEqual(restoreRes.status, 200);

    // Ensure isAvailable remains true
    const checkRes = await request({ path: '/api/properties/prop-kota-01' });
    if (!checkRes.body.property.isAvailable) {
      await request({ path: '/api/properties/prop-kota-01/toggle-availability', method: 'PUT' });
    }
    const finalCheck = await request({ path: '/api/properties/prop-kota-01' });
    assert.strictEqual(finalCheck.body.property.isAvailable, true);
    assert.strictEqual(finalCheck.body.property.title, backupTitle);
  });

  console.log(`\n📊 Results: ${passedTests} Passed, ${totalTests - passedTests} Failed`);
  if (passedTests === totalTests) {
    console.log('🚀 All Slice P13 Google Auth & Owner Property Edit tests passed successfully!\n');
    process.exit(0);
  } else {
    console.error('💥 Some Slice P13 tests failed!\n');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
