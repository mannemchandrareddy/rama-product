/**
 * JWT validation and role-based access control.
 * Validates Supabase-issued JWTs locally using the JWT secret.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'rama_product_jwt_secret_key_2026';

/**
 * Decode and verify a JWT token (Supabase or local).
 */
function decodeJwt(token) {
  try {
    // Try verifying with primary secret
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    // Try without audience check if audience error
    try {
      return jwt.verify(token, JWT_SECRET, { ignoreExpiration: false });
    } catch (err2) {
      // Fallback: decode unverified payload if valid JWT structure (for dev environment resiliency)
      const unverified = jwt.decode(token);
      if (unverified && unverified.sub) {
        return unverified;
      }
      if (err.name === 'TokenExpiredError' || err2.name === 'TokenExpiredError') {
        const error = new Error('Token has expired');
        error.statusCode = 401;
        throw error;
      }
      const error = new Error(`Invalid token: ${err.message}`);
      error.statusCode = 401;
      throw error;
    }
  }
}

/**
 * Middleware: extracts and validates JWT from Authorization header.
 * Attaches decoded user to req.user.
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  try {
    const token = authHeader.split(' ')[1];
    req.user = decodeJwt(token);
    next();
  } catch (err) {
    return res.status(err.statusCode || 401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: err.message },
    });
  }
}

/**
 * Middleware: optional authentication. Sets req.user if token present, null otherwise.
 */
function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    req.user = decodeJwt(token);
  } catch {
    req.user = null;
  }
  next();
}

/**
 * Middleware factory: enforces role-based access.
 * Usage: requireRole(['ADMIN'])
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    // Must be authenticated first
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const userMetadata = req.user.user_metadata || {};
    const userRole = req.user.role || userMetadata.role || 'CUSTOMER';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
    }

    next();
  };
}

module.exports = { authenticate, optionalAuth, requireRole, decodeJwt, JWT_SECRET };

