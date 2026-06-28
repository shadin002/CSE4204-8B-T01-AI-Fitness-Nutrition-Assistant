const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { createProfile, getProfile, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const profileValidators = [
  body('age').isInt({ min: 10, max: 120 }).withMessage('Valid age (10-120) required'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('height').isFloat({ min: 50, max: 300 }).withMessage('Valid height (cm) required'),
  body('weight').isFloat({ min: 10, max: 500 }).withMessage('Valid weight (kg) required'),
  body('activityLevel').isIn(['low', 'moderate', 'high']).withMessage('Invalid activity level'),
  body('fitnessGoal')
    .isIn(['weight_loss', 'muscle_gain', 'general_fitness'])
    .withMessage('Invalid fitness goal'),
  body('budgetPreference').isIn(['low', 'medium', 'high']).withMessage('Invalid budget preference'),
];

router.use(protect);

router.post('/', profileValidators, validate, createProfile);
router.get('/', getProfile);
router.put('/', updateProfile); 

module.exports = router;
