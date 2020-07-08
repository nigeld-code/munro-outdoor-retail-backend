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
      .withMessage('Please enter a Product Name'),
    body('productDescription').trim(),
    body('productBrand')
      .trim()
      .notEmpty()
      .withMessage('Please enter a Product Brand'),
    body('productPrice')
      .trim()
      .notEmpty()
      .withMessage('Please enter a Product Price')
      .isNumeric()
      .withMessage('Product Price must be a number'),
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
      }),
    body('productTags').trim()
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
    body('productBrand')
      .trim()
      .notEmpty()
      .withMessage('Please enter a Product Brand'),
    body('productName')
      .trim()
      .notEmpty()
      .withMessage('Please enter a Product Name'),
    body('productDescription').trim(),
    body('productPrice')
      .trim()
      .notEmpty()
      .withMessage('Please enter a Product Price')
      .isNumeric()
      .withMessage('Product Price must be a number'),
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
      }),
    body('productTags').trim()
  ],
  adminController.postSendEditProduct
);

router.get('/removeproduct', adminAuthCheck, adminController.getRemoveProduct);

router.post(
  '/removeproduct',
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
  adminController.postRemoveProduct
);

router.post(
  '/sendremoveproduct',
  adminAuthCheck,
  express.urlencoded({ extended: true }),
  [
    body('removeConfirm')
      .equals('Remove')
      .withMessage(
        'Product not removed, correct input required to confirm removing the product from the DB'
      ),
    body('productId')
      .notEmpty()
      .withMessage('Remove Product requires a product ID')
  ],
  adminController.postSendRemoveProduct
);

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

router.post(
  '/removeimage',
  adminAuthCheck,
  express.urlencoded({ extended: true }),
  [
    body('removeConfirm')
      .equals('Remove')
      .withMessage(
        'Image not removed, correct input required to confirm removing the image from the DB'
      ),
    body('images')
      .trim()
      .notEmpty()
      .withMessage('No Images selected to be removed')
      .custom(value => {
        let hasErrors = false;
        value.split(', ').forEach(id => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            hasErrors = true;
          }
        });
        if (hasErrors) {
          return Promise.reject('Removing images only accepts valid IDs');
        } else {
          return Promise.resolve();
        }
      })
  ],
  adminController.postRemoveImage
);

router.get('/breadcrumbs', adminAuthCheck, adminController.getBreadcrumb);

router.post(
  '/breadcrumbs',
  adminAuthCheck,
  express.urlencoded({ extended: true }),
  [body('title').trim().notEmpty().withMessage('Please enter a Title')],
  adminController.postBreadcrumb
);

router.get(
  '/breadcrumbOptions/:parent',
  adminAuthCheck,
  adminController.getBreadcrumbOptions
);

module.exports = router;
