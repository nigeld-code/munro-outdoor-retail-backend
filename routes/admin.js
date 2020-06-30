const express = require('express');
const { body } = require('express-validator');
const mongoose = require('mongoose');

const adminController = require('../controllers/admin');
const adminAuthCheck = require('../middleware/adminAuthCheck');

const uploadImages = require('../middleware/uploadImages');
const resizeImages = require('../middleware/resizeImages');

const Product = require('../models/product');
const Image = require('../models/image');

const router = express.Router();

router.get('/', adminController.getIndex);

router.post(
  '/',
  express.urlencoded({ extended: true }),
  adminController.postAdmin
);

router.get('/signout', adminAuthCheck, adminController.getSignout);

router.get(
  '/imageLookup/:imageType/:pageNumber',
  adminAuthCheck,
  adminController.getImageLookup
);

router.get('/addproduct', adminAuthCheck, adminController.getAddProduct);

router.post(
  '/addproduct',
  adminAuthCheck,
  express.urlencoded({ extended: true }),
  [
    body('productSku')
      .trim()
      .notEmpty()
      .withMessage('Please Enter a Product Sku')
      .isNumeric()
      .withMessage('Product Sku must be numeric')
      .isLength({ min: 5, max: 5 })
      .withMessage('Product Sku must have 5 characters length')
      .custom(value => {
        return Product.findOne({ productSku: value }).then(skuExists => {
          if (skuExists) {
            return Promise.reject('Product Sku already registered');
          }
        });
      }),
    body('productName')
      .trim()
      .notEmpty()
      .withMessage('Please Enter a Product Name'),
    body('productImages')
      .trim()
      .custom(value => {
        if (!value.length) {
          return Promise.resolve();
        }
        let hasErrors = false;
        value.split(', ').forEach(id => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            hasErrors = true;
          }
        });
        if (hasErrors) {
          return Promise.reject('Product Images only accepts valid IDs');
        } else {
          return Promise.resolve();
        }
      })
      .custom(async value => {
        if (!value.length) {
          return Promise.resolve();
        }
        const images = value.split(', ');
        let hasErrors = false;
        await Promise.all(
          images.map(async id => {
            try {
              const result = await Image.findById(id);
              if (!result) {
                hasErrors = true;
              }
            } catch (err) {
              console.log(err);
            }
          })
        );
        if (hasErrors) {
          return Promise.reject(
            'One or more of the Image IDs cannot be found on DB'
          );
        }
      })
  ],
  adminController.postAddProduct
);

router.get('/editproduct', adminAuthCheck, adminController.getEditProduct);

router.post(
  '/editproduct',
  adminAuthCheck,
  express.urlencoded({ extended: true }),
  [
    body('productSku')
      .trim()
      .notEmpty()
      .withMessage('Please Enter a Product Sku')
      .isNumeric()
      .withMessage('Product Sku must be numeric')
      .isLength({ min: 5, max: 5 })
      .withMessage('Product Sku must have 5 characters length')
  ],
  adminController.postEditProduct
);

router.post(
  '/sendeditproduct',
  adminAuthCheck,
  express.urlencoded({ extended: true }),
  [
    body('productSku')
      .trim()
      .notEmpty()
      .withMessage('Please Enter a Product Sku')
      .isNumeric()
      .withMessage('Product Sku must be numeric')
      .isLength({ min: 5, max: 5 })
      .withMessage('Product Sku must have 5 characters length')
      .custom((value, { req }) => {
        return Product.findOne({ productSku: value }).then(skuExists => {
          if (skuExists) {
            if (skuExists.id === req.body.productId) {
              return Promise.resolve();
            }
            return Promise.reject(
              'Product Sku not available, as it is already in use'
            );
          }
        });
      }),
    body('productName')
      .trim()
      .notEmpty()
      .withMessage('Please Enter a Product Name'),
    body('productImages')
      .trim()
      .custom(value => {
        if (!value.length) {
          return Promise.resolve();
        }
        let hasErrors = false;
        value.split(', ').forEach(id => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            hasErrors = true;
          }
        });
        if (hasErrors) {
          return Promise.reject('Product Images only accepts valid IDs');
        } else {
          return Promise.resolve();
        }
      })
      .custom(async value => {
        if (!value.length) {
          return Promise.resolve();
        }
        const images = value.split(', ');
        let hasErrors = false;
        await Promise.all(
          images.map(async id => {
            try {
              const result = await Image.findById(id);
              if (!result) {
                hasErrors = true;
              }
            } catch (err) {
              console.log(err);
            }
          })
        );
        if (hasErrors) {
          return Promise.reject(
            'One or more of the Image IDs cannot be found on DB'
          );
        }
      })
  ],
  adminController.postSendEditProduct
);

router.get('/removeproduct', adminAuthCheck, adminController.getRemoveProduct);

router.get('/image', adminAuthCheck, adminController.getImage);

router.post(
  '/image',
  adminAuthCheck,
  express.urlencoded({ extended: true }),
  adminController.postImage
);

router.post(
  '/addimage',
  adminAuthCheck,
  express.urlencoded({ extended: true }),
  uploadImages,
  resizeImages,
  adminController.postAddImage
);

module.exports = router;