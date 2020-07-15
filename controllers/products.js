const Product = require('../models/product');
const Breadcrumb = require('../models/breadcrumb');

const checkGetBreadcrumb = async thisCategory => {
  try {
    const breadcrumbSearch = await Breadcrumb.findById(thisCategory);
    return breadcrumbSearch;
  } catch (err) {
    return;
  }
};

exports.getProducts = async (req, res, next) => {
  const category = req.params.category;
  const selection = req.params.selection || null;
  const findObj = { isLive: true };
  const breadcrumbsArr = [];
  let currentBreadcrumbId = category;
  let foundAllParentBreadcrumbs = false;
  if (category && category !== '_') {
    while (!foundAllParentBreadcrumbs) {
      const thisBreadcrumb = await checkGetBreadcrumb(currentBreadcrumbId);
      if (thisBreadcrumb) {
        breadcrumbsArr.unshift(thisBreadcrumb);
        if (thisBreadcrumb.parent) {
          currentBreadcrumbId = thisBreadcrumb.parent;
        } else {
          foundAllParentBreadcrumbs = true;
        }
      } else {
        foundAllParentBreadcrumbs = true;
      }
    }
    findObj.breadcrumbs = {
      $in: [category]
    };
  }
  if (selection && selection !== 'undefined') {
    findObj.tags = {
      $all: selection.split('&')
    };
  }
  let products = [];
  let allBrands = [];
  Product.find(findObj)
    .sort({ _id: -1 })
    .then(productsArr => {
      products = productsArr;
      const alreadyHaveCheckBrand = new Map();
      let allBreadcrumbs = [];
      const alreadyHaveCheckBreadcrumb = new Map();
      productsArr.forEach(product => {
        if (!alreadyHaveCheckBrand.has(product.productBrand)) {
          alreadyHaveCheckBrand.set(product.productBrand, true);
          allBrands.push({
            brand: product.productBrand,
            qty: 1
          });
        } else {
          const existingBrandIndex = allBrands.findIndex(
            brandObj => brandObj.brand === product.productBrand
          );
          allBrands[existingBrandIndex] = {
            ...allBrands[existingBrandIndex],
            qty: allBrands[existingBrandIndex].qty + 1
          };
        }
        product.breadcrumbs.forEach((breadcrumbId, index) => {
          if (!alreadyHaveCheckBreadcrumb.has(breadcrumbId._id.toString())) {
            alreadyHaveCheckBreadcrumb.set(breadcrumbId._id.toString(), true);
            allBreadcrumbs.push({
              breadcrumbId: breadcrumbId._id.toString(),
              level: index,
              qty: 1
            });
          } else {
            const existingBreadcrumbIndex = allBreadcrumbs.findIndex(
              breadcrumbObj =>
                breadcrumbObj.breadcrumbId === breadcrumbId._id.toString()
            );
            allBreadcrumbs[existingBreadcrumbIndex] = {
              ...allBreadcrumbs[existingBreadcrumbIndex],
              qty: allBreadcrumbs[existingBreadcrumbIndex].qty + 1
            };
          }
        });
      });

      return Promise.all(
        allBreadcrumbs.map(async breadcrumbObj => {
          let breadcrumbTitle = await checkGetBreadcrumb(
            breadcrumbObj.breadcrumbId
          );
          return {
            ...breadcrumbObj,
            title: breadcrumbTitle.title,
            parent: breadcrumbTitle.parent
          };
        })
      );
    })
    .then(breadcrumbOptions => {
      allBrands.sort((a, b) => b.qty - a.qty);
      breadcrumbOptions.sort((a, b) => b.qty - a.qty);
      res.status(200).json({
        products,
        breadcrumbs: breadcrumbsArr,
        brands: allBrands,
        breadcrumbOptions
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
