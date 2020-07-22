const Product = require('../models/product');

module.exports = async (req, res, next) => {
  const basket = req.body.basket;
  await Promise.all(
    basket.map(line =>
      Product.findOne({ productSku: line.productSku }, 'productPrice')
    )
  )
    .then(prices => {
      let runningTotal = 0;
      prices.forEach((price, index) => {
        basket[index].price = price.productPrice;
        runningTotal += price.productPrice * basket[index].qty;
      });
      req.basket = basket;
      req.basketTotalPrice = runningTotal;
    })
    .catch(err => {
      throw err;
    });
  next();
};
