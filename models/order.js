const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    products: [
      {
        productSku: {
          type: String,
          required: true
        },
        size: {
          type: String
        },
        price: {
          type: Number,
          required: true
        },
        qty: {
          type: Number,
          required: true
        }
      }
    ],
    totals: {
      subTotal: {
        type: Number,
        required: true
      },
      totalToPay: {
        type: Number,
        required: true
      }
    },
    payment: [
      {
        method: {
          type: String,
          required: true
        },
        cardNum: {
          type: String,
          required: true
        },
        amount: {
          type: Number,
          required: true
        }
      }
    ],
    discounts: [
      {
        code: {
          type: String,
          required: true
        },
        discountType: {
          type: String,
          required: true
        },
        discountValue: {
          type: Number,
          required: true
        }
      }
    ],
    delivery: {
      isDelivery: {
        type: Boolean,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      email: {
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
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Order', orderSchema);
