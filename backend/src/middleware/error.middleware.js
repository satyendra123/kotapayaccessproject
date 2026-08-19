/**
 * Central error handler - mirrors FastAPI's default HTTPException JSON shape
 * ({ "detail": "..." }) so the existing frontend's error handling keeps working.
 */
function errorMiddleware(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const detail = err.detail || err.message || "Internal Server Error";

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ detail: status >= 500 ? "Internal Server Error" : detail });
}

class HttpError extends Error {
  constructor(status, detail) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

module.exports = errorMiddleware;
module.exports.HttpError = HttpError;
