const mongoose = require('mongoose');

const sitePhotoSchema = new mongoose.Schema({
  project:    { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  url:        { type: String, required: true },
  floor:      { type: String },       // e.g. "Ground", "1st", "Terrace"
  workType:   { type: String },       // e.g. "Civil", "Electrical", "Plumbing"
  caption:    { type: String },
  takenAt:    { type: Date, default: Date.now },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags:       [String],
}, { timestamps: true });

module.exports = mongoose.model('SitePhoto', sitePhotoSchema);
