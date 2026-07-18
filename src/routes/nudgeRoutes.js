
const express = require('express');
const router = express.Router();
const { suppressNudge, resendNudge, getNudgeHistory } = require('../controllers/nudgeController');
const { authenticate, authorize } = require('../middlewares/auth');
const { validateLearnerId } = require('../middlewares/validate');

router.use(authenticate);
router.use(authorize(['admin'])); // Only admins can manage nudges

router.post('/:id/suppress', validateLearnerId, suppressNudge);
router.post('/:id/resend', validateLearnerId, resendNudge);
router.get('/:id/history', validateLearnerId, getNudgeHistory);

module.exports = router;