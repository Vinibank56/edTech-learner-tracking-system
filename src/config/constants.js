
module.exports = {
  // Scoring weights
  LOGIN_WEIGHT: parseFloat(process.env.LOGIN_WEIGHT) || 0.3,
  ASSIGNMENT_WEIGHT: parseFloat(process.env.ASSIGNMENT_WEIGHT) || 0.4,
  ACTIVITY_WEIGHT: parseFloat(process.env.ACTIVITY_WEIGHT) || 0.3,
  
  // Classification thresholds
  AT_RISK_THRESHOLD: parseInt(process.env.AT_RISK_THRESHOLD) || 40,
  DISENGAGED_THRESHOLD: parseInt(process.env.DISENGAGED_THRESHOLD) || 20,
  
  // Nudge settings
  NUDGE_WINDOW_HOURS: 48,
  
  // Status constants
  STATUS: {
    ACTIVE: 'Active',
    AT_RISK: 'At-Risk',
    DISENGAGED: 'Disengaged'
  }
};