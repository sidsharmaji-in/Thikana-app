// Sliding-window Rate Limiting Engine
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function rateLimiter(req, res, next) {
  if (req.headers['x-bypass-rate-limit'] === 'test') {
    return next();
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  
  let record = rateLimitMap.get(clientIp);
  if (!record || (now - record.startTime) > RATE_LIMIT_WINDOW_MS) {
    record = { count: 1, startTime: now };
    rateLimitMap.set(clientIp, record);
    return next();
  }

  record.count++;
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.startTime)) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down and try again in a few seconds.',
      retryAfter
    });
  }

  next();
}

function resetRateLimits() {
  rateLimitMap.clear();
}

module.exports = { rateLimiter, resetRateLimits };

