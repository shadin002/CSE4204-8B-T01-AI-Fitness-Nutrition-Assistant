const { error } = require('../utils/apiResponse');
const notFound = (req, res, next) => {
  return error(res, 404, `Route not found: ${req.originalUrl}`);
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.name === 'CastError') {
    return error(res, 400, `Invalid ${err.path}: ${err.value}`);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return error(res, 409, `${field} already exists`);
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return error(res, 400, messages.join(', '));
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Internal server error'
      : err.message;

  return error(res, statusCode, message);
};

module.exports = { notFound, errorHandler };
