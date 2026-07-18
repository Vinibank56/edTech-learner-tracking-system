
const mongoose = require('mongoose');

const OutcomeSchema = new mongoose.Schema({
  // For storing daily aggregate stats
  date: {
    type: Date,
    required: true,
    unique: true,
    index: true
  },
  // Overall stats
  totalLearners: { type: Number, default: 0 },
  activeCount: { type: Number, default: 0 },
  atRiskCount: { type: Number, default: 0 },
  disengagedCount: { type: Number, default: 0 },
  // Nudge stats
  nudgesSent: { type: Number, default: 0 },
  nudgesSuppressed: { type: Number, default: 0 },
  // Return stats
  returnedWithin48h: { type: Number, default: 0 },
  returnRate: { type: Number, default: 0 }, // Percentage
  // Weekly trend (7-day rolling)
  weeklyLoginChange: { type: Number, default: 0 }
}, {
  timestamps: true
});

module.exports = mongoose.model('Outcome', OutcomeSchema);