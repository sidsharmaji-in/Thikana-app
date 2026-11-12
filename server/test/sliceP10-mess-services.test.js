/**
 * GharDekho — Slice P10: Hyperlocal Mess & Daily Tiffin Service Test Suite
 * Verifies near-hostel mess discovery, walking distance metrics, FSSAI hygiene ratings,
 * daily lunch/dinner menu updates, student review upvoting, and tiffin subscriptions.
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
  console.log('🧪 Starting Slice P10: Hyperlocal Mess & Daily Tiffin Service Tests...\n');

  // --- 1. Mess Discovery & Proximity Radar ---
  console.log('--- 1. Mess Discovery & Proximity Radar ---');

  await it('GET /api/mess returns all seeded mess centers', async () => {
    const res = await request({ method: 'GET', path: '/api/mess' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.messCenters.length >= 3, 'Found at least 3 seeded mess centers');
  });

  await it('GET /api/mess/property/prop-kota-01 discovers messes within 200m walking radius', async () => {
    const res = await request({ method: 'GET', path: '/api/mess/property/prop-kota-01' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.count, 2);
    
    const annapurna = res.body.messCenters.find((m) => m.name.includes('Annapurna'));
    assert(annapurna, 'Annapurna Mess found for prop-kota-01');
    assert.strictEqual(annapurna.distanceMeters, 60);
    assert.strictEqual(annapurna.walkingMinutes, 1);
    assert.strictEqual(annapurna.dietType, 'pure_veg');
    assert(annapurna.fssaiNumber.length >= 14, 'Has valid 14-digit FSSAI registration');
  });

  await it('Filters messes by dietType (pure_veg)', async () => {
    const res = await request({ method: 'GET', path: '/api/mess?dietType=pure_veg' });
    assert.strictEqual(res.status, 200);
    assert(res.body.messCenters.every((m) => m.dietType === 'pure_veg'));
  });

  await it('Filters messes by maxMonthlyPrice (<= ₹3,300)', async () => {
    const res = await request({ method: 'GET', path: '/api/mess?maxMonthlyPrice=3300' });
    assert.strictEqual(res.status, 200);
    assert(res.body.messCenters.every((m) => m.plans.monthlyBothMeals <= 3300));
  });

  await it('Filters messes by maxDistanceMeters (<= 100m)', async () => {
    const res = await request({ method: 'GET', path: '/api/mess?maxDistanceMeters=100' });
    assert.strictEqual(res.status, 200);
    assert(res.body.messCenters.every((m) => m.distanceMeters <= 100));
  });

  // --- 2. Single Mess Details & Daily Menu ---
  console.log('\n--- 2. Single Mess Details & Daily Menu ---');

  await it('GET /api/mess/:id returns full mess profile with todayMenu', async () => {
    const res = await request({ method: 'GET', path: '/api/mess/mess-kota-01' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.messCenter.todayMenu.lunch && res.body.messCenter.todayMenu.lunch.main);
    assert(res.body.messCenter.todayMenu.dinner && res.body.messCenter.todayMenu.dinner.main);
    assert(res.body.messCenter.hygieneRating >= 4.0);
  });

  await it('Returns 404 for non-existent mess ID', async () => {
    const res = await request({ method: 'GET', path: '/api/mess/mess-invalid-999' });
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error, 'MESS_NOT_FOUND');
  });

  await it('PUT /api/mess/:id/menu updates daily lunch menu', async () => {
    const payload = {
      mealType: 'lunch',
      menuData: {
        main: 'Chole Masala & Aloo Jeera',
        bread: '4 Hot Tawa Rotis',
        rice: 'Basmati Rice',
        saladSweet: 'Onion Salad + Gulab Jamun'
      }
    };
    const res = await request({ method: 'PUT', path: '/api/mess/mess-kota-01/menu' }, payload);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.menu.main, 'Chole Masala & Aloo Jeera');
  });

  // --- 3. Student Reviews & Hygiene Scoring ---
  console.log('\n--- 3. Student Reviews & Hygiene Scoring ---');

  await it('POST /api/mess/:id/reviews adds verified student review and updates average rating', async () => {
    const payload = {
      studentName: 'Nikhil R.',
      coaching: 'Allen Dropper Batch',
      rating: 5,
      comment: 'Super clean steel thalis, food is neither too oily nor too spicy. Perfect for Kota long hours.'
    };
    const res = await request({ method: 'POST', path: '/api/mess/mess-kota-01/reviews' }, payload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.review.studentName, 'Nikhil R.');
    assert(res.body.newHygieneRating >= 4.0);
  });

  await it('Rejects review with invalid rating range (> 5)', async () => {
    const payload = {
      rating: 6,
      comment: 'Too high'
    };
    const res = await request({ method: 'POST', path: '/api/mess/mess-kota-01/reviews' }, payload);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'INVALID_RATING_RANGE');
  });

  await it('POST /api/mess/:id/reviews/:reviewId/upvote increments helpful counter', async () => {
    const res = await request({ method: 'POST', path: '/api/mess/mess-kota-01/reviews/mrev-01/upvote' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert(res.body.upvotes >= 43);
  });

  // --- 4. Tiffin Monthly Subscription & Room Delivery ---
  console.log('\n--- 4. Tiffin Monthly Subscription & Room Delivery ---');

  await it('POST /api/mess/:id/subscribe activates monthly tiffin with room delivery', async () => {
    const payload = {
      planType: 'monthlyBothMeals',
      deliveryRoom: 'Room 204 (Bed 1)',
      startDate: '2026-12-01',
      durationMonths: 1
    };
    const res = await request({
      method: 'POST',
      path: '/api/mess/mess-kota-01/subscribe',
      headers: { 'X-User-Id': 'tenant-test-aryan' }
    }, payload);

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.subscription.messId, 'mess-kota-01');
    assert.strictEqual(res.body.subscription.monthlyPrice, 3200);
    assert.strictEqual(res.body.subscription.totalAmount, 3200);
    assert.strictEqual(res.body.subscription.deliveryRoom, 'Room 204 (Bed 1)');
    assert.strictEqual(res.body.subscription.status, 'active');
  });

  await it('Rejects subscription with invalid plan type', async () => {
    const payload = {
      planType: 'invalid_snack_plan',
      deliveryRoom: 'Room 204'
    };
    const res = await request({ method: 'POST', path: '/api/mess/mess-kota-01/subscribe' }, payload);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'INVALID_PLAN_TYPE');
  });

  // --- 5. New Mess Registration ---
  console.log('\n--- 5. New Mess Registration ---');

  await it('POST /api/mess registers a new mess center', async () => {
    const payload = {
      name: 'Shree Krishna Pure Thali',
      propertyId: 'prop-kota-02',
      operatorName: 'Radheshyam Sharma',
      distanceMeters: 90,
      address: 'Near Resonance Vigyan Nagar',
      fssaiNumber: '22224099000111',
      plans: {
        monthlyBothMeals: 2900,
        monthlyLunchOnly: 1600,
        monthlyDinnerOnly: 1600,
        singleThali: 80
      }
    };
    const res = await request({ method: 'POST', path: '/api/mess' }, payload);
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.messCenter.name, 'Shree Krishna Pure Thali');
    assert.strictEqual(res.body.messCenter.plans.monthlyBothMeals, 2900);
    assert.strictEqual(res.body.messCenter.walkingMinutes, 1);
  });

  await it('Rejects registration with missing propertyId', async () => {
    const payload = {
      name: 'Nameless Mess',
      plans: { monthlyBothMeals: 3000 }
    };
    const res = await request({ method: 'POST', path: '/api/mess' }, payload);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'PROPERTY_ID_REQUIRED');
  });

  // Finish Summary
  console.log(`\n📊 Results: ${passedTests} Passed, ${totalTests - passedTests} Failed`);
  if (passedTests === totalTests) {
    console.log('🍲 All Slice P10 Mess & Tiffin Service tests passed successfully!\n');
    process.exit(0);
  } else {
    console.error('💥 Some Slice P10 tests failed!\n');
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
