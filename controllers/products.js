const Product = require('../models/product');
const Breadcrumb = require('../models/breadcrumb');

const checkGetParentBreadcrumb = async thisCategory => {
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
      const thisBreadcrumb = await checkGetParentBreadcrumb(
        currentBreadcrumbId
      );
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
  Product.find(findObj)
    .then(products => {
      res.status(200).json({
        products,
        breadcrumbs: breadcrumbsArr
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
