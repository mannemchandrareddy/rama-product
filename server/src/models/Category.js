const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, maxlength: 255 },
  slug: { type: String, required: true, unique: true, index: true, maxlength: 255 },
  description: { type: String, default: null },
  image_url: { type: String, maxlength: 512, default: null },
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Category', categorySchema);