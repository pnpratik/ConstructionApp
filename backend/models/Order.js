const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  materialName: { type: String, required: true },
  category: { type: String },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  estimatedCost: { type: Number, default: 0 },
  deliveredQuantity: { type: Number, default: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestorType: {
    type: String,
    enum: ['site_engineer', 'civil_contractor', 'plumbing_contractor', 'color_contractor',
      'lift_contractor', 'electric_contractor', 'tile_contractor',
      'acp_contractor', 'aluminium_contractor', 'door_lock_contractor']
  },
  items: [orderItemSchema],
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  status: {
    type: String,
    enum: [
      'draft', 'pending_approval', 'approved', 'rejected',
      'sent_to_vendor', 'accepted_by_vendor', 'rejected_by_vendor',
      'dispatched', 'delivered'
    ],
    default: 'draft'
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  requiredByDate: { type: Date },
  remarks: { type: String },
  // Approval
  approvalDetails: {
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date,
    remarks: String
  },
  rejectionDetails: {
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: Date,
    reason: String
  },
  // Vendor response
  vendorResponseAt: { type: Date },
  vendorRemarks: { type: String },
  // Dispatch
  dispatchDetails: {
    driverName: String,
    driverPhone: String,
    vehicleNumber: String,
    dispatchDate: Date,
    estimatedArrival: Date
  },
  // Delivery
  deliveryDetails: {
    challanFile: String,
    challanNumber: String,
    photos: [String],
    deliveredAt: Date,
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    digitalSignature: String,
    isConfirmed: { type: Boolean, default: false }
  },
  totalEstimatedCost: { type: Number, default: 0 }
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(5, '0')}`;
  }
  // Calculate total cost
  if (this.items && this.items.length > 0) {
    this.totalEstimatedCost = this.items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
