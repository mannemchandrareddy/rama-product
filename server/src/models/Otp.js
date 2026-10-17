const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: { type: String, required: true, index: true }, // email or mobile
  otp: { type: String, required: true },
  purpose: { type: String, enum: ['login', 'register', 'verification'], default: 'login' },
  name: { type: String, default: null },
  role: { type: String, enum: ['CUSTOMER', 'MERCHANT', 'ADMIN'], default: 'CUSTOMER' },
  expires_at: { type: Date, required: true, index: { expires: 0 } },
  verified: { type: Boolean, default: false },
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('Otp', otpSchema);
