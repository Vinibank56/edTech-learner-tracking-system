
const express = require('express');
const router = express.Router();
const { getOutcomeStats, exportOutcomes } = require('../controllers/outcomeController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/stats', getOutcomeStats);
router.get('/export', exportOutcomes);

module.exports = router;