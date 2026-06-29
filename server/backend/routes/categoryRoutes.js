const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const validate = require('../middleware/validate');

router.get('/', getCategories);

router.post(
  '/',
  protect,
  admin,
  [body('categoryName').trim().notEmpty().withMessage('Category name is required')],
  validate,
  createCategory
);

router.put('/:id', protect, admin, updateCategory);
router.delete('/:id', protect, admin, deleteCategory);

module.exports = router;
