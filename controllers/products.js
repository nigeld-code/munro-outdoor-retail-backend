const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
  let category = req.params.category;
  const selection = req.params.selection;
  Product.find({ isLive: true })
    .then(products => {
      res.status(200).json({
        products
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
