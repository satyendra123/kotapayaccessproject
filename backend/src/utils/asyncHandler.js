/**
 * Wraps an async Express handler so rejected promises reach the error middleware
 * instead of needing a try/catch in every controller.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
