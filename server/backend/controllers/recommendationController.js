const Profile = require('../models/Profile');
const Progress = require('../models/Progress');
const Recommendation = require('../models/Recommendation');
const geminiService = require('../services/geminiService');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

async function requireProfile(req, res) {
  const profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) {
    error(res, 400, 'Please complete your fitness profile first');
    return null;
  }
  return profile;
}

const generateWorkout = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;

  const aiResponse = await geminiService.generateWorkoutRecommendation(profile);

  const recommendation = await Recommendation.create({
    userId: req.user._id,
    type: 'workout',
    inputData: {
      age: profile.age,
      gender: profile.gender,
      bmi: profile.bmi,
      activityLevel: profile.activityLevel,
      fitnessGoal: profile.fitnessGoal,
    },
    aiResponse,
  });

  return success(res, 201, 'Workout recommendation generated', { recommendation });
});

const generateNutrition = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;

  const aiResponse = await geminiService.generateNutritionRecommendation(profile);

  const recommendation = await Recommendation.create({
    userId: req.user._id,
    type: 'nutrition',
    inputData: {
      bmi: profile.bmi,
      fitnessGoal: profile.fitnessGoal,
      budgetPreference: profile.budgetPreference,
    },
    aiResponse,
  });

  return success(res, 201, 'Nutrition recommendation generated', { recommendation });
});

const generateProgressFeedback = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;

  const history = await Progress.find({ userId: req.user._id }).sort({ date: 1 });
  if (history.length === 0) {
    return error(res, 400, 'Add at least one progress record before requesting feedback');
  }

  const aiResponse = await geminiService.generateProgressFeedback(profile, history);

  const recommendation = await Recommendation.create({
    userId: req.user._id,
    type: 'progress',
    inputData: {
      goal: profile.fitnessGoal,
      bmi: profile.bmi,
      recordCount: history.length,
    },
    aiResponse,
  });

  return success(res, 201, 'Progress feedback generated', { recommendation });
});

const getRecommendations = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.type) filter.type = req.query.type;

  const recommendations = await Recommendation.find(filter).sort({ createdAt: -1 });

  return success(res, 200, 'Recommendations fetched', {
    count: recommendations.length,
    recommendations,
  });
});

module.exports = {
  generateWorkout,
  generateNutrition,
  generateProgressFeedback,
  getRecommendations,
};
