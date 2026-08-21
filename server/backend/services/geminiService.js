const { GoogleGenAI } = require('@google/genai');

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const AI_TIMEOUT_MS = 30000;

const WORKOUT_SYSTEM_PROMPT = `
You are a careful fitness guidance assistant for adult users of a beginner-friendly fitness app.
Provide safe, realistic, non-medical workout guidance.
Respect the user's training experience, equipment access, and listed movement limitations.
Keep the output concise and follow the requested JSON structure exactly.
`.trim();

const NUTRITION_SYSTEM_PROMPT = `
You are a budget-friendly nutrition guidance assistant for adult users of a fitness app.
Provide practical, affordable, non-medical meal guidance using locally available foods.
Never recommend a food listed in the user's allergies and respect the user's dietary preference.
Follow the requested JSON output structure exactly and do not include Markdown.
`.trim();

const PROGRESS_SYSTEM_PROMPT = `
You are a supportive fitness progress analyst for adult users.
Analyze weight progress relative to the user's fitness goal without diagnosing conditions or making medical claims.
Follow the requested JSON output structure exactly and do not include Markdown.
`.trim();

const workoutJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    workoutPlan: {
      type: 'array',
      minItems: 7,
      maxItems: 7,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          focus: { type: 'string' },
          exercises: {
            type: 'array',
            minItems: 1,
            maxItems: 4,
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                sets: { type: 'integer', minimum: 1, maximum: 6 },
                repsOrTime: { type: 'string' },
                restSeconds: { type: 'integer', minimum: 0, maximum: 180 },
              },
              required: ['name', 'sets', 'repsOrTime', 'restSeconds'],
            },
          },
        },
        required: ['focus', 'exercises'],
      },
    },
    safetyNote: { type: 'string' },
    motivation: { type: 'string' },
  },
  required: ['workoutPlan', 'safetyNote', 'motivation'],
};

const nutritionJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    dietPlan: {
      type: 'array',
      minItems: 4,
      maxItems: 4,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          meal: { type: 'string', enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] },
          suggestions: {
            type: 'array',
            minItems: 1,
            maxItems: 4,
            items: { type: 'string' },
          },
        },
        required: ['meal', 'suggestions'],
      },
    },
    localFoodIdeas: {
      type: 'array',
      minItems: 3,
      maxItems: 6,
      items: { type: 'string' },
    },
    budgetExplanation: { type: 'string' },
    safetyNote: { type: 'string' },
    motivation: { type: 'string' },
  },
  required: ['dietPlan', 'localFoodIdeas', 'budgetExplanation', 'safetyNote', 'motivation'],
};

const progressJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    analysis: { type: 'string' },
    trend: { type: 'string', enum: ['improving', 'stable', 'needs_attention'] },
    suggestedAdjustment: { type: 'string' },
    motivation: { type: 'string' },
  },
  required: ['analysis', 'trend', 'suggestedAdjustment', 'motivation'],
};

function createAIError(code, message, statusCode = 502) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function getWorkoutDayCount(profile) {
  const experience = profile.trainingExperience || 'beginner';
  const activity = profile.activityLevel || 'moderate';

  if (experience === 'beginner') return activity === 'high' ? 4 : 3;
  if (experience === 'advanced') return activity === 'high' ? 5 : 4;
  if (activity === 'low') return 3;
  if (activity === 'high') return 5;
  return 4;
}

function getWorkoutSchedule(workoutDays) {
  if (workoutDays <= 3) {
    return ['workout', 'recovery', 'workout', 'rest', 'workout', 'recovery', 'rest'];
  }
  if (workoutDays >= 5) {
    return ['workout', 'workout', 'recovery', 'workout', 'workout', 'recovery', 'workout'];
  }
  return ['workout', 'recovery', 'workout', 'rest', 'workout', 'recovery', 'workout'];
}

function validateExercise(exercise) {
  return (
    isNonEmptyString(exercise?.name) &&
    Number.isInteger(exercise?.sets) &&
    exercise.sets >= 1 &&
    exercise.sets <= 6 &&
    isNonEmptyString(exercise?.repsOrTime) &&
    Number.isInteger(exercise?.restSeconds) &&
    exercise.restSeconds >= 0 &&
    exercise.restSeconds <= 180
  );
}

