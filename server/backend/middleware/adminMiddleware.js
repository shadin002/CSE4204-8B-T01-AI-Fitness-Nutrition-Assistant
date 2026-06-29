const { error } = require('../utils/apiResponse');

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return error(res, 403, 'Access denied, admin privileges required');
};

module.exports = { admin };
