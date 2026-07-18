
const Score = require('../models/Score');
const Learner = require('../models/Learner');

const getLearnerScores = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 30 } = req.query;
    
    const scores = await Score.find({ learnerId: id })
      .sort({ calculatedAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ success: true, data: scores });
    
  } catch (error) {
    next(error);
  }
};

const getLatestScores = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    // Get latest score for each learner
    const pipeline = [
      {
        $sort: { calculatedAt: -1 }
      },
      {
        $group: {
          _id: '$learnerId',
          latestScore: { $first: '$score' },
          latestClassification: { $first: '$classification' },
          calculatedAt: { $first: '$calculatedAt' }
        }
      }
    ];
    
    if (status) {
      pipeline.unshift({
        $match: { classification: status }
      });
    }
    
    const scores = await Score.aggregate(pipeline);
    
    res.json({ success: true, data: scores });
    
  } catch (error) {
    next(error);
  }
};

module.exports = { getLearnerScores, getLatestScores };