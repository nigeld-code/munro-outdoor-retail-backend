const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema(
  {
    imageURL: {
      type: String
    },
    thumbnailURL: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Image', imageSchema);
