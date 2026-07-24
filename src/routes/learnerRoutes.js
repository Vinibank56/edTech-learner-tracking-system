
const express = require('express');
const router = express.Router();
const { getAllLearners, getDashboardStats, getLearnerById, createLearner, updateLearner, deleteLearner } = require('../controllers/learnerController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateLearnerId } = require('../middlewares/validate');

// All learner routes require authentication
router.use(authenticate);

router.get('/', getAllLearners);
router.get('/dashboard/stats', getDashboardStats);
router.get('/:id', validateLearnerId, getLearnerById);

router.post('/', authorize(['admin']), createLearner);
router.put('/:id', authorize(['admin']), validateLearnerId, updateLearner);
router.delete('/:id', authorize(['admin']), validateLearnerId, deleteLearner);
//router.delete('/softdelete/:id', authorize(['admin']), validateLearnerId, softDeleteLearner);
//router.post('/restore/:id', authorize(['admin']), validateLearnerId, restoreLearner);

module.exports = router;