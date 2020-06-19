const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema(
  {
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
      type: Number,
      required: true
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
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
