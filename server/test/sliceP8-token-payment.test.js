// Slice P8: Refundable ₹500 Token Advance Payment Integration Tests
const http = require('http');
const { paymentService } = require('../src/services/paymentService');
const bedLockService = require('../src/services/bedLockService');

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
  console.log('🧪 Starting Slice P8: Razorpay Token Advance & Refund Escrow Tests...\n');
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

  // --- 1. Order Creation Tests ---
  console.log('--- 1. Token Advance Order Creation ---');
  
  // Rejection of missing parameters
  const missingRes = await request('/api/payments/token-advance/order', { method: 'POST' }, {});
  assert(missingRes.status === 400, 'Rejects order creation with missing parameters (HTTP 400)');
  assert(missingRes.data.error === 'MISSING_PARAMETERS', 'Returns MISSING_PARAMETERS error code');

  // Rejection of invalid property
  const invalidPropRes = await request('/api/payments/token-advance/order', { method: 'POST' }, {
    propertyId: 'non-existent-prop',
    roomId: 'room-k1',
    slotId: 's3'
  });
  assert(invalidPropRes.status === 404, 'Returns 404 for non-existent property');

  // Successfully create order for available bed slot
  const createOrderRes = await request('/api/payments/token-advance/order', { method: 'POST' }, {
    propertyId: 'prop-kota-01',
    roomId: 'room-k1',
    slotId: 's3',
    tenantName: 'Aryan Test Student',
    tenantPhone: '9876543210'
  });
  assert(createOrderRes.status === 200, 'Creates ₹500 token advance order (HTTP 200)');
  assert(createOrderRes.data.success === true, 'Order reports success: true');
  assert(createOrderRes.data.amount === 50000, 'Order amount is 50,000 paise (₹500.00)');
  assert(createOrderRes.data.currency === 'INR', 'Currency is INR');
  assert(Boolean(createOrderRes.data.orderId), `Generated Razorpay orderId: ${createOrderRes.data.orderId}`);
  assert(Boolean(createOrderRes.data.keyId), 'Returns client public keyId');

  const testOrderId = createOrderRes.data.orderId;
  const testPaymentId = `pay_${Date.now()}_test`;

  // --- 2. Signature Verification & Lock Upgrade Tests ---
  console.log('\n--- 2. HMAC-SHA256 Signature Verification & Lock Upgrade ---');

  // Rejection of missing credentials
  const missingCredsRes = await request('/api/payments/token-advance/verify', { method: 'POST' }, {});
  assert(missingCredsRes.status === 400, 'Rejects verification with missing credentials (HTTP 400)');

  // Rejection of tampered / invalid signature
  const tamperedSigRes = await request('/api/payments/token-advance/verify', { method: 'POST' }, {
    orderId: testOrderId,
    paymentId: testPaymentId,
    signature: 'bad_tampered_signature_hack_attempt_123456789'
  });
  assert(tamperedSigRes.status === 400, 'Rejects tampered signature with HTTP 400');
  assert(tamperedSigRes.data.error === 'INVALID_PAYMENT_SIGNATURE', 'Returns INVALID_PAYMENT_SIGNATURE');

  // Generate authentic HMAC-SHA256 signature
  const validSignature = paymentService.generateTestSignature(testOrderId, testPaymentId);
  assert(Boolean(validSignature), 'Generated valid HMAC-SHA256 test signature');

  // Verify authentic payment
  const verifyRes = await request('/api/payments/token-advance/verify', { method: 'POST' }, {
    orderId: testOrderId,
    paymentId: testPaymentId,
    signature: validSignature
  });
  assert(verifyRes.status === 200, 'Verifies authentic payment signature (HTTP 200)');
  assert(verifyRes.data.success === true, 'Verification reports success: true');
  assert(Boolean(verifyRes.data.data.receiptNumber), `Generated receipt number: ${verifyRes.data.data.receiptNumber}`);
  assert(verifyRes.data.data.holdDuration === '24 Hours', 'Upgraded hold duration confirms 24 Hours');

  // Verify that bed lock in bedLockService is now upgraded to token_confirmed
  const lockStatusRes = await request('/api/properties/prop-kota-01/rooms/room-k1/slots/s3/lock-status');
  assert(lockStatusRes.status === 200, 'GET /lock-status responds with 200 OK');
  assert(lockStatusRes.data.isLocked === true, 'Bed slot s3 is locked');
  assert(lockStatusRes.data.remainingSeconds > 23 * 3600, `Lock remaining seconds extends to 24 hours (got: ${lockStatusRes.data.remainingSeconds}s)`);

  // Verify idempotent reprocessing
  const reVerifyRes = await request('/api/payments/token-advance/verify', { method: 'POST' }, {
    orderId: testOrderId,
    paymentId: testPaymentId,
    signature: validSignature
  });
  assert(reVerifyRes.status === 200, 'Idempotent re-verification responds with 200 OK');
  assert(reVerifyRes.data.alreadyProcessed === true, 'Flags transaction as already processed');

  // --- 3. Digital Receipt Generation Tests ---
  console.log('\n--- 3. Digital Receipt Retrieval ---');
  const receiptRes = await request(`/api/payments/receipt/${testPaymentId}`);
  assert(receiptRes.status === 200, 'GET /api/payments/receipt/:paymentId returns 200 OK');
  assert(receiptRes.data.data.amount === '500.00', 'Receipt reports amount ₹500.00');
  assert(receiptRes.data.data.gstAmount === '0.00', 'Receipt reports ₹0.00 GST (exempt advance)');
  assert(Boolean(receiptRes.data.data.propertyTitle), 'Receipt includes property title');
  assert(Boolean(receiptRes.data.data.slotLabel), 'Receipt includes bed slot label');
  assert(Boolean(receiptRes.data.data.termsAndConditions), 'Receipt contains refund policy terms');

  const invalidReceiptRes = await request('/api/payments/receipt/invalid-pay-id');
  assert(invalidReceiptRes.status === 404, 'Returns 404 for non-existent receipt');

  // --- 4. Cancellation & Automated Refund Policy Tests ---
  console.log('\n--- 4. Automated Refund Policy & Escrow Release ---');

  // Policy breach: Cancellation within 6 hours of visit time (< 6h)
  const breachRefundRes = await request('/api/payments/token-advance/refund', { method: 'POST' }, {
    paymentId: testPaymentId,
    reason: 'Too late to cancel',
    hoursBeforeVisit: 3 // Only 3 hours left (< 6h)
  });
  assert(breachRefundRes.status === 400, 'Rejects refund requested within 6 hours of visit (HTTP 400)');
  assert(breachRefundRes.data.error === 'CANCELLATION_WINDOW_EXPIRED', 'Returns CANCELLATION_WINDOW_EXPIRED error');

  // Valid refund: Cancelled at least 6 hours in advance (e.g. 14 hours)
  const validRefundRes = await request('/api/payments/token-advance/refund', { method: 'POST' }, {
    paymentId: testPaymentId,
    reason: 'Student plans changed',
    hoursBeforeVisit: 14 // 14 hours before visit (> 6h)
  });
  assert(validRefundRes.status === 200, 'Processes refund when cancelled > 6 hours in advance (HTTP 200)');
  assert(validRefundRes.data.success === true, 'Refund indicates success: true');
  assert(Boolean(validRefundRes.data.data.refundId), `Generated refundId: ${validRefundRes.data.data.refundId}`);
  assert(validRefundRes.data.data.status === 'processed', 'Refund status is processed');

  // Verify that the bed lock was automatically released back to available upon refund
  const releasedLockRes = await request('/api/properties/prop-kota-01/rooms/room-k1/slots/s3/lock-status');
  assert(releasedLockRes.data.isLocked === false, 'Bed slot lock is automatically released upon refund');

  // --- 5. Webhook Listener Tests ---
  console.log('\n--- 5. Webhook Receiver ---');
  const webhookRes = await request('/api/payments/webhook', { method: 'POST' }, {
    event: 'payment.captured',
    payload: { payment: { id: testPaymentId } }
  });
  assert(webhookRes.status === 200, 'Webhook receiver returns 200 OK');
  assert(webhookRes.data.status === 'received', 'Webhook confirms event reception');

  // --- Summary ---
  console.log(`\n📊 Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('💳 All Slice P8 Razorpay Token Advance & Refund tests passed successfully!\n');
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
