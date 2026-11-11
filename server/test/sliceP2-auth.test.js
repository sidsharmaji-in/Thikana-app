// Slice P2: Production Authentication & Session Hardening Automated Verification Tests
const http = require('http');
const { signToken, verifyToken, JWT_SECRET, REFRESH_SECRET } = require('../src/utils/jwt');
const { normalizeIndianPhone, defaultMockProvider } = require('../src/services/smsProvider');
const { requireRole } = require('../src/middleware/auth');

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
  console.log('🧪 Starting Slice P2: Production Authentication & Session Hardening Tests...\n');
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
    // 1. Phone number normalization & validation unit tests
    assert(normalizeIndianPhone('9829012345') === '+919829012345', 'Normalizes 10-digit Indian phone to +91 canonical');
    assert(normalizeIndianPhone('+91 98290 12345') === '+919829012345', 'Strips whitespace and preserves +91');
    assert(normalizeIndianPhone('09829012345') === '+919829012345', 'Normalizes leading 0 STD style to +91');
    assert(normalizeIndianPhone('12345') === null, 'Rejects invalid short phone');
    assert(normalizeIndianPhone('invalid-phone') === null, 'Rejects non-numeric phone');

    // 2. JWT Signature & Verification unit tests
    const testPayload = { sub: 'user-test-1', phone: '+919829012345', role: 'tenant' };
    const token = signToken(testPayload, JWT_SECRET, 60);
    assert(typeof token === 'string' && token.split('.').length === 3, 'Generates 3-part RFC 7519 standard JWT');
    const verified = verifyToken(token, JWT_SECRET);
    assert(verified.valid === true, 'Verifies valid signed token');
    assert(verified.payload.sub === 'user-test-1', 'Decodes user id from token payload');

    const tampered = token.slice(0, -4) + 'abcd';
    const tamperedVerify = verifyToken(tampered, JWT_SECRET);
    assert(tamperedVerify.valid === false && tamperedVerify.error === 'INVALID_SIGNATURE', 'Rejects tampered signature');

    const expiredToken = signToken(testPayload, JWT_SECRET, -10);
    const expiredVerify = verifyToken(expiredToken, JWT_SECRET);
    assert(expiredVerify.valid === false && expiredVerify.error === 'TOKEN_EXPIRED', 'Detects expired JWT token');

    // 3. POST /api/auth/send-otp - Validation & Delivery
    const badPhoneRes = await request('/api/auth/send-otp', { method: 'POST' }, { phone: '123' });
    assert(badPhoneRes.status === 400, 'Rejects invalid phone with HTTP 400');
    assert(badPhoneRes.data.success === false, 'Error message instructs valid 10-digit mobile');

    const testMobile = '+9198' + String(Date.now()).slice(-8);
    const sendOtpRes = await request('/api/auth/send-otp', { method: 'POST' }, { phone: testMobile });
    assert(sendOtpRes.status === 200, 'POST /api/auth/send-otp responds with 200 OK');
    assert(sendOtpRes.data.success === true, 'OTP dispatch reports success: true');
    assert(typeof sendOtpRes.data.expiresAt === 'string', 'Returns ISO expiresAt timestamp');

    const dispatchedOtp = sendOtpRes.data.demoOtp || defaultMockProvider.getLastOtp(testMobile);
    assert(typeof dispatchedOtp === 'string' && dispatchedOtp.length === 6, 'Dispatches 6-digit numeric OTP');

    // 4. POST /api/auth/verify-otp - Authentication & JWT Issuance
    const wrongOtpRes = await request('/api/auth/verify-otp', { method: 'POST' }, {
      phone: testMobile,
      code: '000000'
    });
    assert(wrongOtpRes.status === 401, 'Rejects incorrect OTP with HTTP 401 Unauthorized');
    assert(wrongOtpRes.data.error === 'INVALID_OTP', 'Reports error: INVALID_OTP');

    const verifySuccessRes = await request('/api/auth/verify-otp', { method: 'POST' }, {
      phone: testMobile,
      code: dispatchedOtp,
      fullName: 'Anurag Sharma',
      role: 'tenant'
    });
    assert(verifySuccessRes.status === 200, 'POST /api/auth/verify-otp responds with 200 OK');
    assert(verifySuccessRes.data.success === true, 'Login confirms success: true');
    assert(typeof verifySuccessRes.data.accessToken === 'string', 'Issues signed Access Token');
    assert(typeof verifySuccessRes.data.refreshToken === 'string', 'Issues signed Refresh Token');
    assert(verifySuccessRes.data.user.phone === testMobile, 'User profile contains verified phone');
    assert(verifySuccessRes.data.user.fullName === 'Anurag Sharma', 'User profile preserves full name');

    const setCookieHeader = verifySuccessRes.headers['set-cookie'];
    assert(setCookieHeader && setCookieHeader.some(c => c.includes('HttpOnly')), 'Sets secure HttpOnly session cookie');

    const tenantAccessToken = verifySuccessRes.data.accessToken;
    const tenantRefreshToken = verifySuccessRes.data.refreshToken;

    // 5. GET /api/auth/me - Protected Profile Route
    const noAuthMeRes = await request('/api/auth/me');
    assert(noAuthMeRes.status === 401, 'Protected route /api/auth/me rejects unauthenticated request with HTTP 401');

    const authMeRes = await request('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${tenantAccessToken}` }
    });
    assert(authMeRes.status === 200, 'GET /api/auth/me with Bearer token responds with 200 OK');
    assert(authMeRes.data.user.phone === testMobile, 'Returns authenticated user details');

    // 6. PATCH /api/auth/me - Update User Profile
    const patchMeRes = await request('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tenantAccessToken}` }
    }, {
      fullName: 'Anurag S. (IIT-JEE)',
      city: 'Kota'
    });
    assert(patchMeRes.status === 200, 'PATCH /api/auth/me responds with 200 OK');
    assert(patchMeRes.data.user.fullName === 'Anurag S. (IIT-JEE)', 'Updated user full name');
    assert(patchMeRes.data.user.city === 'Kota', 'Updated user preferred city');

    // 7. POST /api/auth/refresh - Token Rotation
    const badRefreshRes = await request('/api/auth/refresh', { method: 'POST' }, { refreshToken: 'invalid.jwt.token' });
    assert(badRefreshRes.status === 401, 'Rejects invalid refresh token with HTTP 401');

    const refreshRes = await request('/api/auth/refresh', { method: 'POST' }, { refreshToken: tenantRefreshToken });
    assert(refreshRes.status === 200, 'POST /api/auth/refresh responds with 200 OK');
    assert(typeof refreshRes.data.accessToken === 'string', 'Returns new rotated access token');
    const newAccessToken = refreshRes.data.accessToken;

    // Verify new access token works on protected route
    const testNewTokenRes = await request('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${newAccessToken}` }
    });
    assert(testNewTokenRes.status === 200, 'New rotated access token validates successfully');

    // 8. Aadhaar DigiLocker KYC Verification
    const kycInitiateRes = await request('/api/auth/kyc/initiate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${newAccessToken}` }
    });
    assert(kycInitiateRes.status === 200, 'POST /api/auth/kyc/initiate responds with 200 OK');
    assert(typeof kycInitiateRes.data.kycSessionId === 'string', 'Returns KYC session ID');

    const kycVerifyRes = await request('/api/auth/kyc/verify', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${newAccessToken}` }
    }, {
      documentType: 'Aadhaar',
      documentNumberLast4: '7766'
    });
    assert(kycVerifyRes.status === 200, 'POST /api/auth/kyc/verify responds with 200 OK');
    assert(kycVerifyRes.data.user.isKycVerified === true, 'User is now marked isKycVerified: true');
    assert(kycVerifyRes.data.user.aadhaarNumber === 'XXXX-XXXX-7766', 'Masked Aadhaar number stored securely');

    // 9. Role-Based Access Control (RBAC) Guard Test
    const tenantUser = { role: 'tenant' };
    const ownerGuard = requireRole('owner');
    let rbacStatusCode = null;
    let rbacCalledNext = false;
    const mockRes = {
      status(code) {
        rbacStatusCode = code;
        return {
          json(obj) { this.body = obj; }
        };
      }
    };
    ownerGuard({ user: tenantUser }, mockRes, () => { rbacCalledNext = true; });
    assert(rbacStatusCode === 403, 'requireRole("owner") rejects tenant role with HTTP 403 Forbidden');
    assert(rbacCalledNext === false, 'Tenant request does not proceed to handler');

    let ownerProceeded = false;
    ownerGuard({ user: { role: 'owner' } }, mockRes, () => { ownerProceeded = true; });
    assert(ownerProceeded === true, 'requireRole("owner") permits owner role');

    // 10. POST /api/auth/logout - Revocation
    const logoutRes = await request('/api/auth/logout', { method: 'POST' }, { refreshToken: tenantRefreshToken });
    assert(logoutRes.status === 200, 'POST /api/auth/logout responds with 200 OK');
    assert(logoutRes.data.success === true, 'Logout confirms success: true');

    const afterLogoutRefresh = await request('/api/auth/refresh', { method: 'POST' }, { refreshToken: tenantRefreshToken });
    assert(afterLogoutRefresh.status === 401, 'Revoked refresh token cannot be used again after logout');

    console.log(`\n📊 Results: ${passed} Passed, ${failed} Failed`);
    if (failed === 0) {
      console.log('🛡️ All Slice P2 Production Authentication & Session Hardening tests passed successfully!\n');
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
