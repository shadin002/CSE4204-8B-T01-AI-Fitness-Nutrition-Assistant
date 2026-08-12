const { error } = require('../utils/apiResponse');
const notFound = (req, res, next) => {
  return error(res, 404, `Route not found: ${req.originalUrl}`);
};

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);

  const aiErrorResponses = {
    AI_TIMEOUT: {
      statusCode: 504,
      message: 'AI service took too long to respond. Please try again.',
    },
    AI_EMPTY_RESPONSE: {
      statusCode: 502,
      message: 'AI returned an empty response. Please try again.',
    },
    AI_INVALID_JSON: {
      statusCode: 502,
      message: 'AI returned an invalid response format. Please generate again.',
    },
    AI_INVALID_RESPONSE: {
      statusCode: 502,
      message: 'AI returned an incomplete response. Please generate again.',
    },
    AI_RATE_LIMIT: {
      statusCode: 429,
      message: 'AI service rate limit reached. Please try again later.',
    },
    AI_NETWORK_ERROR: {
      statusCode: 503,
      message: 'AI service is temporarily unreachable. Please try again.',
    },
    AI_SERVICE_ERROR: {
      statusCode: 503,
      message: 'AI service is temporarily unavailable. Please try again.',
    },
    AI_CONFIG_ERROR: {
      statusCode: 503,
      message: 'AI service is not configured correctly. Please try again later.',
    },
  };

  if (aiErrorResponses[err.code]) {
    const aiError = aiErrorResponses[err.code];
    return error(res, aiError.statusCode, aiError.message);
  }

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
