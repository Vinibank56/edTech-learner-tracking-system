
const Learner = require('../models/Learner');
const Score = require('../models/Score');
const Nudge = require('../models/Nudge');
const logger = require('../utils/logger');


// GET - Get all learners
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

// POST - Create learner
const createLearner = async (req, res, next) => {
  try {
    const { learnerId, name, email, metrics } = req.body;
    
    // Check if learnerId exists
    const existing = await Learner.findOne({ learnerId });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Learner ID already exists'
      });
    }
    
    // Check if email exists
    const emailExists = await Learner.findOne({ email });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        error: 'Email already in use'
      });
    }
    
    const learner = new Learner({
      learnerId,
      name,
      email,
      metrics: metrics || {
        totalLogins: 0,
        assignmentsCompleted: 0,
        totalAssignments: 0,
        lastActivityDate: new Date()
      },
      currentStatus: 'Active'
    });
    
    await learner.save();
    
    logger.info('Learner created', { learnerId, name, email });
    
    res.status(201).json({
      success: true,
      message: 'Learner created successfully',
      data: learner
    });
    
  } catch (error) {
    next(error);
  }
};

// PUT - Update learner
const updateLearner = async (req, res, next) => {
  try {
    const id = req.params.id;
    const updateData = req.body;
    
    // Find the learner
    const learner = await Learner.findOne({ 
      learnerId: id,
    });
    
    if (!learner) {
      return res.status(404).json({
        success: false,
        error: 'Learner not found'
      });
    }
    
    // Prevent updating the learnerId
    delete updateData.learnerId;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.isDeleted;
    delete updateData.deletedAt;
    
    // Check if email is being changed and is already taken
    if (updateData.email && updateData.email !== learner.email) {
      const emailExists = await Learner.findOne({
        email: updateData.email,
        learnerId: { $ne: id },
        isDeleted: false
      });
      if (emailExists) {
        return res.status(409).json({
          success: false,
          error: 'Email already in use by another learner'
        });
      }
    }
    
    // Update the learner
    const updatedLearner = await Learner.findOneAndUpdate(
      { learnerId: id },
      { $set: updateData },
      { 
        new: true,
        runValidators: true
      }
    );
    
    logger.info('Learner updated', { learnerId: id, updates: Object.keys(updateData) });
    
    res.json({
      success: true,
      message: 'Learner updated successfully',
      data: updatedLearner
    });
    
  } catch (error) {
    next(error);
  }
};

// DELETE - Delete learner
const deleteLearner = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the learner
    const learner = await Learner.findOne({ 
      learnerId: id,
    });
    
    if (!learner) {
      return res.status(404).json({
        success: false,
        error: 'Learner not found'
      });
    }
    
    //Hard delete (remove completely)
    await Learner.deleteOne({ learnerId: id });
    
    // Clean up related data
    await Score.deleteMany({ learnerId: id });
    await Nudge.deleteMany({ learnerId: id });
    
    logger.info('Learner deleted (hard delete)', { learnerId: id, name: learner.name });
    
    res.json({
      success: true,
      message: `Learner ${id} deleted successfully`,
      data: {
        learnerId: id,
        name: learner.name,
        deletedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllLearners, getDashboardStats, getLearnerById, createLearner, updateLearner, deleteLearner };