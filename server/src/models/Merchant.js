const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  user_id: { type: String, ref: 'User', required: true, unique: true, index: true },
  business_name: { type: String, required: true, maxlength: 255 },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Merchant', merchantSchema);
