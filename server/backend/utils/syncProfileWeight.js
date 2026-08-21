const Profile = require('../models/Profile');
const Progress = require('../models/Progress');
const calculateBMI = require('./calculateBMI');

async function syncProfileWeight(userId) {
  const profile = await Profile.findOne({ userId });
  if (!profile) return null;

  const latestRecord = await Progress.findOne({ userId }).sort({ date: -1, createdAt: -1, _id: -1 });
  const startingWeight = profile.startingWeight || profile.weight;
  const currentWeight = latestRecord?.weight || startingWeight;
  const { bmi, category } = calculateBMI(currentWeight, profile.height);

  const needsSave =
    !profile.startingWeight ||
    Number(profile.weight) !== Number(currentWeight) ||
    Number(profile.bmi) !== Number(bmi) ||
    profile.bmiCategory !== category;

  if (needsSave) {
    const derivedFields = {
      startingWeight,
      weight: currentWeight,
      bmi,
      bmiCategory: category,
    };

    // Existing Week 8 profiles may contain values that are no longer valid under
    // the stricter Week 9 schema (for example an age below 18). Synchronizing
    // weight/BMI should not make those legacy profiles impossible to open and fix.
    // Only these trusted derived fields are written here; a normal profile update
    // still runs the full Mongoose validation rules.
    await Profile.updateOne({ _id: profile._id }, { $set: derivedFields });
    profile.set(derivedFields);
  }

  return profile;
}

module.exports = syncProfileWeight;