// ======================================================
// 🛡️ JOBFAST — AUTHENTICATION MIDDLEWARE (MVP STANDARD)
// ======================================================

import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  // Rekipere token an nan tèt requete a (Headers)
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.',
      code: 'UNAUTHORIZED'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifikasyon token an ak kle sekrè a (sèvi ak tèm par défaut si kle a pa nan .env)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'JOBFAST_SUPER_SECRET_KEY_2026');
    
    // Mete done itilizatè a nan requete a pou controllers yo ka itilize li
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token.',
      code: 'INVALID_TOKEN'
    });
  }
};
