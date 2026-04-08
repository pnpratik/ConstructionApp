const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  order:         { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  uploadedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
  challanFile:   { type: String },       // file path
  challanNumber: { type: String },
  photos:        [{ type: String }],     // photo paths
  deliveredAt:   { type: Date, default: Date.now },
  receivedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  digitalSignature: { type: String },    // base64 or file path
  isConfirmed:   { type: Boolean, default: false },
  confirmedAt:   { type: Date },
  remarks:       { type: String },

  // ── CCTV Auto-Snapshot ──────────────────────────────────────────────────────
  // Captured automatically when challan is uploaded, based on material category
  storeSnapshot: {
    url:        { type: String },   // /uploads/snapshots/snap_xxx.jpg
    capturedAt: { type: Date },
    storeName:  { type: String },   // "Steel Yard"
    cameraIp:   { type: String },
    success:    { type: Boolean, default: false },
    error:      { type: String },   // populated if capture failed
  },
}, { timestamps: true });

module.exports = mongoose.model('Delivery', deliverySchema);
