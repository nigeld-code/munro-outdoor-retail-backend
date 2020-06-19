const express = require('express');

const adminController = require('../controllers/admin');
const adminAuthCheck = require('../middleware/adminAuthCheck');

const router = express.Router();

router.get('/', adminController.getIndex);

router.post(
  '/',
  express.urlencoded({ extended: true }),
  adminController.postAdmin
);

router.get('/signout', adminAuthCheck, adminController.getSignout);

router.get('/addproduct', adminAuthCheck, adminController.getAddProduct);

router.get('/editproduct', adminAuthCheck, adminController.getEditProduct);

router.get('/removeproduct', adminAuthCheck, adminController.getRemoveProduct);

module.exports = router;
