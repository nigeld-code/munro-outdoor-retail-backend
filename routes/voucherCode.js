const express = require('express');

const authCheckNonBlock = require('../middleware/authCheckNonBlock');
const getBasketPrices = require('../middleware/getBasketPrices');

const voucherCodeController = require('../controllers/voucherCode');

const router = express.Router();

router.post(
  '/checkCode',
  authCheckNonBlock,
  getBasketPrices,
  voucherCodeController.postCheckCode
);

router.post(
  '/autoCheckCodes',
  authCheckNonBlock,
  getBasketPrices,
  voucherCodeController.postAutoCheckCodes
);

module.exports = router;
