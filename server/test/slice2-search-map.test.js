// Slice 2: Tenant Search & Interactive Map Engine Automated Verification Test
const http = require('http');

function makeRequest(options) {
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
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Slice 2: Tenant Search & Interactive Map Tests...\n');
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
    // 1. Test Base Properties API
    const res1 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties',
      method: 'GET'
    });
    assert(res1.status === 200, "GET /api/properties responds with 200 OK");
    assert(res1.data.properties.length >= 4, `Initial properties available (found ${res1.data.properties.length})`);

    // 2. Test City Filtering
    const res2 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties?city=Kota',
      method: 'GET'
    });
    assert(res2.status === 200, "City filter: Kota responds with 200 OK");
    assert(res2.data.properties.every(p => p.city.toLowerCase() === 'kota'), "All returned properties belong to Kota");

    // 3. Test Budget Range Filtering (Max Budget ₹5,000)
    const res3 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties?budgetMax=5000',
      method: 'GET'
    });
    assert(res3.status === 200, "Budget max filter (<= ₹5,000) responds with 200 OK");
    assert(res3.data.properties.every(p => Math.min(...p.rooms.map(r => r.pricePerPerson)) <= 5000), 
      "All returned rooms have at least one bed <= ₹5,000");

    // 4. Test Haversine Distance Calculation & Radius Search
    // User located in Talwandi Kota: lat 25.1388, lng 75.8344
    const res4 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties?lat=25.1388&lng=75.8344&radiusKm=5',
      method: 'GET'
    });
    assert(res4.status === 200, "Geospatial radius search responds with 200 OK");
    assert(res4.data.properties.length > 0, "Finds properties within 5km radius");
    assert(res4.data.properties.every(p => p.distanceKm !== undefined && p.distanceKm <= 5), 
      "Calculated distanceKm is present and <= 5km for all results");

    // 5. Test Distance Sorting (Nearest First)
    const res5 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties?lat=25.1388&lng=75.8344&sortBy=distance',
      method: 'GET'
    });
    const dists = res5.data.properties.map(p => p.distanceKm);
    let isSortedByDist = true;
    for (let i = 1; i < dists.length; i++) {
      if (dists[i] < dists[i - 1]) isSortedByDist = false;
    }
    assert(isSortedByDist, "Results are correctly sorted by ascending distance");

    // 6. Test Price Sorting (Low to High)
    const res6 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties?sortBy=price_asc',
      method: 'GET'
    });
    const prices = res6.data.properties.map(p => Math.min(...p.rooms.map(r => r.pricePerPerson)));
    let isSortedByPrice = true;
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] < prices[i - 1]) isSortedByPrice = false;
    }
    assert(isSortedByPrice, "Results are correctly sorted by ascending rent per person");

    // 7. Test Sharing Occupancy Filter (4-Sharing split rooms)
    const res7 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties?sharing=4',
      method: 'GET'
    });
    assert(res7.status === 200, "Sharing occupancy filter (4-Bed) responds with 200 OK");
    assert(res7.data.properties.every(p => p.rooms.some(r => r.maxOccupancy === 4)), 
      "All returned properties contain 4-bed split room configurations");

    // 8. Test Indian Amenity Filters (WiFi & 24hr Power Backup)
    const res8 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties?amenities=wifi,powerbackup',
      method: 'GET'
    });
    assert(res8.status === 200, "Amenity filter (WiFi + Power Backup) responds with 200 OK");
    assert(res8.data.properties.every(p => 
      p.amenities.wifi && !p.amenities.electricityBackup.toLowerCase().includes('no')), 
      "Filtered properties verify both WiFi and Power backup availability");

    // 9. Test Search Query Keyword (Coaching / Landmark)
    const res9 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties?query=Allen',
      method: 'GET'
    });
    assert(res9.status === 200, "Search query keyword search responds with 200 OK");
    assert(res9.data.properties.length > 0, "Returns matches for 'Allen' coaching area");

    console.log(`\n📊 Results: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
    process.exit(0);

  } catch (err) {
    console.error('Fatal test runner error:', err);
    process.exit(1);
  }
}

runTests();

