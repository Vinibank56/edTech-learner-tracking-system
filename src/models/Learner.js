
const mongoose = require('mongoose');

const LearnerSchema = new mongoose.Schema({
  learnerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  // Raw metrics (updated daily)
  metrics: {
    totalLogins: { type: Number, default: 0 },
    assignmentsCompleted: { type: Number, default: 0 },
    totalAssignments: { type: Number, default: 0 },
    lastActivityDate: { type: Date, default: null },
    // For tracking weekly trends
    weeklyLogins: { type: Number, default: 0 },
    weeklyAssignments: { type: Number, default: 0 }
  },
  // Current status
  currentStatus: {
    type: String,
    enum: ['Active', 'At-Risk', 'Disengaged'],
    default: 'Active'
  },
  // When they were nudged (if any)
  nudgedAt: {
    type: Date,
    default: null
  },
  // Suppression status
  isSuppressed: {
    type: Boolean,
    default: false
  },
  // Return tracking
  returnedAfterNudge: {
    type: Boolean,
    default: false
  },
  returnDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for fast queries
LearnerSchema.index({ currentStatus: 1 });
LearnerSchema.index({ 'metrics.lastActivityDate': -1 });

module.exports = mongoose.model('Learner', LearnerSchema);