function normalizeWorkoutResponse(data, workoutDays) {
  const schedule = getWorkoutSchedule(workoutDays);

  if (!Array.isArray(data?.workoutPlan) || data.workoutPlan.length !== 7) {
    throw createAIError('AI_INVALID_RESPONSE', 'AI returned an incomplete workout response');
  }

  const normalizedPlan = data.workoutPlan.map((day, index) => {
    if (
      !isNonEmptyString(day?.focus) ||
      !Array.isArray(day?.exercises) ||
      day.exercises.length === 0 ||
      !day.exercises.every(validateExercise)
    ) {
      throw createAIError('AI_INVALID_RESPONSE', 'AI returned an incomplete workout response');
    }

    return {
      day: `Day ${index + 1}`,
      dayType: schedule[index],
      focus: day.focus.trim(),
      exercises: day.exercises.map((exercise) => ({
        name: exercise.name.trim(),
        sets: exercise.sets,
        repsOrTime: exercise.repsOrTime.trim(),
        restSeconds: exercise.restSeconds,
      })),
    };
  });

  if (!isNonEmptyString(data?.safetyNote) || !isNonEmptyString(data?.motivation)) {
    throw createAIError('AI_INVALID_RESPONSE', 'AI returned an incomplete workout response');
  }

  return {
    workoutPlan: normalizedPlan,
    weeklyFrequency: `${workoutDays} workout days per week`,
    safetyNote: data.safetyNote.trim(),
    motivation: data.motivation.trim(),
  };
}

function validateNutritionResponse(data) {
  const expectedMeals = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  const mealMap = new Map((data?.dietPlan || []).map((item) => [item?.meal, item]));
  const normalizedPlan = expectedMeals.map((meal) => mealMap.get(meal));

  const validPlan =
    normalizedPlan.every(
      (meal) =>
        meal &&
        Array.isArray(meal.suggestions) &&
        meal.suggestions.length > 0 &&
        meal.suggestions.every(isNonEmptyString)
    );

  if (
    !validPlan ||
    !Array.isArray(data?.localFoodIdeas) ||
    data.localFoodIdeas.length < 3 ||
    !data.localFoodIdeas.every(isNonEmptyString) ||
    !isNonEmptyString(data?.budgetExplanation) ||
    !isNonEmptyString(data?.safetyNote) ||
    !isNonEmptyString(data?.motivation)
  ) {
    throw createAIError('AI_INVALID_RESPONSE', 'AI returned an incomplete nutrition response');
  }

  return {
    ...data,
    dietPlan: normalizedPlan,
  };
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
  return data;
}

