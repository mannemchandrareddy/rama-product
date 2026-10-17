const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  price: { type: Number, required: true },
  mrp: { type: Number, default: null },
  stock_status: {
    type: String,
    enum: ['IN_STOCK', 'OUT_OF_STOCK', 'LIMITED', 'UNKNOWN'],
    default: 'UNKNOWN',
  },
  is_active: { type: Boolean, default: true },
  image_url: { type: String, maxlength: 1024, default: null },
  last_updated: { type: Date, default: Date.now },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

listingSchema.index({ product_id: 1, is_active: 1 });
listingSchema.index({ store_id: 1, is_active: 1 });

module.exports = mongoose.model('ProductListing', listingSchema);
