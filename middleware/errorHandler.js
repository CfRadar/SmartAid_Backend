const ApiError = require("../utils/ApiError");

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err instanceof ApiError || statusCode < 500;

  const payload = {
    success: false,
    message: err.message || "Internal Server Error"
  };

  if (err.details) payload.details = err.details;
  if (process.env.NODE_ENV !== "production") payload.stack = err.stack;

  if (!isOperational) {
    // Preserve details in server logs while avoiding leaking internals in production responses.
    // eslint-disable-next-line no-console
    console.error("Unhandled error:", err);
  }

  res.status(statusCode).json(payload);
}

module.exports = {
  notFoundHandler,
  errorHandler
};
