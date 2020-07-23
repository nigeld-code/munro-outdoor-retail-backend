const express = require('express');

const authCheckNonBlock = require('../middleware/authCheckNonBlock');
const getBasketPrices = require('../middleware/getBasketPrices');
const saveAddress = require('../middleware/saveAddress');

const orderController = require('../controllers/order');

const router = express.Router();

router.post(
  '/setupOrder',
  authCheckNonBlock,
  saveAddress,
  getBasketPrices,
  orderController.postSetupOrder
);

module.exports = router;
