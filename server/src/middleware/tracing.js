/**
 * GharDekho Request Tracing & Correlation ID Middleware
 * Production Slice P6
 */

const crypto = require('crypto');

/**
 * Tracing middleware that assigns or preserves X-Request-ID
 * and measures HTTP response latency.
 */
function requestTracing(req, res, next) {
  // Use incoming X-Request-ID or generate new UUID
  const incomingId = req.headers['x-request-id'];
  const requestId = incomingId && typeof incomingId === 'string' && incomingId.trim()
    ? incomingId.trim()
    : crypto.randomUUID();

  req.id = requestId;
  req.requestId = requestId;

  // Echo X-Request-ID header back to client
  res.setHeader('X-Request-ID', requestId);

  // High-resolution start time
  const startTime = process.hrtime();

  // Intercept res.end to safely set X-Response-Time before headers are flushed
  const originalEnd = res.end;
  res.end = function (...args) {
    if (!res.headersSent) {
      const diff = process.hrtime(startTime);
      const timeMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
      res.setHeader('X-Response-Time', `${timeMs}ms`);
    }
    return originalEnd.apply(this, args);
  };

  next();
}

module.exports = requestTracing;
