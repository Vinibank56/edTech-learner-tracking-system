
const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
  learnerId: {
    type: String,
    required: true,
    index: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  classification: {
    type: String,
    enum: ['Active', 'At-Risk', 'Disengaged'],
    required: true
  },
  // Detailed breakdown for debugging
  breakdown: {
    loginScore: { type: Number },
    assignmentScore: { type: Number },
    activityScore: { type: Number }
  },
  // Raw metrics at time of scoring
  metricsSnapshot: {
    totalLogins: { type: Number },
    assignmentsCompleted: { type: Number },
    totalAssignments: { type: Number },
    daysSinceLastActivity: { type: Number }
  },
  calculatedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for fetching latest scores
ScoreSchema.index({ learnerId: 1, calculatedAt: -1 });

module.exports = mongoose.model('Score', ScoreSchema);