const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema(
  {
    imageType: {
      type: String,
      required: true
    },
    image150x150Url: {
      type: String
    },
    image300x300Url: {
      type: String
    },
    image850x850Url: {
      type: String
    },
    image1200x560Url: {
      type: String
    },
    image1200x100Url: {
      type: String
    },
    image600x300Url: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Image', imageSchema);
