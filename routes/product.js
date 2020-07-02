const express = require('express');

const productController = require('../controllers/product');

const router = express.Router();

router.get('/:sku', productController.getProduct);

module.exports = router;