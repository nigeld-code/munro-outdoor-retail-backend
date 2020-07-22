const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  jwt.verify(token, process.env.AUTH_JWT_SECRET, (err, decodedResult) => {
    if (err || !decodedResult) {
      const error = new Error('Invalid or Expired Token');
      error.statusCode = 401;
      throw error;
    } else {
      decodedToken = decodedResult;
    }
  });
  req.decodedToken = decodedToken;
  next();
};
