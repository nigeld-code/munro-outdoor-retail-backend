const Product = require('../models/product');

exports.getProduct = (req, res, next) => {
  let sku = req.params.sku;
  Product.findOne({ productSku: sku })
    .populate('breadcrumbs')
    .then(product => {
      res.status(200).json({
        product
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
