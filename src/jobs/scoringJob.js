
const cron = require('node-cron');
const ScoringService = require('../services/scoringService');
const NudgeService = require('../services/nudgeService');

class ScoringJob {
  constructor() {
    // Run daily at 2:00 AM
    this.schedule = '0 2 * * *';
    this.isRunning = false;
  }
  
  async run() {
    if (this.isRunning) {
      console.log('⏭️ Scoring job already running, skipping...');
      return;
    }
    
    this.isRunning = true;
    console.log('🚀 Starting scheduled scoring job...');
    
    try {
      // 1. Run scoring
      const scoringResult = await ScoringService.runDailyScoring();
      console.log('✅ Scoring completed:', scoringResult);
      
      // 2. Process nudges for newly at-risk learners
      const nudgeResult = await NudgeService.processNudges();
      console.log('✅ Nudge processing completed:', nudgeResult);
      
      // 3. Check outcomes for nudges sent 48+ hours ago
      const outcomeResult = await NudgeService.checkOutcomes();
      console.log('✅ Outcome check completed:', outcomeResult);
      
      console.log('🎉 Daily job completed successfully!');
      
    } catch (error) {
      console.error('❌ Daily job failed:', error);
    } finally {
      this.isRunning = false;
    }
  }
  
  start() {
    console.log(`⏰ Scheduling scoring job: ${this.schedule}`);
    cron.schedule(this.schedule, () => {
      this.run();
    });
    
    // Also run on startup (for development)
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Running initial scoring job on startup...');
      setTimeout(() => this.run(), 5000);
    }
  }
}

module.exports = new ScoringJob();