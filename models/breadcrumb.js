const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const breadcrumbSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  parent: {
    type: Schema.Types.ObjectId
  },
  children: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Breadcrumb'
    }
  ]
});

module.exports = mongoose.model('Breadcrumb', breadcrumbSchema);