
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// ================= TOKEN =================
function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  return null;
}

// ================= VERIFY =================
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

// ================= AUTH =================
export async function authMiddleware(req, res, next) {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'Server misconfigured',
      });
    }

    const token = extractToken(req);

    if (!token || typeof token !== 'string') {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
      });
    }

    const user = await User.findById(decoded.id)
      .select('-password -loginAttempts -lockUntil')
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        success: false,
        message: 'Account locked',
      });
    }

    // ================= CONTEXT ENGINE (IMPORTANT) =================
    req.user = user;
    req.context = {
      user,
      location: user.location || null,
      role: user.role,
      serviceIntent: user.serviceIntent,
    };

    next();
  } catch (error) {
    console.error('AUTH ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
}

// ================= ROLE ACCESS =================
export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden',
      });
    }

    next();
  };
}

// ================= OPTIONAL AUTH =================
export async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) return next();

    const decoded = verifyToken(token);

    if (!decoded?.id) return next();

    const user = await User.findById(decoded.id)
      .select('-password')
      .lean();

    if (user) {
      req.user = user;
      req.context = {
        user,
        location: user.location || null,
        role: user.role,
        serviceIntent: user.serviceIntent,
      };
    }

    next();
  } catch {
    next();
  }
}