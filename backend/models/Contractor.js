const mongoose = require('mongoose');

const contractorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'civil', 'plumbing', 'color', 'lift', 'electrical',
      'tile', 'acp', 'aluminium', 'door_lock'
    ],
    required: true
  },
  company: { type: String },
  license: { type: String },
  experience: { type: Number }, // years
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Contractor', contractorSchema);
