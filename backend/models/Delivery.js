const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challanFile: { type: String },       // file path
  challanNumber: { type: String },
  photos: [{ type: String }],           // photo paths
  deliveredAt: { type: Date, default: Date.now },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  digitalSignature: { type: String },   // base64 or file path
  isConfirmed: { type: Boolean, default: false },
  confirmedAt: { type: Date },
  remarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
