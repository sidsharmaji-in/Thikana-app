/**
 * Slice 8 Automated Verification Test Suite
 * Hardening: Security Headers, Input Sanitization, Rate Limiting, 
 * Accessibility (a11y), Offline Sync & PWA Service Worker
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4000';

function request(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: json });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

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

async function runTests() {
  console.log('🧪 Starting Slice 8: Hardening, Security, a11y & Offline Tests...\n');

  try {
    // -------------------------------------------------------------
    // Test Group 1: HTTP Security Headers
    // -------------------------------------------------------------
    const healthRes = await request('/api/health');
    assert(healthRes.status === 200, 'GET /api/health responds with 200 OK');
    assert(healthRes.data.status === 'healthy', 'Health check status reports "healthy"');
    assert(typeof healthRes.data.uptime === 'number', `Uptime reported: ${healthRes.data.uptime}s`);

    const headers = healthRes.headers;
    assert(headers['x-content-type-options'] === 'nosniff', 'Security Header present: X-Content-Type-Options: nosniff');
    assert(headers['x-frame-options'] === 'SAMEORIGIN', 'Security Header present: X-Frame-Options: SAMEORIGIN');
    assert(headers['x-xss-protection'] === '1; mode=block', 'Security Header present: X-XSS-Protection: 1; mode=block');
    assert(headers['referrer-policy'] === 'strict-origin-when-cross-origin', 'Security Header present: Referrer-Policy: strict-origin-when-cross-origin');

    // -------------------------------------------------------------
    // Test Group 2: XSS & HTML Input Sanitization
    // -------------------------------------------------------------
    // 2a. Inquiry sanitization
    const maliciousInquiry = await request('/api/inquiries', {
      method: 'POST',
      headers: { 'x-bypass-rate-limit': 'test' },
      body: {
        propertyId: 'prop-kota-01',
        tenantName: '<script>alert("hacked")</script>Suresh Kumar',
        tenantPhone: '+91 99887 76655',
        message: '<iframe src="javascript:alert(1)"></iframe>Interested in quiet study room near Allen.'
      }
    });
    assert(maliciousInquiry.status === 201, 'POST /api/inquiries responds with HTTP 201');
    assert(!maliciousInquiry.data.inquiry.tenantName.includes('<script>'), 'Sanitized script tag out of tenantName');
    assert(maliciousInquiry.data.inquiry.tenantName.includes('Suresh Kumar'), 'Clean tenantName preserved');
    assert(!maliciousInquiry.data.inquiry.message.includes('<iframe'), 'Sanitized iframe tag out of message');
    assert(maliciousInquiry.data.inquiry.message.includes('Interested in quiet study room'), 'Clean message content preserved');

    // 2b. Chat message sanitization
    const maliciousMsg = await request(`/api/inquiries/${maliciousInquiry.data.inquiry.id}/messages`, {
      method: 'POST',
      headers: { 'x-bypass-rate-limit': 'test' },
      body: {
        senderRole: 'tenant',
        senderName: 'Suresh Kumar',
        text: '<img src=x onerror=alert(document.cookie)>Please confirm room visit'
      }
    });
    assert(maliciousMsg.status === 201, 'POST /api/inquiries/:id/messages responds with HTTP 201');
    assert(!maliciousMsg.data.message.text.includes('<img'), 'Sanitized raw img HTML tag out of chat message');
    assert(!maliciousMsg.data.message.text.includes('onerror='), 'Sanitized event handler onerror out of chat message');

    // 2c. Review comment sanitization
    const maliciousReview = await request('/api/properties/prop-kota-01/reviews', {
      method: 'POST',
      headers: { 'x-bypass-rate-limit': 'test' },
      body: {
        tenantName: 'Kunal S.<script>',
        rating: 5,
        title: '<b onmouseover="alert(1)">Very Good Hostel</b>',
        comment: '<script>window.location="http://evil.com"</script>Great study environment with 24hr power backup!'
      }
    });
    assert(maliciousReview.status === 201, 'POST /api/properties/:id/reviews responds with HTTP 201');
    assert(!maliciousReview.data.review.comment.includes('<script>'), 'Sanitized malicious script tag from review comment');
    assert(maliciousReview.data.review.comment.includes('Great study environment'), 'Clean review text preserved');

    // -------------------------------------------------------------
    // Test Group 3: Rate Limiting Engine
    // -------------------------------------------------------------
    // Verify rapid burst triggers 429
    let rateLimitTriggered = false;
    let retryAfterHeader = null;

    // Send 25 rapid requests from unique dummy IP header to trigger rate limit threshold (20)
    const testIp = '198.51.100.99';
    for (let i = 0; i < 25; i++) {
      const burstRes = await request('/api/inquiries', {
        method: 'POST',
        headers: {
          'x-forwarded-for': testIp
        },
        body: {
          propertyId: 'prop-kota-01',
          tenantName: `Burst Tester ${i}`,
          message: 'Rate limit burst test inquiry message'
        }
      });

      if (burstRes.status === 429) {
        rateLimitTriggered = true;
        retryAfterHeader = burstRes.headers['retry-after'];
        break;
      }
    }
    assert(rateLimitTriggered === true, 'Rate limiter triggers HTTP 429 Too Many Requests upon rapid bursts');
    assert(retryAfterHeader !== null, `Retry-After header present: ${retryAfterHeader}s`);

    // Verify test bypass header allows unlimited authorized requests
    const bypassRes = await request('/api/inquiries', {
      method: 'POST',
      headers: {
        'x-bypass-rate-limit': 'test',
        'x-forwarded-for': testIp
      },
      body: {
        propertyId: 'prop-kota-01',
        tenantName: 'Bypass Tester',
        message: 'Bypassed rate limit test message'
      }
    });
    assert(bypassRes.status === 201, 'x-bypass-rate-limit: test header cleanly bypasses rate limiting for testing');

    // -------------------------------------------------------------
    // Test Group 4: Offline Action Batch Sync Endpoint
    // -------------------------------------------------------------
    const offlineSyncRes = await request('/api/sync/offline-actions', {
      method: 'POST',
      body: {
        actions: [
          { id: 'act-1', type: 'save_property', propertyId: 'prop-jaipur-03' },
          { id: 'act-2', type: 'unsave_property', propertyId: 'prop-pune-02' }
        ]
      }
    });
    assert(offlineSyncRes.status === 200, 'POST /api/sync/offline-actions responds with 200 OK');
    assert(offlineSyncRes.data.success === true, 'Sync reports success');
    assert(offlineSyncRes.data.syncedCount === 2, 'Successfully synchronized 2 offline actions');

    // Verify saved properties list reflects offline synced actions
    const verifySavedRes = await request('/api/saved');
    const hasJaipur = verifySavedRes.data.properties.some(p => p.id === 'prop-jaipur-03');
    assert(hasJaipur === true, 'Offline saved property (prop-jaipur-03) successfully synced into active wishlist');

    // Clean up
    await request('/api/saved/prop-jaipur-03', { method: 'DELETE' });

    // -------------------------------------------------------------
    // Test Group 5: Progressive Web App & Service Worker Files
    // -------------------------------------------------------------
    const swPath = path.join(__dirname, '../../client/sw.js');
    assert(fs.existsSync(swPath), 'client/sw.js Service Worker file exists');

    const swContent = fs.readFileSync(swPath, 'utf8');
    assert(swContent.includes('CACHE_NAME'), 'Service worker defines CACHE_NAME');
    assert(swContent.includes('STATIC_ASSETS'), 'Service worker specifies pre-cached STATIC_ASSETS');
    assert(swContent.includes('caches.match'), 'Service worker implements cache-first / network fallback');

    // -------------------------------------------------------------
    // Test Group 6: Accessibility (a11y) & Screen Reader Audits
    // -------------------------------------------------------------
    const htmlPath = path.join(__dirname, '../../client/index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    assert(htmlContent.includes('id="a11yAnnouncer"'), 'Live screen reader announcer element present (id="a11yAnnouncer")');
    assert(htmlContent.includes('aria-live="polite"'), 'a11y announcer configures aria-live="polite" for non-intrusive TalkBack voice alerts');
    assert(htmlContent.includes('role="dialog"'), 'Modals declare semantic role="dialog"');
    assert(htmlContent.includes('aria-modal="true"'), 'Modals declare aria-modal="true" for accessible focus trap');
    assert(htmlContent.includes('id="offlineBanner"'), 'Offline stale data warning banner present in DOM (id="offlineBanner")');

    // CSS touch targets and reduced motion
    const cssPath = path.join(__dirname, '../../client/css/styles.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    assert(cssContent.includes('@media (prefers-reduced-motion: reduce)'), 'CSS includes @media (prefers-reduced-motion: reduce) block');
    assert(cssContent.includes('.sr-only'), 'CSS includes .sr-only accessible utility class');
    assert(cssContent.includes('min-height: 44px') || cssContent.includes('min-height: 48px'), 'CSS enforces minimum 44px/48dp touch targets on mobile interactive controls');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n📊 Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🛡️ All Slice 8 Hardening, Security, a11y & Offline tests passed successfully!\n');
    process.exit(0);
  }
}

runTests();
