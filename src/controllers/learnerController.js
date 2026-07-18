

const Learner = require('../models/Learner');

// Get all learners with optional filtering, sorting, pagination
const getAllLearners = async (req, res, next) => {
  try {
    const { status, sort, order, limit = 100, page = 1 } = req.query;
    
    // Build filter (e.g., status=At-Risk)
    const filter = {};
    if (status) filter.currentStatus = status;
    
    // Build sort (e.g., sort=score&order=desc)
    const sortOptions = {};
    if (sort) {
      sortOptions[sort] = order === 'desc' ? -1 : 1;
    } else {
      // default sort by last activity
      sortOptions['metrics.lastActivityDate'] = -1;
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const learners = await Learner.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Learner.countDocuments(filter);
    
    res.json({
      success: true,
      data: learners,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total/parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
};

// Get dashboard summary stats
const getDashboardStats = async (req, res, next) => {
  try {
    const total = await Learner.countDocuments();
    const active = await Learner.countDocuments({ currentStatus: 'Active' });
    const atRisk = await Learner.countDocuments({ currentStatus: 'At-Risk' });
    const disengaged = await Learner.countDocuments({ currentStatus: 'Disengaged' });
    
    const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000);
    const activeLastWeek = await Learner.countDocuments({
      'metrics.lastActivityDate': { $gte: sevenDaysAgo }
    });
    
    res.json({
      success: true,
      stats: { total, active, atRisk, disengaged, activeLastWeek,
               atRiskRate: total > 0 ? Math.round((atRisk/total)*100) : 0 }
    });
  } catch (error) {
    next(error);
  }
};

// Get a single learner by ID
const getLearnerById = async (req, res, next) => {
  try {
    const learner = await Learner.findOne({ learnerId: req.params.id });
    if (!learner) return res.status(404).json({ error: 'Learner not found' });
    res.json({ success: true, data: learner });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllLearners, getDashboardStats, getLearnerById };