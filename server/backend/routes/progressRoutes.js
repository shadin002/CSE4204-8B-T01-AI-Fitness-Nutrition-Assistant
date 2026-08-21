const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { addProgress, getProgress, updateProgress, deleteProgress } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const progressValidators = [
  body('weight').optional().isFloat({ min: 10, max: 500 }).withMessage('Valid weight (10-500 kg) required'),
  body('date').optional().isISO8601({ strict: true }).withMessage('Valid date is required'),
  body('note').optional().isLength({ max: 500 }).withMessage('Note cannot exceed 500 characters'),
];

router.use(protect);
router.post(
  '/',
  [
    body('weight').exists().withMessage('Weight is required'),
    body('date').exists().withMessage('Date is required'),
    ...progressValidators,
  ],
  validate,
  addProgress
);
router.get('/', getProgress);
router.patch('/:id', progressValidators, validate, updateProgress);
router.delete('/:id', deleteProgress);

module.exports = router;