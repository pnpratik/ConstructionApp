const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  location: { type: String, default: '' },
  storeType: {
    type: String,
    enum: ['open', 'closed', 'semi_open'],
    default: 'closed',
  },
  // Which material categories are stored here — used to match delivery order
  materialCategories: [{
    type: String,
    enum: [
      'steel', 'cement', 'brick_block', 'concrete_rmc', 'aggregate_sand',
      'plumbing_pipes_fittings', 'bath_fittings_ceramic', 'tiles_ceramic',
      'electrical_cables', 'electrical_accessories',
      'acp_panels', 'aluminium_glass', 'doors_locks', 'other',
    ],
  }],
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

  // ── CCTV Camera Configuration ─────────────────────────────────────────────
  camera: {
    enabled:         { type: Boolean, default: false },
    brand: {
      type: String,
      enum: ['hikvision', 'dahua', 'cpplus', 'axis', 'onvif', 'generic', 'none'],
      default: 'none',
    },
    ip:              { type: String, default: '' },
    port:            { type: Number, default: 80 },
    username:        { type: String, default: 'admin' },
    password:        { type: String, default: '' },
    channel:         { type: Number, default: 1 },
    snapshotUrl:     { type: String, default: '' }, // custom URL override
    // Last test result
    lastTestAt:      { type: Date },
    lastTestSuccess: { type: Boolean },
    lastTestError:   { type: String, default: '' },
  },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Store', storeSchema);
