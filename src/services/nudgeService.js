
const Learner = require('../models/Learner');
const Nudge = require('../models/Nudge');
const emailService = require('./emailService');
const constants = require('../config/constants');

class NudgeService {
  /**
   * Check for learners that need nudging (transitioned to At-Risk)
   */
  static async processNudges() {
    console.log('🔔 Processing nudges...');
    
    try {
      // Find At-Risk learners who haven't been nudged recently
      // and haven't been suppressed
      const atRiskLearners = await Learner.find({
        currentStatus: constants.STATUS.AT_RISK,
        isSuppressed: false,
        // Either never nudged, or nudged more than 7 days ago
        $or: [
          { nudgedAt: null },
          { nudgedAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        ]
      });
      
      console.log(`📊 Found ${atRiskLearners.length} learners needing nudges`);
      
      let sent = 0;
      let errors = 0;
      
      for (const learner of atRiskLearners) {
        try {
          // Check if already nudged today (prevent duplicates)
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          
          const existingNudge = await Nudge.findOne({
            learnerId: learner.learnerId,
            sentAt: { $gte: todayStart },
            isSuppressed: false,
            emailSent: true
          });
          
          if (existingNudge) {
            console.log(`⏭️ Learner ${learner.learnerId} already nudged today`);
            continue;
          }
          
          // Create nudge record
          const nudge = new Nudge({
            learnerId: learner.learnerId,
            statusAtNudge: constants.STATUS.AT_RISK,
            isSuppressed: false
          });
          
          // Send email
          const emailResult = await emailService.sendNudge(learner);
          
          if (emailResult.success) {
            nudge.emailSent = true;
            nudge.sentAt = new Date();
            await nudge.save();
            
            // Update learner
            learner.nudgedAt = new Date();
            await learner.save();
            
            sent++;
            console.log(`✅ Nudge sent to ${learner.learnerId}`);
          } else {
            nudge.emailError = emailResult.error;
            await nudge.save();
            errors++;
            console.error(`❌ Failed to send nudge to ${learner.learnerId}:`, emailResult.error);
          }
          
        } catch (error) {
          console.error(`❌ Error processing nudge for ${learner.learnerId}:`, error.message);
          errors++;
        }
      }
      
      console.log(`📊 Nudges sent: ${sent}, Errors: ${errors}`);
      return { sent, errors };
      
    } catch (error) {
      console.error('❌ Nudge processing failed:', error);
      throw error;
    }
  }
  
  /**
   * Suppress a nudge for a specific learner
   */
  static async suppressNudge(learnerId, adminId) {
    try {
      const learner = await Learner.findOne({ learnerId });
      if (!learner) {
        throw new Error('Learner not found');
      }
      
      // Update learner
      learner.isSuppressed = true;
      await learner.save();
      
      // Update any pending nudges
      const pendingNudges = await Nudge.updateMany(
        { 
          learnerId, 
          emailSent: false,
          isSuppressed: false
        },
        {
          isSuppressed: true,
          suppressedAt: new Date(),
          suppressedBy: adminId
        }
      );
      
      return { success: true, learner };
      
    } catch (error) {
      console.error('❌ Suppression failed:', error);
      throw error;
    }
  }
  
  /**
   * Resend a nudge to a specific learner
   */
  static async resendNudge(learnerId, adminId) {
    try {
      const learner = await Learner.findOne({ learnerId });
      if (!learner) {
        throw new Error('Learner not found');
      }
      
      // Check if learner is At-Risk
      if (learner.currentStatus !== constants.STATUS.AT_RISK) {
        throw new Error('Learner is not At-Risk');
      }
      
      // Check if already nudged recently (within 24 hours)
      const recentNudge = await Nudge.findOne({
        learnerId,
        sentAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        emailSent: true
      });
      
      if (recentNudge) {
        throw new Error('Learner already nudged within 24 hours');
      }
      
      // Find original nudge to track as resend
      const originalNudge = await Nudge.findOne({
        learnerId,
        emailSent: true
      }).sort({ sentAt: -1 });
      
      // Create new nudge record
      const nudge = new Nudge({
        learnerId: learner.learnerId,
        statusAtNudge: constants.STATUS.AT_RISK,
        isResend: true,
        originalNudgeId: originalNudge ? originalNudge._id : null
      });
      
      // Send email
      const emailResult = await emailService.sendNudge(learner);
      
      if (emailResult.success) {
        nudge.emailSent = true;
        nudge.sentAt = new Date();
        await nudge.save();
        
        // Update learner
        learner.nudgedAt = new Date();
        await learner.save();
        
        console.log(`✅ Resent nudge to ${learner.learnerId}`);
        return { success: true, nudge };
      } else {
        nudge.emailError = emailResult.error;
        await nudge.save();
        throw new Error(emailResult.error);
      }
      
    } catch (error) {
      console.error('❌ Resend failed:', error);
      throw error;
    }
  }
  
  /**
   * Check outcomes for nudges sent 48+ hours ago
   */
  static async checkOutcomes() {
    console.log('📊 Checking nudge outcomes...');
    
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    
    try {
      // Find nudges that need outcome checking
      const nudges = await Nudge.find({
        sentAt: { $lte: fortyEightHoursAgo },
        outcomeChecked: false,
        emailSent: true,
        isSuppressed: false
      });
      
      console.log(`📊 Found ${nudges.length} nudges to check outcomes`);
      
      let returned = 0;
      
      for (const nudge of nudges) {
        try {
          const learner = await Learner.findOne({ learnerId: nudge.learnerId });
          if (!learner) continue;
          
          // Check if learner returned (logged in or completed assignment)
          // We need to check activity after the nudge was sent
          const hasReturned = await this.checkReturnStatus(learner, nudge.sentAt);
          
          nudge.outcomeChecked = true;
          nudge.returned = hasReturned;
          
          if (hasReturned) {
            nudge.timeToReturn = (Date.now() - new Date(nudge.sentAt)) / (1000 * 60 * 60);
            returned++;
          }
          
          await nudge.save();
          
          // Update learner
          if (hasReturned) {
            learner.returnedAfterNudge = true;
            learner.returnDate = new Date();
            await learner.save();
          }
          
        } catch (error) {
          console.error(`❌ Error checking outcome for ${nudge.learnerId}:`, error.message);
        }
      }
      
      console.log(`📊 ${returned} learners returned within 48 hours`);
      
      // Update outcome stats
      const ScoringService = require('./scoringService');
      await ScoringService.updateOutcomeStats();
      
      return { checked: nudges.length, returned };
      
    } catch (error) {
      console.error('❌ Outcome check failed:', error);
      throw error;
    }
  }
  
  /**
   * Check if a learner returned (logged in or completed activity)
   */
  static async checkReturnStatus(learner, afterDate) {
    // This would check actual activity data
    // For MVP, we'll check if learner has recent activity
    // In production, you'd query the activity logs
    
    // Simplified: Check if learner has any activity after the nudge date
    // This would be replaced with actual activity log queries
    const hasRecentActivity = await Learner.findOne({
      learnerId: learner.learnerId,
      'metrics.lastActivityDate': { $gt: afterDate }
    });
    
    return !!hasRecentActivity;
  }
}

module.exports = NudgeService;