const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
} = require('../controllers/exerciseController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');

router.get('/', getExercises);
router.get('/:id', getExerciseById);

router.post(
  '/',
  protect,
  admin,
  [
    body('name').trim().notEmpty().withMessage('Exercise name is required'),
    body('categoryId').notEmpty().withMessage('Category is required'),
    body('difficulty')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Invalid difficulty'),
  ],
  validate,
  createExercise
);

router.put('/:id', protect, admin, updateExercise);
router.delete('/:id', protect, admin, deleteExercise);

module.exports = router;
