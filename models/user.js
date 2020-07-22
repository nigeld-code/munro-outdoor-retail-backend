const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      require: true
    },
    password: {
      type: String,
      required: true
    },
    voucherCodes: [{ type: String, required: true }],
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
      }
    ],
    savedAddress: {
      name: {
        type: String,
        required: true
      },
      address: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      postcode: {
        type: String,
        required: true
      }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
