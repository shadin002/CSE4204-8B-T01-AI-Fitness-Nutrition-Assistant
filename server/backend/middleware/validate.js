const { validationResult } = require('express-validator');
const { error } = require('../utils/apiResponse');

const validate = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const firstError = result.array()[0];
    return error(res, 400, firstError.msg);
  }
  
  next();
};

module.exports = validate;
