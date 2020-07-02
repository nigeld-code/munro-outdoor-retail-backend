const path = require('path');

const Image = require('../models/image');

exports.getImageId = (req, res, next) => {
  const imageSize = req.params.size;
  const imageId = req.params.id;
  Image.findById(imageId)
    .then(image => {
      if (!image) {
        return res.status(404).sendFile(path.join(__dirname, '../images/c5babc63-0438-415b-9772-43cb5906b2f3.jpeg'))
      }
      if (imageSize !== '_') {
        res
          .status(200)
          .sendFile(
            path.join(__dirname, '../images', image[`image${imageSize}Url`])
          );
      } else {
        switch (image.imageType) {
          case 'productImages':
            return res
              .status(200)
              .sendFile(
                path.join(__dirname, '../images', image.image150x150Url)
              );
          case 'slideshowImages':
            return res
              .status(200)
              .sendFile(
                path.join(__dirname, '../images', image.image1200x560Url)
              );
          case 'bannerImages':
            return res
              .status(200)
              .sendFile(
                path.join(__dirname, '../images', image.image1200x100Url)
              );
          case 'homeTileImages':
            return res
              .status(200)
              .sendFile(
                path.join(__dirname, '../images', image.image600x300Url)
              );
        }
      }
    })
    .catch(err => {
      if (!err.statusCode) {
        err.status = 500;
      }
      next(err);
    });
};
