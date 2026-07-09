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

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests. Please try again later.',
  },
});

router.use(protect);

router.post('/workout', aiLimiter, generateWorkout);
router.post('/nutrition', aiLimiter, generateNutrition);
router.post('/progress', aiLimiter, generateProgressFeedback);
router.get('/', getRecommendations);

module.exports = router;
