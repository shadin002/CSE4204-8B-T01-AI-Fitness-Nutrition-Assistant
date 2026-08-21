const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  const id = user?._id || user?.id || user;
  const version = Number(user?.tokenVersion || 0);

  return jwt.sign({ id, version }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;