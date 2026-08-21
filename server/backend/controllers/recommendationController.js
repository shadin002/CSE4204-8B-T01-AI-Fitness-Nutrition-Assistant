const crypto = require('crypto');
const Profile = require('../models/Profile');
const Progress = require('../models/Progress');
const Recommendation = require('../models/Recommendation');
const geminiService = require('../services/geminiService');
const asyncHandler = require('../utils/asyncHandler');
const { success, error } = require('../utils/apiResponse');

const hashInput = (value) =>
  crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');

async function requireProfile(req, res) {
  const profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) {
    error(res, 400, 'Please complete your fitness profile first');
    return null;
  }
  return profile;
}

function workoutInput(profile) {
  return {
    promptVersion: 2,
    age: profile.age,
    gender: profile.gender,
    height: profile.height,
    weight: profile.weight,
    bmi: profile.bmi,
    bmiCategory: profile.bmiCategory,
    activityLevel: profile.activityLevel,
    fitnessGoal: profile.fitnessGoal,
    trainingExperience: profile.trainingExperience,
    equipmentAccess: profile.equipmentAccess,
    movementLimitations: profile.movementLimitations || '',
  };
}

function nutritionInput(profile) {
  return {
    promptVersion: 2,
    age: profile.age,
    gender: profile.gender,
    weight: profile.weight,
    bmi: profile.bmi,
    bmiCategory: profile.bmiCategory,
    fitnessGoal: profile.fitnessGoal,
    budgetPreference: profile.budgetPreference,
    dietaryPreference: profile.dietaryPreference,
    foodAllergies: profile.foodAllergies || '',
  };
}

async function loadProgressHistory(userId) {
  const newestFirst = await Progress.find({ userId })
    .sort({ date: -1, createdAt: -1, _id: -1 })
    .limit(30)
    .lean();

  return newestFirst.reverse();
}

function progressInput(profile, history) {
  return {
    promptVersion: 2,
    fitnessGoal: profile.fitnessGoal,
    bmi: profile.bmi,
    currentWeight: profile.weight,
    history: history.map((item) => ({
      date: new Date(item.date).toISOString().slice(0, 10),
      weight: item.weight,
      note: item.note || '',
    })),
  };
}

async function generateOrReuse({ req, type, inputData, generate }) {
  const inputHash = hashInput(inputData);
  const force = String(req.query.force || '').toLowerCase() === 'true';

  if (!force) {
    const cached = await Recommendation.findOne({
      userId: req.user._id,
      type,
      inputHash
    }).sort({ createdAt: -1 });

    if (cached) return { recommendation: cached, cached: true };
  }

  const aiResponse = await generate();
  const recommendation = await Recommendation.create({
    userId: req.user._id,
    type,
    inputHash,
    inputData,
    aiResponse,
  });

  return { recommendation, cached: false };
}

const generateWorkout = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;

  const inputData = workoutInput(profile);
  const result = await generateOrReuse({
    req,
    type: 'workout',
    inputData,
    generate: () => geminiService.generateWorkoutRecommendation(profile),
  });

  return success(
    res,
    result.cached ? 200 : 201,
    result.cached ? 'Current workout recommendation reused' : 'Workout recommendation generated',
    result
  );
});

const generateNutrition = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;

  const inputData = nutritionInput(profile);
  const result = await generateOrReuse({
    req,
    type: 'nutrition',
    inputData,
    generate: () => geminiService.generateNutritionRecommendation(profile),
  });

  return success(
    res,
    result.cached ? 200 : 201,
    result.cached ? 'Current nutrition recommendation reused' : 'Nutrition recommendation generated',
    result
  );
});

const generateProgressFeedback = asyncHandler(async (req, res) => {
  const profile = await requireProfile(req, res);
  if (!profile) return;

  const history = await loadProgressHistory(req.user._id);
  if (history.length === 0) {
    return error(res, 400, 'Add at least one progress record before requesting feedback');
  }

  const inputData = progressInput(profile, history);
  const result = await generateOrReuse({
    req,
    type: 'progress',
    inputData,
    generate: () => geminiService.generateProgressFeedback(profile, history),
  });

  return success(
    res,
    result.cached ? 200 : 201,
    result.cached ? 'Current progress feedback reused' : 'Progress feedback generated',
    result
  );
});

async function getCurrentInputHash(userId, type) {
  const profile = await Profile.findOne({ userId });
  if (!profile) return null;

  if (type === 'workout') return hashInput(workoutInput(profile));
  if (type === 'nutrition') return hashInput(nutritionInput(profile));
  if (type === 'progress') {
    const history = await loadProgressHistory(userId);
    if (!history.length) return null;
    return hashInput(progressInput(profile, history));
  }

  return null;
}

const getRecommendations = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.type) filter.type = req.query.type;

  const latestOnly = String(req.query.latest || '').toLowerCase() === 'true';
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = latestOnly ? 1 : Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const skip = latestOnly ? 0 : (page - 1) * limit;

  const [documents, total] = await Promise.all([
    Recommendation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Recommendation.countDocuments(filter),
  ]);

  const currentHash = req.query.type
    ? await getCurrentInputHash(req.user._id, req.query.type)
    : null;

  const recommendations = documents.map((item) => ({
    ...item,
    isStale: Boolean(currentHash && item.inputHash !== currentHash),
  }));

  return success(res, 200, 'Recommendations fetched', {
    count: total,
    recommendations,
    pagination: { page, limit, pages: Math.max(Math.ceil(total / limit), 1) },
  });
});

module.exports = {
  generateWorkout,
  generateNutrition,
  generateProgressFeedback,
  getRecommendations,
};
