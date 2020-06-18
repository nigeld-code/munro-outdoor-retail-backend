const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '../.env' });
const { validationResult } = require('express-validator');

const User = require('../models/user');

const sendEmail = require('../helper/emailNotification');

exports.login = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let fetchedUser;
  User.findOne({ email })
    .then(user => {
      if (!user) {
        const error = new Error('Email not found');
        error.statusCode = 401;
        throw error;
      }
      fetchedUser = user;
      return bcrypt.compare(password, user.password);
    })
    .then(passwordsMatch => {
      if (!passwordsMatch) {
        const error = new Error('Incorrect Password!');
        error.statusCode = 401;
        throw error;
      }
      const authExpirationTimeout = 3600000; //1 hour
      const token = jwt.sign(
        {
          email: fetchedUser.email,
          userId: fetchedUser.id
        },
        process.env.AUTH_JWT_SECRET,
        { expiresIn: authExpirationTimeout / 1000 }
      );
      res.status(200).json({
        token,
        expiresIn: authExpirationTimeout,
        email: fetchedUser.email
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.autoLogin = (req, res, next) => {
  if (!req.decodedToken) {
    const error = new Error('No token found');
    error.statusCode = 400;
    throw error;
  }
  User.findById(req.decodedToken.userId)
    .then(user => {
      if (!user || user.email !== req.decodedToken.email) {
        const error = new Error('Incorrect token');
        error.statusCode = 401;
        throw error;
      }
      res.status(200).json(req.decodedToken);
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.register = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const password = req.body.password;
  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email,
        password: hashedPassword
      });
      return user.save();
    })
    .then(result => {
      if (result) {
        sendEmail(
          [result.email],
          'Munro Outdoor Retail, Successfully Registered',
          `<html>
            <body>
            <h1>Welcome, ${result.email}</h1>
            <p>You have successfully registered an account with Munro Outdoor Retail</p>
              <p>
                Please visit 
                <a href="${process.env.SITE_URL}">www.munro.com</a>
                to login and shop with us
              </p>
            </body>
          </html>`,
          `Welcome, ${result.email} \n
          You have successfully registered an account with Munro Outdoor Retail \n
          Please visit www.munro.com to login and shop with us`
        );
        res.status(201).json({ email: result.email });
      } else {
        const error = new Error('Failed to register');
        error.statusCode = 400;
        throw error;
      }
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.forgottenPassword = (req, res, next) => {
  const email = req.body.email;
  User.findOne({ email })
    .then(userExists => {
      if (!userExists) {
        res.status(200).json({ emailSent: false });
      } else {
        const resetToken = jwt.sign(
          {
            userId: userExists.id,
            email: userExists.email
          },
          userExists.password,
          { expiresIn: '1h' }
        );
        sendEmail(
          [userExists.email],
          'Password Reset for Munro Account',
          `<html>
            <body>
              <h1>Password Reset</h1>
              <p>Hi, to reset your Munro Account Password please click this link:</p>
              <p>
                <a 
                  href="${process.env.SITE_URL}/passwordreset/${userExists.id}/${resetToken}"
                >
                  ${process.env.SITE_URL}/passwordReset/${userExists.id}/${resetToken}
                </a>
              </p>
              <p>
                (Link will expire in 1 hour and will redirect you to our site to set a new password)
              </p>
              <p>
                If you didn't request this, you can ignore this email. Your password won't be changed until you create a new one.
              </p>
            </body>
          </html>`,
          `Password Reset \n
          Hi, to reset your Munro Account Password please click this link: \n
          ${process.env.SITE_URL}/passwordReset/${userExists.id}/${resetToken} \n
          (Link will expire in 1 hour and will redirect you to our site to set a new password) \n
          If you didn't request this, you can ignore this email. Your password won't be changed until you create a new one.`
        );
        res.status(200).json({ emailSent: true });
      }
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.resetPassword = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed');
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const userId = req.body.userId;
  const resetToken = req.body.resetToken;
  const password = req.body.password;
  if (!userId || !resetToken) {
    const error = new Error('Missing userId/resetToken');
    error.statusCode = 401;
    throw error;
  }
  let fetchedUser;
  User.findById(userId)
    .then(user => {
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 401;
        throw error;
      }
      fetchedUser = user;
      let decodedToken;
      jwt.verify(resetToken, user.password, (err, decodedResult) => {
        if (err || !decodedResult) {
          const error = new Error('Invalid or Expired Token');
          error.statusCode = 401;
          throw error;
        } else {
          decodedToken = decodedResult;
        }
      });
      if (
        decodedToken.userId !== user.id ||
        decodedToken.email !== user.email
      ) {
        const error = new Error('Invalid Token');
        error.statusCode = 401;
        throw error;
      }
      return bcrypt.hash(password, 12);
    })
    .then(hashedPassword => {
      fetchedUser.password = hashedPassword;
      return fetchedUser.save();
    })
    .then(result => {
      if (result) {
        res.status(201).json({ email: result.email });
      }
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
