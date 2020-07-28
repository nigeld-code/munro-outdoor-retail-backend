const voucherCodes = require('../voucherCodes');

const jwt = require('jsonwebtoken');
require('dotenv').config({ path: __dirname + '../.env' });

const Order = require('../models/order');
const User = require('../models/user');
const Product = require('../models/product');

const sendEmail = require('../helper/emailNotification');

const getDiscountFormat = (discountType, discountValue) => {
  if (discountType === '%') {
    return `${discountValue.toString()}%`;
  } else {
    return `-£${Math.abs(discountValue)}`;
  }
};

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

exports.postPlaceOrder = (req, res, next) => {
  const orderToken = req.body.orderToken;
  const deliveryDetails = req.body.deliveryDetails;
  const paymentDetails = req.body.paymentDetails;
  let decodedOrder;
  if (orderToken) {
    jwt.verify(
      orderToken,
      process.env.ORDER_JWT_SECRET,
      (err, decodedResult) => {
        if (err || !decodedResult) {
          const error = new Error('Invalid or Expired Order Token');
          error.statusCode = 401;
          throw error;
        } else {
          decodedOrder = decodedResult;
        }
      }
    );
    const order = new Order({
      customerId: decodedOrder.customerId,
      products: decodedOrder.products,
      totals: decodedOrder.totals,
      discounts: decodedOrder.discounts,
      delivery: deliveryDetails,
      payment: [{ ...paymentDetails }]
    });
    let createdOrder;
    order
      .save()
      .then(result => {
        if (!result) {
          const error = new Error('Order Failed to process, please try again');
          error.statusCode = 401;
          throw error;
        }
        createdOrder = result;
        if (decodedOrder.customerId) {
          return User.findById(decodedOrder.customerId);
        }
        return;
      })
      .then(user => {
        if (user) {
          user.orders.push(createdOrder._id);
          user.voucherCodes.push(
            ...decodedOrder.discounts.map(discount => discount.code)
          );
          return user.save();
        } else if (decodedOrder.customerId) {
          const error = new Error('Order Failed to process, please try again');
          error.statusCode = 401;
          throw error;
        }
        return true;
      })
      .then(async result => {
        if (!result) {
          const error = new Error('Order Failed to process, please try again');
          error.statusCode = 401;
          throw error;
        }
        const productsData = [];
        for (let product of createdOrder.products) {
          productsData.push({
            ...product._doc,
            data: await Product.findOne(
              { productSku: product.productSku },
              'productBrand productName productPrice'
            )
          });
        }

        const productsList = {
          html: productsData
            .map(
              product => `
            <tr>
            <td>
              <img src="${process.env.API_URL}/images/150x150/${
                product.productSku
              }" alt="" />
            </td>
              <td>
                <p style="margin: 0;">${product.data.productName}${
                product.size ? ' <small>- size: </small>' + product.size : ''
              }</p>
              <p style="margin: 0"><small>Sku: ${product.productSku}</small></p>
              </td>
              <td>£${product.data.productPrice}<small> each</small></td>
              <td>Qty: ${product.qty}</td>
              <td>£${product.price}</td>
            </tr>
          `
            )
            .join(''),
          string: productsData
            .map(
              product => `${product.data.productName}${
                product.size ? ' - size: ' + product.size : ''
              } - Sku: ${product.productSku}, £${
                product.data.productPrice
              } each x Qty: ${product.qty} = £${product.price}
        `
            )
            .join('\n')
        };

        const discountsList = {
          html: createdOrder.discounts
            .map(
              (discount, index) => `
            <tr>
              <td></td>
              <td></td>
              <td>${index === 0 ? 'Discounts:' : ''}</td>
              <td><small>"${discount.code}"</small></td>
              <td><small>${getDiscountFormat(
                discount.discountType,
                discount.discountValue
              )}</small></td>
            </tr>
          `
            )
            .join(''),
          string: createdOrder.discounts
            .map(
              (discount, index) => `
            ${index === 0 ? 'Discounts:' : ''}"${
                discount.code
              }" = ${getDiscountFormat(
                discount.discountType,
                discount.discountValue
              )}
          `
            )
            .join('\n')
        };

        const paymentList = {
          html: createdOrder.payment
            .map(
              pay => `
            <p style="margin: 0;">${
              pay.method.charAt(0).toUpperCase() + pay.method.slice(1)
            } Card: ******${pay.cardNum} - £${pay.amount.toFixed(2)}</p>
          `
            )
            .join(''),
          string: createdOrder.payment
            .map(
              pay => `
          ${
            pay.method.charAt(0).toUpperCase() + pay.method.slice(1)
          } Card: ******${pay.cardNum} - £${pay.amount.toFixed(2)}
        `
            )
            .join('\n')
        };

        const email = {
          html: `
          <html>
            <body>
              <h3>Munro Outdoor Retail</h3>
              <h1>Order Confirmation</h1>
              <p>Thank you for using Munro Outdoor Retail, don't forget it is a 
              fictional site so there is no order or payment.</p>
              <p>Your Order: <strong>${createdOrder.id}</strong></p>
              <table style="width: 100%; max-width: 600px; border: none;">
                ${productsList.html}
                <tr style="width: 100%; max-width: 600px;">
                <td></td>
                <td></td>
                <td></td>
                <td>Subtotal</td>
                <td>£${createdOrder.totals.subTotal}</td>
                </tr>
                ${discountsList.html}
                <tr>
                  <td style="vertical-align: top;">${
                    createdOrder.delivery.isDelivery
                      ? `Delivery to:`
                      : `Collect at:`
                  }</td>
                  <td colspan="2">
                  <p style="margin: 0;">${createdOrder.delivery.name}${
            !createdOrder.delivery.isDelivery ? ' Munro Outdoor Retail' : ''
          }</p>
                  <p style="margin: 0;">${createdOrder.delivery.address}, ${
            createdOrder.delivery.city
          }</p>
                  <p style="margin: 0;">${createdOrder.delivery.postcode}</p>
                  </td>
                  <td>${
                    createdOrder.delivery.isDelivery
                      ? `Delivery`
                      : `Click &amp; Collect`
                  }
                  </td>
                  <td>
                  ${
                    createdOrder.delivery.isDelivery &&
                    createdOrder.totals.subTotal < 60
                      ? `£5`
                      : `Free`
                  }
                  </td>
                </tr>
                <tr>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>Total:</td>
                  <td>£${createdOrder.totals.totalToPay.toFixed(2)}</td>
                </tr>
                <tr>
                  <td></td>
                  <td colspan="3">
                    <p style="margin: 0;">Thank you for your "Payment":</p>
                    ${paymentList.html}
                  </td>
                  <td></td>
                </tr>
                </table>
                <p>Enjoy!</p>
            </body>
          </html>
          `,
          string: `
            Order Confirmation\n
            Thank you for using Munro Outdoor Retail, don't forget it is a fictional site so there is no order or payment.\n\n
            Your Order: ${createdOrder.id}\n
            ${productsData.string}\n
            Subtotal: £${createdOrder.totals.subTotal}\n
            ${discountsList.string}\n
            ${
              createdOrder.delivery.isDelivery ? `Delivery to:` : `Collect at:`
            }\n
            ${createdOrder.delivery.name}${
            !createdOrder.delivery.isDelivery ? ' Munro Outdoor Retail' : ''
          }\n
            ${createdOrder.delivery.address}, ${createdOrder.delivery.city}\n
            ${createdOrder.delivery.postcode}\n
            ${
              createdOrder.delivery.isDelivery
                ? `Delivery:`
                : `Click &amp; Collect:`
            }\n
            ${
              createdOrder.delivery.isDelivery &&
              createdOrder.totals.subTotal < 60
                ? ` £5`
                : ` Free`
            }\n
            Total: £${createdOrder.totals.totalToPay.toFixed(2)}\n
            Thank you for your "Payment":\n
            ${paymentList.html}\n
            Enjoy!
          `
        };
        sendEmail(
          [deliveryDetails.email],
          `Munro Outdoor Retail, Order Confirmation ${createdOrder.id}`,
          email.html,
          email.string
        );
        res.status(200).json({ ...createdOrder });
      })
      .catch(err => {
        if (!err.statusCode) {
          err.statusCode = 500;
        }
        next(err);
      });
  }
};
