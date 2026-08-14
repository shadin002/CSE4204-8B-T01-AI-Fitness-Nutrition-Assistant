const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const AI_TIMEOUT_MS = 25000;

const WORKOUT_SYSTEM_PROMPT = `
You are a certified beginner-friendly fitness coach for a budget-conscious fitness app.
Provide safe, realistic, non-medical workout guidance.
Follow the requested JSON output structure exactly and do not include Markdown.
`.trim();

const NUTRITION_SYSTEM_PROMPT = `
You are a budget-friendly nutrition assistant for a fitness app.
Provide practical, affordable, non-medical meal guidance using locally available foods.
Follow the requested JSON output structure exactly and do not include Markdown.
`.trim();

const PROGRESS_SYSTEM_PROMPT = `
You are a supportive fitness progress analyst.
Analyze progress relative to the user's fitness goal without making medical claims.
Follow the requested JSON output structure exactly and do not include Markdown.
`.trim();

function createAIError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function getWorkoutDayCount(activityLevel) {
  if (activityLevel === 'low') return 3;
  if (activityLevel === 'high') return 5;
  return 4;
}

function validateWorkoutResponse(data, expectedWorkoutDays) {
  const expectedDayLabels = Array.from({ length: 7 }, (_, index) => `Day ${index + 1}`);
  const expectedFrequency = `${expectedWorkoutDays} workout days per week`;

  const validPlan =
    Array.isArray(data?.workoutPlan) &&
    data.workoutPlan.length === 7 &&
    data.workoutPlan.every(
      (day, index) =>
        day?.day === expectedDayLabels[index] &&
        ['workout', 'recovery', 'rest'].includes(day?.dayType) &&
        isNonEmptyString(day?.focus) &&
        Array.isArray(day?.exercises) &&
        day.exercises.length > 0 &&
        day.exercises.every(isNonEmptyString)
    );

  const workoutDayCount = validPlan
    ? data.workoutPlan.filter((day) => day.dayType === 'workout').length
    : 0;

  if (
    !validPlan ||
    data.workoutPlan[0]?.dayType !== 'workout' ||
    workoutDayCount !== expectedWorkoutDays ||
    data?.weeklyFrequency !== expectedFrequency ||
    !isNonEmptyString(data?.safetyNote) ||
    !isNonEmptyString(data?.motivation)
  ) {
    throw createAIError('AI_INVALID_RESPONSE', 'AI returned an incomplete workout response');
  }
}

function validateNutritionResponse(data) {
  const validPlan =
    Array.isArray(data?.dietPlan) &&
    data.dietPlan.length > 0 &&
    data.dietPlan.every(
      (meal) =>
        isNonEmptyString(meal?.meal) &&
        Array.isArray(meal?.suggestions) &&
        meal.suggestions.length > 0 &&
        meal.suggestions.every(isNonEmptyString)
    );

  if (
    !validPlan ||
    !isNonEmptyString(data?.budgetExplanation) ||
    !isNonEmptyString(data?.safetyNote) ||
    !isNonEmptyString(data?.motivation)
  ) {
    throw createAIError('AI_INVALID_RESPONSE', 'AI returned an incomplete nutrition response');
  }
}

function validateProgressResponse(data) {
  const allowedTrends = ['improving', 'stable', 'needs_attention'];

  if (
    !isNonEmptyString(data?.analysis) ||
    !allowedTrends.includes(data?.trend) ||
    !isNonEmptyString(data?.suggestedAdjustment) ||
    !isNonEmptyString(data?.motivation)
  ) {
    throw createAIError('AI_INVALID_RESPONSE', 'AI returned an incomplete progress response');
  }
}

function parseAIResponse(text, validateResponse) {
  if (!isNonEmptyString(text)) {
    throw createAIError('AI_EMPTY_RESPONSE', 'AI returned an empty response');
  }

  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch (firstError) {
    const cleaned = text.replace(/```json|```/gi, '').trim();

    if (!cleaned) {
      throw createAIError('AI_EMPTY_RESPONSE', 'AI returned an empty response');
    }

    try {
      parsed = JSON.parse(cleaned);
    } catch (secondError) {
      throw createAIError('AI_INVALID_JSON', 'AI returned an invalid JSON response');
    }
  }

  validateResponse(parsed);
  return parsed;
}

function mapGeminiError(err) {
  if (typeof err?.code === 'string' && err.code.startsWith('AI_')) {
    return err;
  }

  const message = String(err?.message || '');

  if (/abort|timeout|timed out/i.test(message)) {
    return createAIError('AI_TIMEOUT', 'Gemini request timed out');
  }

  if (err?.status === 429) {
    return createAIError('AI_RATE_LIMIT', 'Gemini rate limit reached');
  }

  if (err?.name === 'GoogleGenerativeAIResponseError') {
    return createAIError('AI_INVALID_RESPONSE', 'Gemini returned an unusable response');
  }

  if (/fetch failed|network|ENOTFOUND|ECONN|EAI_AGAIN/i.test(message)) {
    return createAIError('AI_NETWORK_ERROR', 'Could not connect to Gemini');
  }

  return createAIError('AI_SERVICE_ERROR', 'Gemini service request failed');
}

