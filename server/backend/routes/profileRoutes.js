const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { createProfile, getProfile, updateProfile } = require('../controllers/profileController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const commonValidators = [
  body('age').optional().isInt({ min: 18, max: 120 }).withMessage('Valid adult age (18-120) required'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  body('height').optional().isFloat({ min: 50, max: 300 }).withMessage('Valid height (cm) required'),
  body('weight').optional().isFloat({ min: 10, max: 500 }).withMessage('Valid weight (kg) required'),
  body('activityLevel').optional().isIn(['low', 'moderate', 'high']).withMessage('Invalid activity level'),
  body('fitnessGoal')
    .optional()
    .isIn(['weight_loss', 'muscle_gain', 'general_fitness'])
    .withMessage('Invalid fitness goal'),
  body('budgetPreference').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid budget preference'),
  body('trainingExperience')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Invalid training experience'),
  body('equipmentAccess')
    .optional()
    .isIn(['bodyweight', 'home_basic', 'gym'])
    .withMessage('Invalid equipment access'),
  body('dietaryPreference')
    .optional()
    .isIn(['no_preference', 'vegetarian', 'vegan', 'halal', 'other'])
    .withMessage('Invalid dietary preference'),
  body('foodAllergies').optional().isLength({ max: 300 }).withMessage('Food allergies text is too long'),
  body('movementLimitations').optional().isLength({ max: 300 }).withMessage('Movement limitations text is too long'),
];

const createValidators = [
  body('age').exists().withMessage('Age is required'),
  body('gender').exists().withMessage('Gender is required'),
  body('height').exists().withMessage('Height is required'),
  body('weight').exists().withMessage('Weight is required'),
  body('activityLevel').exists().withMessage('Activity level is required'),
  body('fitnessGoal').exists().withMessage('Fitness goal is required'),
  body('budgetPreference').exists().withMessage('Budget preference is required'),
  ...commonValidators,
];

router.use(protect);
router.post('/', createValidators, validate, createProfile);
router.get('/', getProfile);
router.put('/', commonValidators, validate, updateProfile);

module.exports = router;