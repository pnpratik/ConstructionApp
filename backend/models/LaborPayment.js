const mongoose = require('mongoose');

const laborPaymentSchema = new mongoose.Schema({
  contractor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  contractorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },
  month:          { type: String, required: true }, // 'YYYY-MM'
  daysPresent:    { type: Number, default: 0 },
  totalWorkers:   { type: Number, default: 0 }, // sum of presentCount for month
  dailyRate:      { type: Number, default: 0 }, // rate per worker-day at time of payment
  totalDue:       { type: Number, default: 0 },
  amount:         { type: Number, required: true },
  method:         { type: String, enum: ['cash', 'upi', 'cheque', 'neft', 'rtgs', 'other'], default: 'cash' },
  reference:      { type: String, default: '' }, // UTR, cheque no, UPI ref
  remarks:        { type: String, default: '' },
  paidBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  paidAt:         { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('LaborPayment', laborPaymentSchema);
