// ======================================================
// 🚫 JOBFAST NOT FOUND MIDDLEWARE (ULTRA PRO FINAL)
// src/middlewares/notFound.js
// ======================================================

import { HTTP_STATUS, ERROR_CODES } from "../config/constants.js";

// ======================================================
// 🚫 HANDLE 404 ROUTES
// ======================================================

const notFound = (req, res) => {
  const { method, originalUrl } = req;

  const fullPath = `${method} ${originalUrl}`;

  return res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${fullPath}`,
    error: {
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    },
    meta: {
      method,
      path: originalUrl,
      timestamp: new Date().toISOString(),
    },
  });
};

export default notFound;