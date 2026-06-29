const Exercise = require('../models/Exercise');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

const getExercises = asyncHandler(async (req, res) => {
  const { category, difficulty } = req.query;
  const filter = {};

  if (category) filter.categoryId = category;
  if (difficulty) filter.difficulty = difficulty;

  const exercises = await Exercise.find(filter)
    .populate('categoryId', 'categoryName')
    .sort({ createdAt: -1 });

  return success(res, 200, 'Exercises fetched', { count: exercises.length, exercises });
});

const getExerciseById = asyncHandler(async (req, res) => {
  const exercise = await Exercise.findById(req.params.id).populate('categoryId', 'categoryName');
  if (!exercise) {
    return error(res, 404, 'Exercise not found');
  }
  return success(res, 200, 'Exercise fetched', { exercise });
});

const createExercise = asyncHandler(async (req, res) => {
  const { name, categoryId, description, targetBodyPart, difficulty, videoUrl } = req.body;

  const categoryExists = await Category.findById(categoryId);
  if (!categoryExists) {
    return error(res, 400, 'Invalid categoryId, category does not exist');
  }

  const exercise = await Exercise.create({
    name,
    categoryId,
    description,
    targetBodyPart,
    difficulty,
    videoUrl,
  });

  return success(res, 201, 'Exercise created', { exercise });
});

const updateExercise = asyncHandler(async (req, res) => {
  const exercise = await Exercise.findById(req.params.id);
  if (!exercise) {
    return error(res, 404, 'Exercise not found');
  }

  if (req.body.categoryId && req.body.categoryId !== exercise.categoryId.toString()) {
    const categoryExists = await Category.findById(req.body.categoryId);
    if (!categoryExists) {
      return error(res, 400, 'Invalid categoryId, category does not exist');
    }
  }

  const fields = ['name', 'categoryId', 'description', 'targetBodyPart', 'difficulty', 'videoUrl'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) exercise[field] = req.body[field];
  });

  await exercise.save();
  return success(res, 200, 'Exercise updated', { exercise });
});

const deleteExercise = asyncHandler(async (req, res) => {
  const exercise = await Exercise.findById(req.params.id);
  if (!exercise) {
    return error(res, 404, 'Exercise not found');
  }
  await exercise.deleteOne();
  return success(res, 200, 'Exercise deleted', {});
});

module.exports = {
  getExercises,
  getExerciseById,
  createExercise,
  updateExercise,
  deleteExercise,
};
