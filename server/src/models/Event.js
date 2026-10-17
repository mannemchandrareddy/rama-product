const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  event_type: { type: String, required: true, maxlength: 50 },
  user_id: { type: String, ref: 'User', default: null },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
  listing_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductListing', default: null },
  search_query: { type: String, maxlength: 500, default: null },
  metadata_json: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

eventSchema.index({ event_type: 1, created_at: -1 });

module.exports = mongoose.model('Event', eventSchema);
