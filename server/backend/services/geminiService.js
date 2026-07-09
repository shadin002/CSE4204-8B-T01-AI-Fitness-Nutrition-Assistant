const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

async function generateJSON(prompt) {
  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json', 
    },
  });

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch (e) {
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  }
}

function buildWorkoutPrompt(profile) {
  return `
You are a certified beginner-friendly fitness coach for a budget-conscious app.
Generate a safe, personalized workout plan.

USER PROFILE:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Height: ${profile.height} cm
- Weight: ${profile.weight} kg
- BMI: ${profile.bmi} (${profile.bmiCategory})
- Activity Level: ${profile.activityLevel}
- Fitness Goal: ${profile.fitnessGoal}

RULES:
- Beginner-friendly, home or low-cost gym focused.
- Never give medical/dangerous advice.
- Keep it realistic for the user's activity level.

Respond ONLY with valid JSON in this exact shape:
{
  "workoutPlan": [
    { "day": "Day 1", "focus": "string", "exercises": ["string", "string"] }
  ],
  "weeklyFrequency": "string",
  "safetyNote": "string",
  "motivation": "string"
}
`.trim();
}

function buildNutritionPrompt(profile) {
  return `
You are a budget-friendly nutrition assistant. Suggest practical, affordable
meal guidance. Focus on locally available, low-cost foods (assume South Asian /
Bangladeshi context where relevant).

USER PROFILE:
- Age: ${profile.age}
- Gender: ${profile.gender}
- BMI: ${profile.bmi} (${profile.bmiCategory})
- Fitness Goal: ${profile.fitnessGoal}
- Budget Preference: ${profile.budgetPreference}

RULES:
- Budget-friendly suggestions, not strict medical diets.
- Mention this is general guidance, not a substitute for a dietitian.

Respond ONLY with valid JSON in this exact shape:
{
  "dietPlan": [
    { "meal": "Breakfast", "suggestions": ["string", "string"] },
    { "meal": "Lunch", "suggestions": ["string", "string"] },
    { "meal": "Dinner", "suggestions": ["string", "string"] },
    { "meal": "Snacks", "suggestions": ["string"] }
  ],
  "budgetExplanation": "string",
  "safetyNote": "string",
  "motivation": "string"
}
`.trim();
}

function buildProgressPrompt(profile, progressHistory) {
  const historyText = progressHistory
    .map(
      (p, i) =>
        `${i + 1}. ${new Date(p.date).toISOString().split('T')[0]} - ${p.weight} kg${
          p.note ? ` (note: ${p.note})` : ''
        }`
    )
    .join('\n');

  return `
You are a supportive fitness progress analyst.

USER PROFILE:
- Goal: ${profile.fitnessGoal}
- Current BMI: ${profile.bmi} (${profile.bmiCategory})

WEIGHT HISTORY (oldest to newest):
${historyText || 'No records yet.'}

RULES:
- Analyze the trend relative to the user's goal.
- Be encouraging and realistic. No medical claims.

Respond ONLY with valid JSON in this exact shape:
{
  "analysis": "string",
  "trend": "improving | stable | needs_attention",
  "suggestedAdjustment": "string",
  "motivation": "string"
}
`.trim();
}

async function generateWorkoutRecommendation(profile) {
  return generateJSON(buildWorkoutPrompt(profile));
}

async function generateNutritionRecommendation(profile) {
  return generateJSON(buildNutritionPrompt(profile));
}

async function generateProgressFeedback(profile, progressHistory) {
  return generateJSON(buildProgressPrompt(profile, progressHistory));
}

module.exports = {
  generateWorkoutRecommendation,
  generateNutritionRecommendation,
  generateProgressFeedback,
};
