const Profile = require('../models/Profile');
const calculateBMI = require('../utils/calculateBMI');
const syncProfileWeight = require('../utils/syncProfileWeight');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

const editableFields = [
  'age',
  'gender',
  'height',
  'activityLevel',
  'fitnessGoal',
  'budgetPreference',
  'trainingExperience',
  'equipmentAccess',
  'dietaryPreference',
  'foodAllergies',
  'movementLimitations',
];

const createProfile = asyncHandler(async (req, res) => {
  const existing = await Profile.findOne({ userId: req.user._id });
  if (existing) {
    return error(res, 409, 'Profile already exists. Use update instead.');
  }

  const {
    age,
    gender,
    height,
    weight,
    activityLevel,
    fitnessGoal,
    budgetPreference,
    trainingExperience,
    equipmentAccess,
    dietaryPreference,
    foodAllergies,
    movementLimitations,
  } = req.body;

  const { bmi, category } = calculateBMI(weight, height);

  const profile = await Profile.create({
    userId: req.user._id,
    age,
    gender,
    height,
    startingWeight: weight,
    weight,
    activityLevel,
    fitnessGoal,
    budgetPreference,
    trainingExperience,
    equipmentAccess,
    dietaryPreference,
    foodAllergies,
    movementLimitations,
    bmi,
    bmiCategory: category,
  });

  return success(res, 201, 'Profile created', { profile });
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = await syncProfileWeight(req.user._id);
  if (!profile) {
    return error(res, 404, 'Profile not found. Please create one first.');
  }
  return success(res, 200, 'Profile fetched', { profile });
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = await syncProfileWeight(req.user._id);
  if (!profile) {
    return error(res, 404, 'Profile not found. Please create one first.');
  }

  if (req.body.weight !== undefined && Number(req.body.weight) !== Number(profile.weight)) {
    return error(res, 400, 'Update current weight from Progress Tracking to keep your data consistent');
  }

  editableFields.forEach((field) => {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  });

  if (!profile.startingWeight) profile.startingWeight = profile.weight;

  const { bmi, category } = calculateBMI(profile.weight, profile.height);
  profile.bmi = bmi;
  profile.bmiCategory = category;

  await profile.save();
  return success(res, 200, 'Profile updated', { profile });
});

module.exports = { createProfile, getProfile, updateProfile };