const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order:    { type: mongoose.Schema.Types.ObjectId, ref: 'Order',   required: true },
  vendor:   { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor',  required: true },
  project:  { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },

  amount:   { type: Number, required: true },
  method:   {
    type: String,
    enum: ['upi', 'neft', 'rtgs', 'cheque', 'cash', 'other'],
    required: true,
  },

  // Reference numbers
  upiTransactionId: { type: String },   // UPI UTR
  chequeNumber:     { type: String },
  neftRef:          { type: String },
  otherRef:         { type: String },

  screenshot:  { type: String },         // /uploads/payments/xxx.jpg

  status:      { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },

  paidAt:      { type: Date, default: Date.now },
  paidBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt:  { type: Date },

  remarks:     { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
