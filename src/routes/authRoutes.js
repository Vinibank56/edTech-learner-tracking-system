
const express = require('express');
const router = express.Router();
const { signup, login, refresh, logout } = require('../controllers/authController');
const { validateSignup, validateLogin } = require('../middlewares/validate');

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.post('/refresh-token', refresh);
router.post('/logout', logout);

module.exports = router;