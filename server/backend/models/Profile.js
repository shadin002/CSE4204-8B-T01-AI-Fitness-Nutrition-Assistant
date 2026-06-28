const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, 
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [10, 'Age must be at least 10'],
      max: [120, 'Age seems invalid'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: [true, 'Gender is required'],
    },
    height: {
      type: Number, 
      required: [true, 'Height is required'],
      min: [50, 'Height must be at least 50 cm'],
      max: [300, 'Height seems invalid'],
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [10, 'Weight must be at least 10 kg'],
      max: [500, 'Weight seems invalid'],
    },
    activityLevel: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      required: [true, 'Activity level is required'],
    },
    fitnessGoal: {
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'general_fitness'],
      required: [true, 'Fitness goal is required'],
    },
    budgetPreference: {
      type: String,
      enum: ['low', 'medium', 'high'],
      required: [true, 'Budget preference is required'],
    },
    bmi: {
      type: Number,
      default: 0,
    },
    bmiCategory: {
      type: String,
      default: 'unknown',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
