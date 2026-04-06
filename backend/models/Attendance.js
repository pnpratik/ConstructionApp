const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  date: {
    type: String, // 'YYYY-MM-DD' for easy daily grouping
    required: true,
  },
  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  contractorName:    { type: String, required: true },
  contractorType:    { type: String }, // civil, plumbing, etc.
  contractorCompany: { type: String },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  presentCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  note: { type: String, trim: true },
}, { timestamps: true });

// One entry per contractor per date per project
attendanceSchema.index({ date: 1, contractor: 1, project: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