function parseAIResponse(text) {
  if (!isNonEmptyString(text)) {
    throw createAIError('AI_EMPTY_RESPONSE', 'AI returned an empty response');
  }

  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json|```/gi, '').trim();
    if (!cleaned) throw createAIError('AI_EMPTY_RESPONSE', 'AI returned an empty response');
    try {
      return JSON.parse(cleaned);
    } catch {
      throw createAIError('AI_INVALID_JSON', 'AI returned invalid JSON');
    }
  }
}

function mapGeminiError(err) {
  if (typeof err?.code === 'string' && err.code.startsWith('AI_')) return err;

  const message = String(err?.message || '');
  if (/abort|timeout|timed out/i.test(message) || err?.name === 'AbortError') {
    return createAIError('AI_TIMEOUT', 'AI service took too long to respond. Please try again.', 504);
  }
  if (err?.status === 429 || /429|RESOURCE_EXHAUSTED/i.test(message)) {
    return createAIError('AI_RATE_LIMIT', 'AI request limit reached. Please try again later.', 429);
  }
  if (/fetch failed|network|ENOTFOUND|ECONN|EAI_AGAIN/i.test(message)) {
    return createAIError('AI_NETWORK_ERROR', 'Could not connect to the AI service.', 503);
  }
  return createAIError('AI_SERVICE_ERROR', 'AI service request failed.', 502);
}

async function generateJSON(systemInstruction, userPrompt, responseJsonSchema) {
  if (!process.env.GEMINI_API_KEY) {
    throw createAIError('AI_CONFIG_ERROR', 'Gemini API key is not configured', 500);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  const thinkingConfig = /(^|-)2\.5(-|$)/i.test(MODEL_NAME)
    ? { thinkingBudget: 0 }
    : undefined;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: userPrompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseJsonSchema,
        maxOutputTokens: 4096,
        ...(thinkingConfig ? { thinkingConfig } : {}),
        abortSignal: controller.signal,
      },
    });

    return parseAIResponse(response.text);
  } catch (err) {
    throw mapGeminiError(err);
  } finally {
    clearTimeout(timer);
  }
}

function buildWorkoutPrompt(profile) {
  const workoutDays = getWorkoutDayCount(profile);
  const schedule = getWorkoutSchedule(workoutDays);
  const scheduleText = schedule
    .map((dayType, index) => `- Day ${index + 1}: ${dayType}`)
    .join('\n');

  return `
USER PROFILE:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Height: ${profile.height} cm
- Current Weight: ${profile.weight} kg
- BMI: ${profile.bmi} (${profile.bmiCategory})
- Activity Level: ${profile.activityLevel}
- Fitness Goal: ${profile.fitnessGoal}
- Training Experience: ${profile.trainingExperience || 'beginner'}
- Equipment Access: ${profile.equipmentAccess || 'bodyweight'}
- Movement Limitations / Exercises to Avoid: ${profile.movementLimitations || 'None provided'}

WEEK SCHEDULE:
${scheduleText}

TASK:
Create content for the seven days above, in exactly that order.

RULES:
- Respect the exact workout/recovery/rest schedule above.
- Use only exercises appropriate for the user's experience and available equipment.
- Never include a movement that conflicts with listed limitations.
- Workout days: provide 3-4 concise exercises.
- Recovery/rest days: provide exactly 1 simple recovery, mobility, walking, stretching, or rest instruction.
- Every exercise/activity must include sets, repsOrTime, and restSeconds.
- For a simple recovery/rest activity, use sets=1 and restSeconds=0 when normal set/rest values do not apply.
- Keep each name and repsOrTime short so the plan loads quickly.
- Do not provide medical advice or rehabilitation instructions.
`.trim();
}

function buildNutritionPrompt(profile) {
  return `
USER PROFILE:
- Age: ${profile.age}
- Gender: ${profile.gender}
- Current Weight: ${profile.weight} kg
- BMI: ${profile.bmi} (${profile.bmiCategory})
- Fitness Goal: ${profile.fitnessGoal}
- Budget Preference: ${profile.budgetPreference}
- Dietary Preference: ${profile.dietaryPreference || 'no_preference'}
- Food Allergies / Foods to Avoid: ${profile.foodAllergies || 'None provided'}

TASK:
Generate general, budget-aware nutrition guidance suitable for an adult user in Bangladesh.
Use exactly Breakfast, Lunch, Dinner, and Snacks once each.
Never include a listed allergen or violate the dietary preference.
Prefer practical local foods such as rice, roti, dal, vegetables, eggs, fish, chicken, fruit, yogurt, and similar foods when appropriate.
Keep suggestions concise and non-medical.
`.trim();
}

function buildProgressPrompt(profile, history) {
  const historyText = history
    .map((item) => `${new Date(item.date).toISOString().slice(0, 10)}: ${item.weight} kg${item.note ? ` (${item.note})` : ''}`)
    .join('\n');

  return `
USER CONTEXT:
- Fitness Goal: ${profile.fitnessGoal}
- Current BMI: ${profile.bmi} (${profile.bmiCategory})
- Current Weight: ${profile.weight} kg

WEIGHT HISTORY (oldest to newest):
${historyText}

TASK:
Analyze the trend relative to the user's fitness goal. Classify the trend as improving, stable, or needs_attention, suggest one realistic adjustment, and provide supportive motivation.
Do not make medical claims. If the history is too limited for a strong conclusion, say so clearly.
`.trim();
}

async function generateWorkoutRecommendation(profile) {
  const workoutDays = getWorkoutDayCount(profile);
  const parsed = await generateJSON(
    WORKOUT_SYSTEM_PROMPT,
    buildWorkoutPrompt(profile),
    workoutJsonSchema
  );
  return normalizeWorkoutResponse(parsed, workoutDays);
}

async function generateNutritionRecommendation(profile) {
  const parsed = await generateJSON(
    NUTRITION_SYSTEM_PROMPT,
    buildNutritionPrompt(profile),
    nutritionJsonSchema
  );
  return validateNutritionResponse(parsed);
}

async function generateProgressFeedback(profile, history) {
  const parsed = await generateJSON(
    PROGRESS_SYSTEM_PROMPT,
    buildProgressPrompt(profile, history),
    progressJsonSchema
  );
  return validateProgressResponse(parsed);
}

module.exports = {
  generateWorkoutRecommendation,
  generateNutritionRecommendation,
  generateProgressFeedback,
};
