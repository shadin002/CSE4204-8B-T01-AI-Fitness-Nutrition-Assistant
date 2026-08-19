const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  generateWorkout,
  generateNutrition,
  generateProgressFeedback,
  getRecommendations,
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user._id),
  message: {
    success: false,
    message: 'You have reached the AI request limit. Please try again later.',
  },
});

router.post('/workout', aiLimiter, generateWorkout);
router.post('/nutrition', aiLimiter, generateNutrition);
router.post('/progress', aiLimiter, generateProgressFeedback);
router.get('/', getRecommendations);

module.exports = router;
