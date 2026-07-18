
const mongoose = require('mongoose');

const NudgeSchema = new mongoose.Schema({
  learnerId: {
    type: String,
    required: true,
    index: true
  },
  // The status when nudge was sent
  statusAtNudge: {
    type: String,
    enum: ['Active', 'At-Risk', 'Disengaged'],
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  // Tracking
  isSuppressed: {
    type: Boolean,
    default: false
  },
  suppressedAt: {
    type: Date,
    default: null
  },
  suppressedBy: {
    type: String,
    default: null
  },
  isResend: {
    type: Boolean,
    default: false
  },
  originalNudgeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nudge',
    default: null
  },
  // Email status
  emailSent: {
    type: Boolean,
    default: false
  },
  emailError: {
    type: String,
    default: null
  },
  // Outcome tracking
  outcomeChecked: {
    type: Boolean,
    default: false
  },
  returned: {
    type: Boolean,
    default: false
  },
  timeToReturn: {
    type: Number, // Hours
    default: null
  }
}, {
  timestamps: true
});

// Indexes
NudgeSchema.index({ learnerId: 1, sentAt: -1 });
NudgeSchema.index({ sentAt: 1, outcomeChecked: 0 });

module.exports = mongoose.model('Nudge', NudgeSchema);