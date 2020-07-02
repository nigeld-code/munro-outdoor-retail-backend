const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: __dirname + '../.env' });
const { validationResult } = require('express-validator');

const Product = require('../models/product');
const Image = require('../models/image');
const Breadcrumb = require('../models/breadcrumb');
const { response } = require('express');

exports.getIndex = (req, res, next) => {
  res.render('index', {
    errorMessage: null
  });
};

exports.postAdmin = (req, res, next) => {
  const password = req.body.password;
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(422).render('index', {
      errorMessage: 'Incorrect Password'
    });
  }
  req.session.isLoggedIn = true;
  req.session.save(err => {
    err && console.log(err);
    res.status(200).redirect('/');
  });
};

exports.getSignout = (req, res, next) => {
  req.session.destroy(err => {
    err && console.log(err);
    res.redirect('/');
  });
};

exports.getImageLookup = (req, res, next) => {
  const IMAGES_PER_PAGE = 8;
  const imageType = req.params.imageType;
  const pageNumber = +req.params.pageNumber || 1;
  let idCount = null;
  Image.find()
    .countDocuments({ imageType })
    .then(count => {
      idCount = count || 1;
      return Image.find({ imageType }, '_id')
        .sort({ _id: -1 })
        .skip((pageNumber - 1) * IMAGES_PER_PAGE)
        .limit(IMAGES_PER_PAGE);
    })
    .then(result => {
      if (!result) {
        return res.status(401);
      }
      return res.status(200).json({
        totalCount: Math.ceil(idCount / IMAGES_PER_PAGE),
        images: result
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.status = 500;
      }
      next(err);
    });
};

exports.getAddProduct = (req, res, next) => {
  res.render('product/add-product', {
    errorMessage: null,
    oldInput: {}
  });
};

exports.postAddProduct = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(401).render('product/add-product', {
      errorMessage: errors.array(),
      oldInput: {
        oldProductId: req.body.productSku || '',
        oldProductBrand: req.body.productBrand || '',
        oldProductName: req.body.productName || '',
        oldProductPrice: req.body.productPrice || '',
        oldProductImages: req.body.productImages,
        oldProductIsLive: req.body.productIsLive || false
      }
    });
  }
  const productSku = req.body.productSku;
  const productBrand = req.body.productBrand;
  const productName = req.body.productName;
  const breadcrumbs = req.body.breadcrumbs.split(',');
  const productPrice = +req.body.productPrice;
  let productImages = req.body.productImages.split(', ');
  if (productImages[0] === '') {
    productImages = null;
  }
  let isLive = req.body.productIsLive;
  if (!isLive) isLive = false;
  const newProduct = new Product({
    productSku,
    productBrand,
    productName,
    breadcrumbs,
    productPrice,
    productImages: productImages,
    isLive
  });
  newProduct
    .save()
    .then(result => {
      if (result) {
        res.status(200).redirect('/');
      }
    })
    .catch(err => {
      if (!err.statusCode) {
        err.status = 500;
      }
      next(err);
    });
};

exports.getEditProduct = (req, res, next) => {
  res.render('product/edit-product', {
    searchProduct: true,
    errorMessage: null,
    product: null
  });
};

exports.postEditProduct = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(401).render('product/edit-product', {
      searchProduct: true,
      errorMessage: errors.array(),
      product: null
    });
  }
  const productSku = req.body.productSku;
  if (!productSku) {
    return res.status(422).render('product/edit-product', {
      searchProduct: true,
      errorMessage: 'Please enter a product SKU',
      product: null
    });
  }
  Product.findOne({ productSku })
    .then(product => {
      if (!product) {
        return res.status(400).render('product/edit-product', {
          searchProduct: true,
          errorMessage: 'Product SKU not found',
          product: null
        });
      }
      res.status(200).render('product/edit-product', {
        searchProduct: false,
        errorMessage: null,
        product
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.status = 500;
      }
      next(err);
    });
};

exports.postSendEditProduct = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let searchProduct = true;
    let errorMessage = 'Error: Product Failed to Save';
    let renderProduct = null;
    Product.findById(req.body.productId)
      .then(product => {
        if (product) {
          searchProduct = false;
          errorMessage = errors.array();
          renderProduct = product;
        }
      })
      .then(() => {
        return res.status(401).render('product/edit-product', {
          searchProduct,
          errorMessage,
          product: renderProduct
        });
      })
      .catch(err => {
        console.log(err);
        return res.status(500).redirect('/');
      });
  } else {
    const productId = req.body.productId;
    const editedProduct = {
      productSku: req.body.productSku,
      productBrand: req.body.productBrand,
      productName: req.body.productName,
      breadcrumbs: req.body.breadcrumbs.split(','),
      productPrice: req.body.productPrice,
      productImages: req.body.productImages,
      isLive: req.body.productIsLive
    };
    Product.findById(productId)
      .then(product => {
        if (!product) {
          return res.status(400).render('/editproduct', {
            searchProduct: true,
            errorMessage: 'Error: Product failed to save.',
            product: null
          });
        }
        product.productSku = editedProduct.productSku;
        product.productBrand = editedProduct.productBrand;
        product.productName = editedProduct.productName;
        product.breadcrumbs = editedProduct.breadcrumbs;
        product.productPrice = +editedProduct.productPrice;
        if (editedProduct.productImages === '') {
          product.productImages = null;
        } else {
          product.productImages = editedProduct.productImages.split(', ');
        }
        product.isLive = editedProduct.isLive;
        return product.save();
      })
      .then(result => {
        if (!result) {
          return res.status(422).render('/editproduct', {
            searchProduct: true,
            errorMessage: 'Error: Product failed to save',
            product: null
          });
        }
        res.status(200).redirect('/');
      })
      .catch(err => {
        if (!err.statusCode) {
          err.status = 500;
        }
        next(err);
      });
  }
};

