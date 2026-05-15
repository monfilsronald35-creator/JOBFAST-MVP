
// ================= LOG ERROR =================
function logError(err) {
  console.error('==============================');
  console.error('❌ ERROR:', err.name || 'Error');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('Code:', err.code || 'N/A');
  console.error('==============================');
}

// ================= ERROR MIDDLEWARE =================
export function errorHandler(err, req, res, next) {
  logError(err);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // ================= MONGOOSE ERRORS =================
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors || {})
      .map(e => e.message)
      .join(', ');
  }

  // ================= JWT ERRORS =================
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // ================= DUPLICATE KEY =================
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for ${field}`;
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
}

// ================= 404 HANDLER =================
export function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
}