const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
    productSku: {
      type: String,
      required: true
    },
    productName: {
      type: String,
      required: true
    },
    productImages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Image'
      }
    ],
    productDescription: {
      type: String
    },
    productPrice: {
      type: Number
    },
    breadcrumbs: [
      {
        type: String
      }
    ],
    tags: [
      {
        type: String
      }
    ],
    isLive: {
      type: Boolean
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