async function generateJSON(systemInstruction, userPrompt, validateResponse) {
  if (!process.env.GEMINI_API_KEY) {
    throw createAIError('AI_CONFIG_ERROR', 'Gemini API key is not configured');
  }

  const model = genAI.getGenerativeModel(
    {
      model: MODEL_NAME,
      systemInstruction,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    },
    { timeout: AI_TIMEOUT_MS }
  );

  try {
    const result = await model.generateContent(userPrompt);
    const text = result.response.text();
    return parseAIResponse(text, validateResponse);
  } catch (err) {
    throw mapGeminiError(err);
  }
}

function buildWorkoutPrompt(profile) {
  const workoutDays = getWorkoutDayCount(profile.activityLevel);
  const recoveryDays = 7 - workoutDays;

  return `
USER PROFILE:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Height: ${profile.height} cm
- Weight: ${profile.weight} kg
- BMI: ${profile.bmi} (${profile.bmiCategory})
- Activity Level: ${profile.activityLevel}
- Fitness Goal: ${profile.fitnessGoal}

TASK:
Generate a safe, personalized workout plan for this user.

RULES:
- Beginner-friendly, home or low-cost gym focused.
- Never give medical/dangerous advice.
- Keep it realistic for the user's activity level.
- The workoutPlan MUST always contain exactly 7 entries representing one complete week.
- Return the entries in exact order: Day 1, Day 2, Day 3, Day 4, Day 5, Day 6, Day 7.
- Use exactly ${workoutDays} workout/training days and ${recoveryDays} rest or active-recovery days.
- Each day must include dayType as exactly one of: "workout", "recovery", or "rest".
- Exactly ${workoutDays} entries must use dayType "workout".
- Day 1 must use dayType "workout".
- Spread workout days across the week and avoid unnecessary back-to-back strength days when possible.
- Rest or active-recovery days must still include 1-2 simple recovery activities in the exercises array.
- Keep every exercise/activity name concise (maximum 8 words) so the plan is easy to scan.
- weeklyFrequency MUST be exactly: "${workoutDays} workout days per week".

EXPECTED OUTPUT:
Respond ONLY with valid JSON in this exact shape:
{
  "workoutPlan": [
    { "day": "Day 1", "dayType": "workout", "focus": "string", "exercises": ["string", "string"] },
    { "day": "Day 2", "dayType": "recovery | rest", "focus": "string", "exercises": ["string"] },
    { "day": "Day 3", "dayType": "workout | recovery | rest", "focus": "string", "exercises": ["string", "string"] },
    { "day": "Day 4", "dayType": "workout | recovery | rest", "focus": "string", "exercises": ["string"] },
    { "day": "Day 5", "dayType": "workout | recovery | rest", "focus": "string", "exercises": ["string", "string"] },
    { "day": "Day 6", "dayType": "workout | recovery | rest", "focus": "string", "exercises": ["string"] },
    { "day": "Day 7", "dayType": "workout | recovery | rest", "focus": "string", "exercises": ["string"] }
  ],
  "weeklyFrequency": "${workoutDays} workout days per week",
  "safetyNote": "string",
  "motivation": "string"
}
`.trim();
}

function buildNutritionPrompt(profile) {
  return `
USER PROFILE:
- Age: ${profile.age}
- Gender: ${profile.gender}
- BMI: ${profile.bmi} (${profile.bmiCategory})
- Fitness Goal: ${profile.fitnessGoal}
- Budget Preference: ${profile.budgetPreference}

TASK:
Generate practical and affordable meal guidance for this user. Focus on locally
available, low-cost foods and assume a South Asian / Bangladeshi context where relevant.

RULES:
- Budget-friendly suggestions, not strict medical diets.
- Mention this is general guidance, not a substitute for a dietitian.
- Keep each suggestion concise and readable (maximum 18 words).
- Put different food options in separate suggestion strings instead of joining many options with + signs.

EXPECTED OUTPUT:
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
USER PROFILE:
- Goal: ${profile.fitnessGoal}
- Current BMI: ${profile.bmi} (${profile.bmiCategory})

WEIGHT HISTORY (oldest to newest):
${historyText || 'No records yet.'}

TASK:
Analyze the user's progress trend and suggest a realistic adjustment if needed.

RULES:
- Analyze the trend relative to the user's goal.
- Be encouraging and realistic. No medical claims.

EXPECTED OUTPUT:
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
  const workoutDays = getWorkoutDayCount(profile.activityLevel);

  return generateJSON(
    WORKOUT_SYSTEM_PROMPT,
    buildWorkoutPrompt(profile),
    (data) => validateWorkoutResponse(data, workoutDays)
  );
}

async function generateNutritionRecommendation(profile) {
  return generateJSON(
    NUTRITION_SYSTEM_PROMPT,
    buildNutritionPrompt(profile),
    validateNutritionResponse
  );
}

async function generateProgressFeedback(profile, progressHistory) {
  return generateJSON(
    PROGRESS_SYSTEM_PROMPT,
    buildProgressPrompt(profile, progressHistory),
    validateProgressResponse
  );
}

module.exports = {
  generateWorkoutRecommendation,
  generateNutritionRecommendation,
  generateProgressFeedback,
};
