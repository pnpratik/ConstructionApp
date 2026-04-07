const mongoose = require('mongoose');

const materialCalcSchema = new mongoose.Schema({
  materialName: String,
  category:     String,
  quantity:     Number,
  unit:         String,
}, { _id: false });

const drawingSchema = new mongoose.Schema({
  project:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  type: {
    type: String,
    enum: ['architectural', 'structural', 'plumbing', 'electrical', 'other'],
    required: true,
  },
  fileName:   { type: String, required: true },
  fileUrl:    { type: String, required: true },
  description: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ── Revision tracking ────────────────────────────────────────────────────
  revision:       { type: Number, default: 0 },     // 0 = initial, 1 = Rev 1 …
  revisionNote:   { type: String, default: '' },    // "Revised as per client feedback"
  parentDrawing:  { type: mongoose.Schema.Types.ObjectId, ref: 'Drawing', default: null },
  isLatest:       { type: Boolean, default: true }, // only latest shown in main list

  // ── Inputs saved at time of calculation ──────────────────────────────────
  inputs: {
    // Structural / Architectural
    floorArea:      Number,
    floors:         Number,
    wallLength:     Number,
    wallHeight:     Number,
    wallThickness:  Number,
    masonryType:    String,   // 'brick' | 'block'
    // Plumbing
    coldWaterPipeRuns: Number,
    hotWaterPipeRuns:  Number,
    drainPipeRuns:     Number,
    bathrooms:         Number,
    kitchens:          Number,
    // Electrical
    lightPoints:         Number,
    fanPoints:           Number,
    socketPoints:        Number,
    acPoints:            Number,
    totalCircuitLength:  Number,
    panels:              Number,
  },

  materialCalculations: [materialCalcSchema],

  status: {
    type: String,
    enum: ['uploaded', 'analyzed', 'approved'],
    default: 'uploaded',
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Drawing', drawingSchema);
