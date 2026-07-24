
const NudgeService = require('../services/nudgeService');
const Nudge = require('../models/Nudge');

const suppressNudge = async (req, res, next) => {
  try {
    const { learnerId } = req.params;
    const adminId = req.user.userId;
    
    const result = await NudgeService.suppressNudge(learnerId, adminId);
    res.json({ success: true, message: 'Nudge suppressed', data: result });
    
  } catch (error) {
    next(error);
  }
};

const resendNudge = async (req, res, next) => {
  try {
    const { learnerId } = req.params;
    const adminId = req.user.userId;
    
    const result = await NudgeService.resendNudge(learnerId, adminId);
    res.json({ success: true, message: 'Nudge resent', data: result });
    
  } catch (error) {
    next(error);
  }
};

const getNudgeHistory = async (req, res, next) => {
  try {
    const  learnerId  = req.params.id;
    const { limit = 10 } = req.query;
    
    const nudges = await Nudge.findOne({ learnerId })
      .sort({ sentAt: -1 })
      .limit(parseInt(limit));
      
      if(!nudges){
        res.status(401).json({message: `user with this id: ${learnerId} cannot be found`});
      }
    
    res.json({ success: true, data: nudges });
    
  } catch (error) {
    next(error);
  }
};

module.exports = { suppressNudge, resendNudge, getNudgeHistory };