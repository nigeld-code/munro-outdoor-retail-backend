const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');

const authCheck = require('../middleware/authCheck');

const router = express.Router();

router.put(
  '/register',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a vaild email')
      .normalizeEmail()
      .custom(value => {
        return User.findOne({ email: value }).then(userExists => {
          if (userExists) {
            return Promise.reject('Email address already registered');
          }
        });
      }),
    body('password')
      .trim()
      .isLength({ min: 8, max: 20 })
      .withMessage('Password must be between 8 and 20 characters')
  ],
  authController.register
);

router.post('/login', authController.login);

router.post('/autoLogin', authCheck, authController.autoLogin);

router.post(
  '/forgottenPassword',
  [body('email').isEmail().normalizeEmail()],
  authController.forgottenPassword
);

router.put(
  '/resetPassword',
  [
    body('password')
      .trim()
      .isLength({ min: 8, max: 20 })
      .withMessage('Password must be between 8 and 20 characters')
  ],
  authController.resetPassword
);

module.exports = router;
