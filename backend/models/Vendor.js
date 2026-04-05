const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  address: { type: String },
  gst: { type: String },
  materialCategories: [{
    type: String,
    enum: [
      'steel', 'brick_block', 'concrete_rmc', 'cement',
      'plumbing_pipes_fittings', 'bath_fittings_ceramic',
      'electrical_cables', 'electrical_accessories',
      'tiles_ceramic', 'acp_panels', 'aluminium_glass',
      'doors_locks', 'paint_chemicals', 'other'
    ]
  }],
  contactPerson: { type: String },
  bankDetails: {
    bankName: String,
    accountNo: String,
    ifsc: String
  },
  isActive: { type: Boolean, default: true },
  linkedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
