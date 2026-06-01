// ======================================
// 404 NOT FOUND
// ======================================

export const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};

// ======================================
// GLOBAL ERROR HANDLER
// ======================================

export const errorHandler = (
  err,
  req,
  res,
  next
) => {
  console.error("❌ Error:", err);

  return res.status(err.status || 500).json({
    success: false,
    message:
      err.message || "Internal Server Error",
  });
};