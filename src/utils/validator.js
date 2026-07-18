
/**
 * This is our data inspector.
 * It checks if data is valid before we save it to the database.
 */

const logger = require('./logger');

class Validator {
  /**
   * Check if a string is a valid email
   */
  static isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Check if password is strong enough
   * - At least 8 characters
   * - Contains at least 1 number
   * - Contains at least 1 uppercase letter
   */
  static isValidPassword(password) {
    if (!password || password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    
    if (!/\d/.test(password)) {
      return { valid: false, message: 'Password must contain at least 1 number' };
    }
    
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least 1 uppercase letter' };
    }
    
    return { valid: true };
  }
  
  /**
   * Check if a learner ID is valid (format: L0001)
   */
  static isValidLearnerId(learnerId) {
    if (!learnerId) return false;
    return /^L\d{4}$/.test(learnerId);
  }
  
  /**
   * Check if a score is valid (0-100)
   */
  static isValidScore(score) {
    return typeof score === 'number' && score >= 0 && score <= 100;
  }
  
  /**
   * Check if a status is valid
   */
  static isValidStatus(status) {
    const validStatuses = ['Active', 'At-Risk', 'Disengaged'];
    return validStatuses.includes(status);
  }
  
  /**
   * Sanitize input (remove dangerous characters)
   */
  static sanitizeString(input) {
    if (!input || typeof input !== 'string') return '';
    // Remove HTML tags, scripts, etc.
    return input
      .trim()
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[^\w\s@.-]/g, ''); // Allow only safe characters
  }
  
  /**
   * Validate a learner object before saving
   */
  static validateLearner(learnerData) {
    const errors = [];
    
    // Check required fields
    if (!learnerData.learnerId) {
      errors.push('learnerId is required');
    } else if (!this.isValidLearnerId(learnerData.learnerId)) {
      errors.push('learnerId must be in format L0001');
    }
    
    if (!learnerData.name) {
      errors.push('name is required');
    }
    
    if (!learnerData.email) {
      errors.push('email is required');
    } else if (!this.isValidEmail(learnerData.email)) {
      errors.push('email is invalid');
    }
    
    // Check metrics (if provided)
    if (learnerData.metrics) {
      if (learnerData.metrics.totalLogins !== undefined && 
          typeof learnerData.metrics.totalLogins !== 'number') {
        errors.push('totalLogins must be a number');
      }
      if (learnerData.metrics.assignmentsCompleted !== undefined && 
          typeof learnerData.metrics.assignmentsCompleted !== 'number') {
        errors.push('assignmentsCompleted must be a number');
      }
    }
    
    // Check status (if provided)
    if (learnerData.currentStatus && !this.isValidStatus(learnerData.currentStatus)) {
      errors.push('currentStatus must be Active, At-Risk, or Disengaged');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate a nudge object before sending
   */
  static validateNudge(nudgeData) {
    const errors = [];
    
    if (!nudgeData.learnerId) {
      errors.push('learnerId is required');
    }
    
    if (nudgeData.learnerId && !this.isValidLearnerId(nudgeData.learnerId)) {
      errors.push('learnerId must be in format L0001');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = Validator;