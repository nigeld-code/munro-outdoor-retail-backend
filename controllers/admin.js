require('dotenv').config({ path: __dirname + '../.env' });

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

exports.getAddProduct = (req, res, next) => {
  res.render('product/add-product');
};

exports.getEditProduct = (req, res, next) => {
  res.render('product/edit-product');
};

exports.getRemoveProduct = (req, res, next) => {
  res.render('product/remove-product');
};
