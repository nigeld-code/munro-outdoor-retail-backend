const voucherCodes = require('../voucherCodes');

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '../.env' });

exports.postSetupOrder = (req, res, next) => {
  const currentCodes = req.body.currentCodes;
  const basket = req.basket;
  let basketTotalPrice = req.basketTotalPrice;
  const isDelivery = req.body.deliveryDetails.isDelivery;
  const decodedToken = req.decodedToken;
  const passedDiscounts = [];
  if (currentCodes.length && basket.length) {
    currentCodes.forEach((code, index) => {
      const voucherCodeObj = voucherCodes.find(
        codeObj => codeObj.code === code
      );
      if (
        voucherCodeObj &&
        voucherCodeObj.check &&
        voucherCodeObj.check({
          decodedToken,
          currentCodes: [...currentCodes].filter((_, i) => i !== index),
          basket,
          basketTotalPrice
        })
      ) {
        passedDiscounts.push({
          code: voucherCodeObj.code,
          discountType: voucherCodeObj.discount.type,
          discountValue: voucherCodeObj.discount.value
        });
      }
    });
    if (passedDiscounts.length) {
      passedDiscounts.sort((a, b) => {
        if (a.discountType === b.discountType) {
          return 0;
        } else if (b.discountType === 'product') {
          return 1;
        } else if (b.discountType === '£') {
          if (a.discountType === '%') {
            return 1;
          } else {
            return -1;
          }
        } else if (b.discountType === '%') {
          return -1;
        } else {
          return 0;
        }
      });
      passedDiscounts.forEach(discount => {
        if (discount.discountType !== '%') {
          basketTotalPrice += discount.discountValue;
        } else {
          basketTotalPrice += (discount.discountValue / 100) * basketTotalPrice;
        }
        if (basketTotalPrice < 0) basketTotalPrice = 0;
      });
    }
  }

  if (isDelivery && req.basketTotalPrice < 60) {
    basketTotalPrice += 5;
  }
  basketTotalPrice = +basketTotalPrice.toFixed(2);

  const orderObj = {
    customerId: decodedToken ? decodedToken.userId : null,
    products: basket,
    totals: {
      subTotal: req.basketTotalPrice,
      totalToPay: basketTotalPrice
    },
    discounts: passedDiscounts
  };

  const orderToken = jwt.sign(orderObj, process.env.ORDER_JWT_SECRET, {
    expiresIn: 3600
  });

  res.status(200).json({ orderObj, orderToken });
};
