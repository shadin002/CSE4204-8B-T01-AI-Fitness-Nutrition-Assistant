const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['workout', 'nutrition', 'progress'],
      required: [true, 'Recommendation type is required'],
    },
    inputData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    aiResponse: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

recommendationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);