exports.getRemoveProduct = (req, res, next) => {
  res.render('product/remove-product', {
    searchProduct: true,
    errorMessage: null,
    product: null
  });
};

exports.postRemoveProduct = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(401).render('product/remove-product', {
      searchProduct: true,
      errorMessage: errors.array()[0].msg,
      product: null
    });
  }
  const productSku = req.body.productSku;
  Product.findOne({ productSku }).then(product => {
    if (!product) {
      return res.status(401).render('product/remove-product', {
        searchProduct: true,
        errorMessage: 'Product Sku not found in DB',
        product: null
      });
    }
    res.status(200).render('product/remove-product', {
      searchProduct: false,
      errorMessage: null,
      product
    });
  });
};

exports.postSendRemoveProduct = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(401).render('product/remove-product', {
      searchProduct: true,
      errorMessage: errors.array()[0].msg,
      product: null
    });
  }
  const productId = req.body.productId;
  Product.findByIdAndRemove(productId)
    .then(result => {
      if (!result) {
        res.status(400).render('product/remove-product', {
          searchProduct: true,
          errorMessage: 'Error: failed to remove Product from DB',
          product: null
        });
      }
      res.status(200).redirect('/');
    })
    .catch(err => {
      console.log(err);
      res.status(500).redirect('/');
    });
};

exports.getImage = (req, res, next) => {
  res.render('image/image', {
    action: null,
    errorMessage: null,
    successMessage: null
  });
};

exports.postImage = (req, res, next) => {
  const action = req.body.action;
  res.status(200).render('image/image', {
    action,
    errorMessage: null,
    successMessage: null
  });
};

exports.postAddImage = async (req, res, next) => {
  if (!req.body.images) {
    return res.status(422).render('image/image', {
      action: 'add',
      errorMessage: 'Please select an image file to upload',
      successMessage: null
    });
  }
  const imageUploadErrors = [];
  const imageUploadSuccess = [];
  await Promise.all(
    req.body.images.map(async imageObj => {
      const newImage = new Image({
        imageType: req.body.imageType,
        image150x150Url: imageObj.image150x150Url,
        image300x300Url: imageObj.image300x300Url,
        image850x850Url: imageObj.image850x850Url,
        image1200x560Url: imageObj.image1200x560Url,
        image1200x100Url: imageObj.image1200x100Url,
        image600x300Url: imageObj.image600x300Url
      });
      const result = await newImage.save();
      if (!result) {
        imageUploadErrors.push(imageObj.type);
      } else {
        imageUploadSuccess.push(result.id);
      }
    })
  );
  return res.status(200).render('image/image', {
    action: 'add',
    errorMessage: imageUploadErrors.length
      ? `Failed to upload ${imageUploadErrors}`
      : null,
    successMessage: imageUploadSuccess.length
      ? `${imageUploadSuccess} successfully uploaded to Server`
      : null
  });
};

exports.postRemoveImage = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return res.status(401).render('image/image', {
      action: null,
      errorMessage: errors.array()[0].msg,
      successMessage: null
    });
  }
  const images = req.body.images.split(', ');
  await Promise.all(
    images.map(async imageId => {
      try {
        const imageObj = await Image.findByIdAndRemove(imageId);
        for (let [key, value] of Object.entries(imageObj._doc)) {
          if (key.endsWith('Url') && value) {
            const imgPath = path.join(__dirname, '../images', value);
            await fs.access(imgPath, fs.F_OK, async err => {
              if (err) throw err;
              await fs.unlink(imgPath, err => {
                if (err) throw err;
                console.log(`${value} was deleted from Server`);
              });
            });
          }
        }
      } catch (error) {
        console.log(error);
        res.status(500).redirect('/');
      }
    })
  ).then(() => {
    res.status(200).render('image/image', {
      action: null,
      errorMessage: null,
      successMessage: null
    });
  });
};

exports.getBreadcrumb = (req, res, next) => {
  res.render('breadcrumb/breadcrumb', {
    errorMessage: null
  });
};

exports.postBreadcrumb = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(401).render('breadcrumb/breadcrumb', {
      errorMessage: errors.array()[0].msg
    });
  }
  const breadcrumbTitle = req.body.title;
  let breadcrumbParent = req.body.finalParent;
  if (breadcrumbParent === '_') breadcrumbParent = null;
  const newBreadcrumb = new Breadcrumb({
    title: breadcrumbTitle,
    parent: breadcrumbParent
  });
  newBreadcrumb
    .save()
    .then(result => {
      if (!result) {
        return;
      }
      if (breadcrumbParent) {
        return Breadcrumb.findByIdAndUpdate(breadcrumbParent, {
          $push: { children: result._id }
        });
      }
      return;
    })
    .then(() => {
      res.status(200).render('breadcrumb/breadcrumb', {
        errorMessage: null
      });
    })
    .catch(err => {
      console.log(err);
      res.status(500).redirect('/');
    });
};

exports.getBreadcrumbOptions = (req, res, next) => {
  const parent = req.params.parent;
  if (parent === '_') {
    Breadcrumb.find({ parent: null })
      .then(options => {
        return res.status(200).json({
          options
        });
      })
      .catch(err => {
        res.status(500).redirect('/');
      });
  } else {
    Breadcrumb.findById(parent)
      .populate('children')
      .then(breadcrumb => {
        if (!breadcrumb) {
          return res.status(401).redirect('/');
        }
        if (breadcrumb.children.length) {
          return res.status(200).json({
            options: breadcrumb.children
          });
        }
        return res.status(200).json({
          options: null
        });
      })
      .catch(err => {
        res.status(500).redirect('/');
      });
  }
};
