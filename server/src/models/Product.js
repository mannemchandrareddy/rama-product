const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
  name: { type: String, required: true, maxlength: 255 },
  brand: { type: String, maxlength: 255, default: null, index: true },
  model: { type: String, maxlength: 255, default: null },
  description: { type: String, default: null },
  image_url: { type: String, maxlength: 512, default: null },
  search_keywords: { type: String, default: null },
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

productSchema.index({ name: 1, brand: 1 });
productSchema.index({ name: 'text', brand: 'text', search_keywords: 'text' });

module.exports = mongoose.model('Product', productSchema);
