
const Outcome = require('../models/Outcome');
const Nudge = require('../models/Nudge');

const getOutcomeStats = async (req, res, next) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);
    
    const outcomes = await Outcome.find({
      date: { $gte: startDate }
    }).sort({ date: 1 });
    
    // Calculate totals
    const totals = {
      totalNudges: 0,
      totalReturns: 0,
      avgReturnRate: 0
    };
    
    let returnRateSum = 0;
    outcomes.forEach(outcome => {
      totals.totalNudges += outcome.nudgesSent;
      totals.totalReturns += outcome.returnedWithin48h;
      returnRateSum += outcome.returnRate;
    });
    
    totals.avgReturnRate = outcomes.length > 0 ? Math.round(returnRateSum / outcomes.length * 100) / 100 : 0;
    totals.overallReturnRate = totals.totalNudges > 0 ? Math.round((totals.totalReturns / totals.totalNudges) * 100 * 100) / 100 : 0;
    
    // Recent weekly login change
    const recentOutcome = outcomes[outcomes.length - 1];
    
    res.json({
      success: true,
      data: {
        daily: outcomes,
        totals,
        weeklyLoginChange: recentOutcome ? recentOutcome.weeklyLoginChange : 0
      }
    });
    
  } catch (error) {
    next(error);
  }
};

const exportOutcomes = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const query = {};
    if (startDate) query.date = { $gte: new Date(startDate) };
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { ...query.date, $lte: end };
    }
    
    const outcomes = await Outcome.find(query).sort({ date: 1 });
    
    res.json({
      success: true,
      data: outcomes,
      count: outcomes.length
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = { getOutcomeStats, exportOutcomes };