
const express = require('express');
const router = express.Router();
const { getAllLearners, getDashboardStats, getLearnerById  } = require('../controllers/learnerController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateLearnerId } = require('../middlewares/validate');

// All learner routes require authentication
router.use(authenticate);

router.get('/', getAllLearners);
router.get('/dashboard/stats', getDashboardStats);
router.get('/:id', validateLearnerId, getLearnerById);

module.exports = router;