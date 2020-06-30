const sharp = require('sharp');
const { uuid } = require('uuidv4');

module.exports = async (req, res, next) => {
  const imageType = req.body.imageType;

  if (!req.files || !imageType) return next();

  const uniqueFilename = () => uuid() + '.jpeg';

  req.body.images = [];

  await Promise.all(
    req.files.map(async file => {
      const filenames = {
        image150x150: imageType === 'productImages' ? uniqueFilename() : null,
        image300x300: imageType === 'productImages' ? uniqueFilename() : null,
        image850x850: imageType === 'productImages' ? uniqueFilename() : null,
        image1200x560:
          imageType === 'slideshowImages' ? uniqueFilename() : null,
        image1200x100: imageType === 'bannerImages' ? uniqueFilename() : null,
        image600x300: imageType === 'homeTileImages' ? uniqueFilename() : null
      };
      if (imageType === 'productImages') {
        await sharp(file.buffer)
          .resize(150, 150)
          .toFormat('jpeg')
          .toFile(`images/${filenames.image150x150}`);
        await sharp(file.buffer)
          .resize(300, 300)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`images/${filenames.image300x300}`);
        await sharp(file.buffer)
          .resize(850, 850)
          .toFormat('jpeg')
          .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
          .toFile(`images/${filenames.image850x850}`);
      } else if (imageType === 'slideshowImages') {
        await sharp(file.buffer)
          .resize(1200, 560)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`images/${filenames.image1200x560}`);
      } else if (imageType === 'bannerImages') {
        await sharp(file.buffer)
          .resize(1200, 100)
          .toFormat('jpeg')
          .toFile(`images/${filenames.image1200x100}`);
      } else if (imageType === 'homeTileImages') {
        await sharp(file.buffer)
          .resize(600, 300)
          .toFormat('jpeg')
          .toFile(`images/${filenames.image600x300}`);
      }
      req.body.images.push({
        image150x150Url: filenames.image150x150,
        image300x300Url: filenames.image300x300,
        image850x850Url: filenames.image850x850,
        image1200x560Url: filenames.image1200x560,
        image1200x100Url: filenames.image1200x100,
        image600x300Url: filenames.image600x300
      });
    })
  );
  next();
};
