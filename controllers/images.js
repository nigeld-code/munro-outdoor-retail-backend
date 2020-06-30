const path = require('path');

const Image = require('../models/image');

exports.getImageId = (req, res, next) => {
  const imageSize = req.params.size;
  const imageId = req.params.id;
  Image.findById(imageId)
    .then(image => {
      if (!image) {
        const error = new Error('Failed to find image in DB');
        error.statusCode = 404;
        throw error;
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
