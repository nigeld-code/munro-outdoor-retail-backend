const path = require('path');

const express = require('express');
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const productsRoutes = require('./routes/products');
const imagesRoutes = require('./routes/images');

const app = express();

app.use(express.json());

app.use(
  session({
    secret: process.env.ADMIN_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      url: process.env.DB_API_KEY
    })
  })
);

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(adminRoutes);
app.use('/auth', authRoutes);
app.use('/product', productRoutes);
app.use('/products', productsRoutes);
app.use('/images', imagesRoutes);

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

mongoose
  .connect(process.env.DB_API_KEY, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(() => {
    app.listen(8080);
  })
  .catch(err => console.log(err));
