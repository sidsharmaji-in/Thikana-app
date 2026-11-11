// Standard RFC 7519 JSON Web Token Utility (Zero external dependencies)
// Built using Node.js native crypto module (HMAC-SHA256)

const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'ghardekho-production-jwt-secret-key-2026';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'ghardekho-production-refresh-secret-key-2026';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

function signToken(payload, secret = JWT_SECRET, expiresInSeconds = 900) { // 15 minutes default
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url');

  return `${signatureInput}.${signature}`;
}

function verifyToken(token, secret = JWT_SECRET) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'TOKEN_MISSING' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'INVALID_TOKEN_FORMAT' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signatureInput)
    .digest('base64url');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return { valid: false, error: 'INVALID_SIGNATURE' };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'TOKEN_EXPIRED', payload };
    }

    return { valid: true, payload };
  } catch (err) {
    return { valid: false, error: 'MALFORMED_PAYLOAD' };
  }
}

module.exports = {
  signToken,
  verifyToken,
  JWT_SECRET,
  REFRESH_SECRET,
  base64UrlEncode,
  base64UrlDecode
};
