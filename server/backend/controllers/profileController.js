const Profile = require('../models/Profile');
const calculateBMI = require('../utils/calculateBMI');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

const createProfile = asyncHandler(async (req, res) => {
  const { age, gender, height, weight, activityLevel, fitnessGoal, budgetPreference } = req.body;

  const existing = await Profile.findOne({ userId: req.user._id });
  if (existing) {
    return error(res, 409, 'Profile already exists. Use update instead.');
  }

  const { bmi, category } = calculateBMI(weight, height);

  const profile = await Profile.create({
    userId: req.user._id,
    age,
    gender,
    height,
    weight,
    activityLevel,
    fitnessGoal,
    budgetPreference,
    bmi,
    bmiCategory: category,
  });

  return success(res, 201, 'Profile created', { profile });
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) {
    return error(res, 404, 'Profile not found. Please create one first.');
  }
  return success(res, 200, 'Profile fetched', { profile });
});

const updateProfile = asyncHandler(async (req, res) => {
  let profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) {
    return error(res, 404, 'Profile not found. Please create one first.');
  }

  const fields = ['age', 'gender', 'height', 'weight', 'activityLevel', 'fitnessGoal', 'budgetPreference'];
  fields.forEach((field) => {
    if (req.body[field] !== undefined) {
      profile[field] = req.body[field];
    }
  });

  const { bmi, category } = calculateBMI(profile.weight, profile.height);
  profile.bmi = bmi;
  profile.bmiCategory = category;

  await profile.save();

  return success(res, 200, 'Profile updated', { profile });
});

module.exports = { createProfile, getProfile, updateProfile };
