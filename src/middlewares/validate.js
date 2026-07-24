
const { body, param, query, validationResult } = require('express-validator');

// Validate signup
const validateSignup = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('name').notEmpty().trim(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }
    next();
  }
];

// Validate login
const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }
    next();
  }
];

// Validate ID parameter
const validateLearnerId = [
  param('id').notEmpty().isString(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
      });
    }
    next();
  }
];

module.exports= { validateSignup, validateLogin, validateLearnerId };