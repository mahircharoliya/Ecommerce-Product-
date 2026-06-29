/**
 * server/middleware/errorHandler.js
 * -----------------------------------
 * Centralized error handler — catches anything thrown in routes
 * and returns a consistent JSON error response.
 */

function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message);

  const status  = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    success: false,
    error  : message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = errorHandler;
