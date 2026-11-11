// Role-Based Access Control (RBAC) & JWT Authentication Middleware (Slice P2)

const { verifyToken } = require('../utils/jwt');
const repository = require('../data/repository');

function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  
  if (req.headers['x-access-token']) {
    return req.headers['x-access-token'].trim();
  }

  // Cookie fallback
  if (req.headers['cookie']) {
    const match = req.headers['cookie'].match(/ghar_access_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please provide a valid Bearer token.'
    });
  }

  const verification = verifyToken(token);
  if (!verification.valid) {
    const message = verification.error === 'TOKEN_EXPIRED'
      ? 'Access token has expired. Please refresh your session.'
      : 'Invalid authentication token.';
    return res.status(401).json({
      success: false,
      error: verification.error,
      message
    });
  }

  const user = repository.findUserById(verification.payload.sub);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'User belonging to this token no longer exists.'
    });
  }

  req.user = user;
  next();
}

function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    const verification = verifyToken(token);
    if (verification.valid) {
      req.user = repository.findUserById(verification.payload.sub);
    }
  }
  next();
}

function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before role verification.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role "${req.user.role}" is not authorized for this resource. Required: ${roles.join(' or ')}.`
      });
    }

    next();
  };
}

module.exports = {
  extractToken,
  requireAuth,
  optionalAuth,
  requireRole
};

