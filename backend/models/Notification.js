const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: [
      'order_created', 'order_approved', 'order_rejected',
      'order_sent_to_vendor', 'vendor_accepted', 'vendor_rejected',
      'order_dispatched', 'order_delivered',
      'material_low_stock', 'drawing_analyzed', 'general'
    ],
    default: 'general'
  },
  relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  relatedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  link: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
