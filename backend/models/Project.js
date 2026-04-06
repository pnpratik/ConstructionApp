const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String },
  location: { type: String, required: true },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'on_hold'],
    default: 'planning'
  },
  budget: { type: Number, default: 0 },
  startDate: { type: Date },
  expectedEndDate: { type: Date },
  assignedEngineers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedContractors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Project', projectSchema);
