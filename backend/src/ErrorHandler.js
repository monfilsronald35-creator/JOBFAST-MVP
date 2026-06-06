function logError(err) {
  console.error('==============================');
  console.error('❌ ERROR OCCURRED');
  console.error('Name:', err.name);
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
  console.error('Code:', err.code || 'N/A');
  console.error('==============================');
}

export function errorHandler(err, req, res, next) {
  logError(err);

  let statusCode = Number(err.statusCode);
  if (!statusCode || statusCode < 100 || statusCode > 599) {
    statusCode = 500;
  }

  let message = err.message || 'Internal Server Error';

  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.errors
      ? Object.values(err.errors).map(e => e.message).join(', ')
      : 'Validation error';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  if (err.name === 'NotBeforeError') {
    statusCode = 401;
    message = 'Token not active yet';
  }

  if (err.name === 'MongoServerError') {
    statusCode = 500;
    message = 'Database error';
  }

  if (err.name === 'TypeError') {
    statusCode = 500;
    message = 'Unexpected server error';
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = `Duplicate value for ${field}`;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

export function notFoundHandler(req, res, next) {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
}
