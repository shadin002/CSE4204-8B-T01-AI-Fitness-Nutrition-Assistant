const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { error } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return error(res, 401, 'Not authorized, no token provided');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('+tokenVersion');

    if (!user) {
      return error(res, 401, 'Not authorized, user no longer exists');
    }

    if (Number(decoded.version || 0) !== Number(user.tokenVersion || 0)) {
      return error(res, 401, 'Session is no longer valid. Please log in again.');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 401, 'Session expired, please log in again');
    }
    return error(res, 401, 'Not authorized, token failed');
  }
};

module.exports = { protect };
