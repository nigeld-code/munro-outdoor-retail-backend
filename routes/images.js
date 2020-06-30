const express = require('express');

const imagesController = require('../controllers/images');

const router = express.Router();

router.get('/:size/:id', imagesController.getImageId);

module.exports = router;
