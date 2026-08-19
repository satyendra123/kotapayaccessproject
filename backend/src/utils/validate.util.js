const { HttpError } = require("../middleware/error.middleware");

/**
 * Returns Express middleware that validates req.body against a Joi schema,
 * replacing req.body with the validated/coerced value. Mirrors FastAPI's
 * automatic Pydantic request-body validation (422-ish -> here 400 for simplicity).
 */
function validateBody(schema) {
  return function (req, res, next) {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: false });
    if (error) {
      return next(new HttpError(400, error.details.map((d) => d.message).join("; ")));
    }
    req.body = value;
    next();
  };
}

module.exports = { validateBody };
