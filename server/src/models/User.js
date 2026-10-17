const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Supabase Auth UUID or custom UUID/ID
  name: { type: String, required: true, maxlength: 255 },
  email: { type: String, required: true, unique: true, index: true, maxlength: 320 },
  password_hash: { type: String, default: null },
  phone: { type: String, maxlength: 20, default: null },
  role: { type: String, enum: ['CUSTOMER', 'MERCHANT', 'ADMIN'], default: 'CUSTOMER', index: true },
  avatar_url: { type: String, maxlength: 512, default: null },
  is_active: { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('User', userSchema);

