const mongoose = require('mongoose');

const materialRequirementSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  materialName: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  totalRequired: { type: Number, default: 0 },
  totalOrdered: { type: Number, default: 0 },
  totalDelivered: { type: Number, default: 0 },
  fromDrawing: { type: mongoose.Schema.Types.ObjectId, ref: 'Drawing' },
  notes: { type: String }
}, { timestamps: true });

// Virtual: remaining to order
materialRequirementSchema.virtual('remaining').get(function () {
  return Math.max(0, this.totalRequired - this.totalOrdered);
});

materialRequirementSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('MaterialRequirement', materialRequirementSchema);
