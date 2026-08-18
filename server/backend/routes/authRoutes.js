const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe,
  updateAccount,
  changePassword,
  forgotPassword,
  resetPassword,
  logoutUser,
  deleteAccount,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const passwordRule = body('password')
  .isLength({ min: 8, max: 128 })
  .withMessage('Password must be 8-128 characters');

const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password recovery attempts. Please try again later.' },
});

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    passwordRule,
  ],
  validate,
  registerUser
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  loginUser
);

router.post(
  '/forgot-password',
  recoveryLimiter,
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  forgotPassword
);

router.post(
  '/reset-password/:token',
  recoveryLimiter,
  [passwordRule],
  validate,
  resetPassword
);

router.get('/me', protect, getMe);
router.put(
  '/account',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
  ],
  validate,
  updateAccount
);
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8, max: 128 }).withMessage('New password must be 8-128 characters'),
  ],
  validate,
  changePassword
);
router.post('/logout', protect, logoutUser);
router.delete(
  '/account',
  protect,
  [body('currentPassword').notEmpty().withMessage('Current password is required')],
  validate,
  deleteAccount
);

module.exports = router;
