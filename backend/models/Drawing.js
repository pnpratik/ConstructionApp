const mongoose = require('mongoose');

const materialCalcSchema = new mongoose.Schema({
  materialName: String,
  category: String,
  quantity: Number,
  unit: String
}, { _id: false });

const drawingSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  type: {
    type: String,
    enum: ['architectural', 'structural', 'plumbing', 'electrical', 'other'],
    required: true
  },
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  description: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Inputs for material estimation
  inputs: {
    // Structural/Architectural
    floorArea: Number,        // sqft
    floors: Number,
    wallLength: Number,       // meters
    wallHeight: Number,       // meters
    wallThickness: Number,    // inches (4.5 or 9)
    // Plumbing
    coldWaterPipeRuns: Number,  // meters
    hotWaterPipeRuns: Number,   // meters
    drainPipeRuns: Number,      // meters
    bathrooms: Number,
    kitchens: Number,
    // Electrical
    lightPoints: Number,
    fanPoints: Number,
    socketPoints: Number,
    acPoints: Number,
    totalCircuitLength: Number, // meters
    panels: Number
  },
  materialCalculations: [materialCalcSchema],
  status: {
    type: String,
    enum: ['uploaded', 'analyzed', 'approved'],
    default: 'uploaded'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Drawing', drawingSchema);
