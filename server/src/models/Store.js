const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  merchant_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Merchant', required: true, index: true },
  name: { type: String, required: true, maxlength: 255 },
  phone: { type: String, maxlength: 20, default: null },
  description: { type: String, default: null },
  address: { type: String, maxlength: 500, default: null },
  village: { type: String, maxlength: 255, default: null },
  town: { type: String, maxlength: 255, default: null },
  city: { type: String, maxlength: 255, default: null },
  district: { type: String, maxlength: 255, default: null },
  state: { type: String, maxlength: 255, default: null },
  pincode: { type: String, maxlength: 10, default: null, index: true },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  image_url: { type: String, maxlength: 512, default: null },
  is_active: { type: Boolean, default: true },
  opening_time: { type: String, default: '07:00' },
  closing_time: { type: String, default: '22:30' },
  rating: { type: Number, default: 4.7 },
  rating_count: { type: Number, default: 48 },
  whatsapp_number: { type: String, default: null },
  approval_status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING',
    index: true,
  },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Store', storeSchema);
