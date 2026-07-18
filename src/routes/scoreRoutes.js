
const express = require('express');
const router = express.Router();
const { getLearnerScores, getLatestScores } = require('../controllers/scoreController');
const { authenticate } = require('../middlewares/auth');
const { validateLearnerId } = require('../middlewares/validate');

router.use(authenticate);

router.get('/latest', getLatestScores);
router.get('/:id', validateLearnerId, getLearnerScores);

module.exports = router;