
const constants = require('../config/constants');
const Learner = require('../models/Learner');
const Score = require('../models/Score');

class ScoringService {
  /**
   * Calculate score for a single learner
   */
  static calculateScore(learner) {
    const { totalLogins, assignmentsCompleted, totalAssignments, lastActivityDate } = learner.metrics;
    
    // 1. Login frequency score (0-100)
    // Assume 10+ logins = 100, 0 logins = 0
    const loginScore = Math.min((totalLogins / 10) * 100, 100);
    
    // 2. Assignment completion score (0-100)
    const completionRate = totalAssignments > 0 
      ? (assignmentsCompleted / totalAssignments) * 100 
      : 0;
    const assignmentScore = Math.min(completionRate, 100);
    
    // 3. Activity recency score (0-100)
    // Days since last activity: 0 days = 100, 30+ days = 0
    let activityScore = 100;
    if (lastActivityDate) {
      const daysSince = Math.floor((Date.now() - new Date(lastActivityDate)) / (1000 * 60 * 60 * 24));
      activityScore = Math.max(100 - (daysSince / 30) * 100, 0);
    }
    
    // Weighted total (0-100)
    const weightedScore = (
      (loginScore * constants.LOGIN_WEIGHT) +
      (assignmentScore * constants.ASSIGNMENT_WEIGHT) +
      (activityScore * constants.ACTIVITY_WEIGHT)
    );
    
    return {
      score: Math.round(weightedScore),
      breakdown: {
        loginScore: Math.round(loginScore),
        assignmentScore: Math.round(assignmentScore),
        activityScore: Math.round(activityScore)
      },
      metricsSnapshot: {
        totalLogins,
        assignmentsCompleted,
        totalAssignments,
        daysSinceLastActivity: lastActivityDate 
          ? Math.floor((Date.now() - new Date(lastActivityDate)) / (1000 * 60 * 60 * 24))
          : null
      }
    };
  }
  
  /**
   * Classify learner based on score
   */
  static classify(score) {
    if (score >= constants.AT_RISK_THRESHOLD) {
      return constants.STATUS.ACTIVE;
    } else if (score >= constants.DISENGAGED_THRESHOLD) {
      return constants.STATUS.AT_RISK;
    } else {
      return constants.STATUS.DISENGAGED;
    }
  }
  
  /**
   * Process all learners and update scores
   */
  static async runDailyScoring() {
    console.log('🔄 Starting daily scoring job...');
    const startTime = Date.now();
    
    try {
      // Get all learners
      const learners = await Learner.find({});
      console.log(`📊 Found ${learners.length} learners`);
      
      let updated = 0;
      let errors = 0;
      
      for (const learner of learners) {
        try {
          // Calculate score
          const result = this.calculateScore(learner);
          const classification = this.classify(result.score);
          
          // Track previous status for nudge detection
          const previousStatus = learner.currentStatus;
          
          // Update learner
          learner.currentStatus = classification;
          await learner.save();
          
          // Save score history
          const scoreRecord = new Score({
            learnerId: learner.learnerId,
            score: result.score,
            classification: classification,
            breakdown: result.breakdown,
            metricsSnapshot: result.metricsSnapshot,
            calculatedAt: new Date()
          });
          await scoreRecord.save();
          
          // Check for status transition to At-Risk (for nudges)
          if (classification === constants.STATUS.AT_RISK && 
              previousStatus !== constants.STATUS.AT_RISK) {
            console.log(`🔔 Learner ${learner.learnerId} transitioned to At-Risk!`);
            // Mark for nudge (NudgeService will pick up)
            // We'll handle this in the nudge service
          }
          
          updated++;
          
        } catch (error) {
          console.error(`❌ Error scoring learner ${learner.learnerId}:`, error.message);
          errors++;
        }
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ Scoring completed in ${duration}ms`);
      console.log(`📊 Updated: ${updated}, Errors: ${errors}`);
      
      // Update outcome stats after scoring
      await this.updateOutcomeStats();
      
      return { updated, errors, duration };
      
    } catch (error) {
      console.error('❌ Scoring job failed:', error);
      throw error;
    }
  }
  
  /**
   * Update aggregate outcome stats
   */
  static async updateOutcomeStats() {
    const Outcome = require('../models/Outcome');
    const Nudge = require('../models/Nudge');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count learners by status
    const statusCounts = await Learner.aggregate([
      { $group: { _id: '$currentStatus', count: { $sum: 1 } } }
    ]);
    
    const statusMap = {};
    statusCounts.forEach(item => {
      statusMap[item._id] = item.count;
    });
    
    // Count nudges sent today
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const nudgesSent = await Nudge.countDocuments({
      sentAt: { $gte: todayStart, $lte: todayEnd },
      isSuppressed: false,
      emailSent: true
    });
    
    const nudgesSuppressed = await Nudge.countDocuments({
      sentAt: { $gte: todayStart, $lte: todayEnd },
      isSuppressed: true
    });
    
    // Calculate return rate (last 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentNudges = await Nudge.find({
      sentAt: { $gte: sevenDaysAgo, $lte: todayEnd },
      outcomeChecked: true
    });
    
    const returned = recentNudges.filter(n => n.returned).length;
    const total = recentNudges.length;
    const returnRate = total > 0 ? (returned / total) * 100 : 0;
    
    // Calculate weekly login change (simplified)
    // This would compare this week's logins to last week's
    // For MVP, we'll keep it simple
    
    // Update or create outcome record
    await Outcome.findOneAndUpdate(
      { date: today },
      {
        totalLearners: await Learner.countDocuments(),
        activeCount: statusMap[constants.STATUS.ACTIVE] || 0,
        atRiskCount: statusMap[constants.STATUS.AT_RISK] || 0,
        disengagedCount: statusMap[constants.STATUS.DISENGAGED] || 0,
        nudgesSent,
        nudgesSuppressed,
        returnedWithin48h: returned,
        returnRate: Math.round(returnRate * 100) / 100,
        weeklyLoginChange: 0 // Placeholder - implement later
      },
      { upsert: true }
    );
    
    console.log('📊 Outcome stats updated');
  }
}

module.exports = ScoringService;