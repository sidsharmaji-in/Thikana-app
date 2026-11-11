// Slice P1: Modular Architecture & Production Database Layer Verification Tests
const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const repository = require('../src/data/repository');
const { sanitizeInput } = require('../src/middleware/sanitizer');
const securityHeaders = require('../src/middleware/security');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
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

function request(apiPath, options = {}, data = null) {
  const reqOptions = {
    hostname: '127.0.0.1',
    port: 4000,
    path: apiPath,
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-bypass-rate-limit': 'test',
      ...(options.headers || {})
    }
  };
  return makeRequest(reqOptions, data);
}

async function runTests() {
  console.log('🧪 Starting Slice P1: Modular Architecture & Production DB Layer Tests...\n');
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
    // 1. App Factory & Modular Exports
    assert(typeof app === 'function', 'app.js exports configured Express application factory');
    assert(typeof repository.getProperties === 'function', 'repository exports getProperties() query method');
    assert(typeof repository.getPropertyById === 'function', 'repository exports getPropertyById() method');
    assert(typeof repository.bookSlot === 'function', 'repository exports bookSlot() concurrency method');
    assert(typeof repository.getStats === 'function', 'repository exports getStats() overview method');

    // 2. Middleware isolation
    assert(typeof securityHeaders === 'function', 'securityHeaders middleware is isolated and exportable');
    assert(typeof sanitizeInput === 'function', 'sanitizer helper is isolated and exportable');
    const xssResult = sanitizeInput('<script>alert("hack")</script>Plot 42');
    assert(xssResult === 'Plot 42', 'sanitizer strips script tags cleanly');

    // 3. Health probes (Production Kubernetes / Docker readiness & liveness)
    const liveRes = await request('/api/health/live');
    assert(liveRes.status === 200, 'GET /api/health/live responds with 200 OK');
    assert(liveRes.data.status === 'alive', 'Liveness probe reports status: "alive"');

    const readyRes = await request('/api/health/ready');
    assert(readyRes.status === 200, 'GET /api/health/ready responds with 200 OK');
    assert(readyRes.data.status === 'ready', 'Readiness probe reports status: "ready"');
    assert(readyRes.data.database === 'healthy', 'Readiness probe reports database: "healthy"');

    // 4. Platform stats endpoint
    const statsRes = await request('/api/stats');
    assert(statsRes.status === 200, 'GET /api/stats responds with 200 OK');
    assert(typeof statsRes.data.totalBeds === 'number', 'Platform stats reports numeric totalBeds');
    assert(statsRes.data.activeCities.includes('Kota'), 'Platform stats includes Kota as active city');

    // 5. Prisma Schema Production Verification
    const prismaPath = path.join(__dirname, '../../prisma/schema.prisma');
    assert(fs.existsSync(prismaPath), 'prisma/schema.prisma exists');
    const prismaContent = fs.readFileSync(prismaPath, 'utf8');
    assert(prismaContent.includes('datasource db'), 'Prisma schema defines datasource db');
    assert(prismaContent.includes('postgis()'), 'Prisma schema configures PostGIS extension');
    assert(prismaContent.includes('model User'), 'Prisma schema defines User model');
    assert(prismaContent.includes('model Property'), 'Prisma schema defines Property model');
    assert(prismaContent.includes('model BedSlot'), 'Prisma schema defines BedSlot model');
    assert(prismaContent.includes('model RoommateProfile'), 'Prisma schema defines RoommateProfile model');
    assert(prismaContent.includes('model Inquiry'), 'Prisma schema defines Inquiry model');
    assert(prismaContent.includes('model Notification'), 'Prisma schema defines Notification model');

    // 6. Repository geospatial precision calculation test
    const prop = repository.getPropertyById('prop-kota-01');
    assert(prop !== null && prop.id === 'prop-kota-01', 'Repository retrieves prop-kota-01 directly');
    const allenTalwandiLat = 25.1480;
    const allenTalwandiLng = 75.8450;
    const distanceList = repository.getProperties({ lat: allenTalwandiLat, lng: allenTalwandiLng, radiusKm: 5 });
    assert(Array.isArray(distanceList), 'Geospatial query returns array of listings');
    assert(distanceList.length > 0, 'Geospatial radius search found listings within 5km of Talwandi');
    assert(typeof distanceList[0].distanceKm === 'number', 'Computed distanceKm is a valid number');

    console.log(`\n📊 Results: ${passed} Passed, ${failed} Failed`);
    if (failed === 0) {
      console.log('🏛️ All Slice P1 Modular Architecture & Production DB Layer tests passed successfully!\n');
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
