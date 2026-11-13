/**
 * GharDekho — Slice P12: AI Vision Onboarding & Admin Console Test Suite
 * Validates:
 *  - AI Vision extraction from uploaded room & bathroom photos
 *  - Automated bed count and room sharing inference (Single, Double, 4-Bed Split)
 *  - Pre-filled landlord profile inheritance and benchmark rent suggestions
 *  - Admin console authentication (RBAC / x-admin-key)
 *  - Listing moderation (Approve / Shield Verified badge vs Reject)
 *  - Escrow payment audit ledger
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
  console.log('🧪 Starting Slice P12: AI Vision Onboarding & Admin Console Tests...\n');

  // --- 1. AI Vision Photo Extraction Pipeline ---
  console.log('--- 1. AI Vision Detail Extraction Pipeline ---');

  await it('Rejects extraction request with missing photos (HTTP 400)', async () => {
    const res = await request({ method: 'POST', path: '/api/properties/ai-extract-photos' }, {});
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'PHOTOS_REQUIRED');
  });

  await it('Infers 4-bed split room, attached bath & geyser from photos', async () => {
    const payload = {
      photos: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&room=4-bed-split',
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&bath=western'
      ],
      city: 'Kota',
      locality: 'Talwandi',
      ownerPreviousData: {
        propertyName: 'Balaji Executive PG',
        ownerName: 'Ramesh Sharma',
        ownerPhone: '+91 98290 12345'
      }
    };

    const res = await request({ method: 'POST', path: '/api/properties/ai-extract-photos' }, payload);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.confidence >= 0.9);
    assert.strictEqual(res.body.extractedData.suggestedRoom.maxOccupancy, 4);
    assert.strictEqual(res.body.extractedData.suggestedRoom.slots.length, 4);
    assert.strictEqual(res.body.extractedData.suggestedRoom.bathroomType, 'attached');
    assert.strictEqual(res.body.extractedData.prefillContact.ownerName, 'Ramesh Sharma');
    assert.strictEqual(res.body.extractedData.suggestedRoom.pricePerPerson, 3800); // Benchmark for Kota 4-bed
  });

  await it('Infers single room occupancy and benchmark rent for Pune', async () => {
    const payload = {
      photos: [
        'https://images.unsplash.com/photo-single-room-luxury.jpg'
      ],
      city: 'Pune',
      locality: 'Viman Nagar'
    };

    const res = await request({ method: 'POST', path: '/api/properties/ai-extract-photos' }, payload);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.extractedData.suggestedRoom.maxOccupancy, 1);
    assert.strictEqual(res.body.extractedData.suggestedRoom.pricePerPerson, 9000); // Benchmark for Pune single
  });

  // --- 2. Admin Authentication & Role Enforcement ---
  console.log('\n--- 2. Admin Authentication & Role Enforcement ---');

  await it('Rejects admin overview request without admin credentials (HTTP 403)', async () => {
    const res = await request({ method: 'GET', path: '/api/admin/overview' });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.error, 'ADMIN_ACCESS_REQUIRED');
  });

  await it('Grants admin overview access with valid x-admin-key header (HTTP 200)', async () => {
    const res = await request({
      method: 'GET',
      path: '/api/admin/overview',
      headers: { 'X-Admin-Key': 'ghardekho-super-admin-secret-2026' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.data.totalListings >= 1);
    assert.strictEqual(res.body.data.systemStatus, 'Operational');
  });

  // --- 3. Listing Moderation & Verification Badges ---
  console.log('\n--- 3. Listing Moderation & Verification Badges ---');

  await it('Approves property listing and awards Shield Verified badge', async () => {
    const res = await request({
      method: 'POST',
      path: '/api/admin/listings/prop-kota-01/approve',
      headers: { 'X-Admin-Key': 'ghardekho-super-admin-secret-2026' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.property.isVerified, true);
    assert(res.body.property.verificationBadge.includes('Shield Verified'));
  });

  await it('Rejects / flags fraudulent listing with custom reason and restores availability', async () => {
    const res = await request({
      method: 'POST',
      path: '/api/admin/listings/prop-kota-01/reject',
      headers: { 'X-Admin-Key': 'ghardekho-super-admin-secret-2026' }
    }, { reason: 'Photos do not match physical room inspection' });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.property.isAvailable, false);
    assert.strictEqual(res.body.property.isVerified, false);
    assert.strictEqual(res.body.property.rejectionReason, 'Photos do not match physical room inspection');

    // Restore availability so subsequent slice tests maintain 4 active listings
    await request({
      method: 'POST',
      path: '/api/admin/listings/prop-kota-01/approve',
      headers: { 'X-Admin-Key': 'ghardekho-super-admin-secret-2026' }
    });
  });

  // --- 4. Escrow & Token Audit Ledger ---
  console.log('\n--- 4. Escrow & Token Audit Ledger ---');

  await it('GET /api/admin/payments/escrow returns audit ledger', async () => {
    const res = await request({
      method: 'GET',
      path: '/api/admin/payments/escrow',
      headers: { 'X-Admin-Key': 'ghardekho-super-admin-secret-2026' }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(Array.isArray(res.body.payments));
  });

  // Finish Summary
  console.log(`\n📊 Results: ${passedTests} Passed, ${totalTests - passedTests} Failed`);
  if (passedTests === totalTests) {
    console.log('🛡️ All Slice P12 AI Vision Onboarding & Admin Console tests passed successfully!\n');
    process.exit(0);
  } else {
    console.error('💥 Some Slice P12 tests failed!\n');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
