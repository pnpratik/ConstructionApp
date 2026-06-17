const mongoose = require('mongoose');

const workScheduleSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  phase: {
    type: String,
    enum: ['foundation','structure','plumbing','electrical','tiles','finishing','painting','acp_aluminium','doors','handover','other'],
    required: true,
  },
  label:       { type: String },            // custom display name
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  progress:    { type: Number, default: 0, min: 0, max: 100 },
  status:      { type: String, enum: ['not_started','in_progress','completed','delayed','on_hold'], default: 'not_started' },
  assignedTo:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  notes:       { type: String },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('WorkSchedule', workScheduleSchema);
