const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: [
      'steel', 'brick', 'block', 'concrete', 'cement',
      'pipe', 'fitting', 'bath_fittings', 'ceramic_tiles',
      'cable', 'switch', 'electrical_accessories',
      'tiles', 'acp_panel', 'aluminium', 'doors_locks',
      'paint', 'chemical', 'other'
    ],
    required: true
  },
  unit: {
    type: String,
    enum: ['kg', 'ton', 'nos', 'meter', 'sqft', 'sqm', 'cft', 'bag', 'liter', 'set', 'box'],
    required: true
  },
  currentStock: { type: Number, default: 0 },
  minStock: { type: Number, default: 0 },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Material', materialSchema);
