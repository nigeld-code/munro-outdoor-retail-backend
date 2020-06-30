const express = require('express');

const productsController = require('../controllers/products');

const router = express.Router();

router.get('/:category/:selection', productsController.getProducts);

module.exports = router;