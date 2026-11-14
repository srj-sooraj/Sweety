const { ApiError } = require('../utils/apiError');

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    const payload = {
      success: false,
      message: err.message,
    };
    if (err.errors) {
      payload.errors = err.errors;
    }
    return res.status(err.statusCode).json(payload);
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON request body.',
    });
  }

  if (err && err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with the same unique details already exists.',
    });
  }

  if (err && err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Requested record was not found.',
    });
  }

  console.error('Unhandled error:', err.message);
  return res.status(500).json({
    success: false,
    message: 'An unexpected internal server error occurred.',
  });
}

module.exports = { notFoundHandler, errorHandler };
