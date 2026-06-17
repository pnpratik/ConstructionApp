const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  category: {
    type: String,
    enum: ['civil','plumbing','electrical','tiles','acp','aluminium','doors','paint','material','labour','equipment','other'],
    required: true,
  },
  allocatedAmount: { type: Number, required: true, min: 0 },
  description:     { type: String },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// One entry per project+category
budgetSchema.index({ project: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
