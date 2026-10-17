const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  user_id: { type: String, ref: 'User', default: null, index: true },
  store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  listing_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductListing', default: null },
  report_type: {
    type: String,
    enum: ['WRONG_PRICE', 'OUT_OF_STOCK', 'WRONG_ADDRESS', 'STORE_CLOSED', 'WRONG_PRODUCT', 'OTHER'],
    required: true,
  },
  description: { type: String, maxlength: 2000, default: null },
  status: {
    type: String,
    enum: ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'],
    default: 'OPEN',
    index: true,
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Report', reportSchema);
