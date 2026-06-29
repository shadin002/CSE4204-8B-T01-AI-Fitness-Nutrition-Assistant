const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { addProgress, getProgress, deleteProgress } = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

router.use(protect);

router.post(
  '/',
  [body('weight').isFloat({ min: 10, max: 500 }).withMessage('Valid weight (kg) required')],
  validate,
  addProgress
);

router.get('/', getProgress);
router.delete('/:id', deleteProgress);

module.exports = router;
