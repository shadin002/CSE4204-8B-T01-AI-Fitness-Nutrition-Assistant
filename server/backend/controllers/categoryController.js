const Category = require('../models/Category');
const Exercise = require('../models/Exercise');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ categoryName: 1 });
  return success(res, 200, 'Categories fetched', { count: categories.length, categories });
});

const createCategory = asyncHandler(async (req, res) => {
  const { categoryName, description } = req.body;

  const existing = await Category.findOne({ categoryName: categoryName.trim() });
  if (existing) {
    return error(res, 409, 'Category already exists');
  }

  const category = await Category.create({ categoryName, description });
  return success(res, 201, 'Category created', { category });
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return error(res, 404, 'Category not found');
  }

  if (req.body.categoryName !== undefined) category.categoryName = req.body.categoryName;
  if (req.body.description !== undefined) category.description = req.body.description;

  await category.save();
  return success(res, 200, 'Category updated', { category });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return error(res, 404, 'Category not found');
  }

  const linkedCount = await Exercise.countDocuments({ categoryId: category._id });
  if (linkedCount > 0) {
    return error(res, 400, `Cannot delete: ${linkedCount} exercise(s) use this category`);
  }

  await category.deleteOne();
  return success(res, 200, 'Category deleted', {});
});

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
