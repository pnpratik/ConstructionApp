const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const MaterialRequirement = require('../models/MaterialRequirement');
const { protect, canApprove, canRequest } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');
const { notifyApprovers, notifyOrderStatus, notifyDispatch, notifyDelivery, notifyVendorOrder } = require('../utils/notificationHelper');
const { generateInvoicePDF } = require('../utils/invoiceGenerator');
const QRCode = require('qrcode');
const User = require('../models/User');
const Vendor = require('../models/Vendor');

router.use(protect);

const CONTRACTOR_ROLES = [
  'site_engineer', 'civil_contractor', 'plumbing_contractor', 'color_contractor',
  'lift_contractor', 'electric_contractor', 'tile_contractor',
  'acp_contractor', 'aluminium_contractor', 'door_lock_contractor'
];

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    let filter = {};
    // Contractors see only their orders
    if (CONTRACTOR_ROLES.includes(req.user.role)) {
      filter.requestedBy = req.user._id;
    }
    // Vendors see orders assigned to them
    if (req.user.role === 'vendor') {
      const vendor = await Vendor.findOne({ linkedUser: req.user._id });
      if (vendor) filter.vendor = vendor._id;
    }
    if (req.query.project) filter.project = req.query.project;
    if (req.query.status) filter.status = req.query.status;

    const orders = await Order.find(filter)
      .populate('project', 'name location')
      .populate('requestedBy', 'name role company')
      .populate('vendor', 'name email phone')
      .populate('approvalDetails.approvedBy', 'name')
      .populate('deliveryDetails.receivedBy', 'name')
      .sort('-createdAt');

    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/orders - Create order
router.post('/', canRequest, async (req, res) => {
  try {
    const order = await Order.create({
      ...req.body,
      requestedBy: req.user._id,
      requestorType: req.user.role,
      status: 'pending_approval'
    });

    // Notify approvers
    const approvers = await notifyApprovers(order, req.user.name);
    // Email approvers
    for (const approver of approvers) {
      if (approver.email) {
        await sendEmail({
          to: approver.email,
          subject: `New Order Request - ${order.orderNumber}`,
          html: `<p>Dear ${approver.name},</p><p>${req.user.name} has raised a new order <strong>${order.orderNumber}</strong> for your approval.</p><p>Login to the Construction App to review.</p>`
        });
      }
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('project', 'name location')
      .populate('requestedBy', 'name role company phone')
      .populate('vendor', 'name email phone contactPerson')
      .populate('approvalDetails.approvedBy', 'name role')
      .populate('rejectionDetails.rejectedBy', 'name role')
      .populate('deliveryDetails.receivedBy', 'name role');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id/approve
router.put('/:id/approve', canApprove, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('vendor', 'email name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'Order is not pending approval' });
    }

    order.status = 'approved';
    order.approvalDetails = { approvedBy: req.user._id, approvedAt: new Date(), remarks: req.body.remarks };
    await order.save();

    // Notify requestor
    await notifyOrderStatus(order, 'approved');
    const requestor = await User.findById(order.requestedBy);
    if (requestor?.email) {
      const tmpl = emailTemplates.orderApproved(order, req.user.name);
      await sendEmail({ to: requestor.email, ...tmpl });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id/reject
router.put('/:id/reject', canApprove, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = 'rejected';
    order.rejectionDetails = { rejectedBy: req.user._id, rejectedAt: new Date(), reason: req.body.reason };
    await order.save();

    await notifyOrderStatus(order, 'rejected', req.body.reason);
    const requestor = await User.findById(order.requestedBy);
    if (requestor?.email) {
      const tmpl = emailTemplates.orderRejected(order, req.body.reason);
      await sendEmail({ to: requestor.email, ...tmpl });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id/send-to-vendor
router.put('/:id/send-to-vendor', canApprove, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'approved') return res.status(400).json({ success: false, message: 'Order must be approved first' });

    if (req.body.vendorId) order.vendor = req.body.vendorId;
    order.status = 'sent_to_vendor';
    await order.save();

    const vendor = await Vendor.findById(order.vendor);
    if (vendor?.email) {
      const tmpl = emailTemplates.vendorOrderNotification(order, vendor);
      await sendEmail({ to: vendor.email, ...tmpl });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id/vendor-accept
router.put('/:id/vendor-accept', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = 'accepted_by_vendor';
    order.vendorResponseAt = new Date();
    order.vendorRemarks = req.body.remarks;
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id/vendor-reject
router.put('/:id/vendor-reject', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = 'rejected_by_vendor';
    order.vendorResponseAt = new Date();
    order.vendorRemarks = req.body.remarks;
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id/dispatch
router.put('/:id/dispatch', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'accepted_by_vendor') return res.status(400).json({ success: false, message: 'Order must be accepted by vendor first' });

    const { driverName, driverPhone, vehicleNumber, dispatchDate, estimatedArrival, locationUrl } = req.body;
    order.status = 'dispatched';
    order.dispatchDetails = { driverName, driverPhone, vehicleNumber, dispatchDate: dispatchDate || new Date(), estimatedArrival, locationUrl: locationUrl || '' };
    await order.save();

    // Notify site engineer + director
    await notifyDispatch(order);
    const requestor = await User.findById(order.requestedBy);
    if (requestor?.email) {
      const tmpl = emailTemplates.orderDispatched(order, order.dispatchDetails);
      await sendEmail({ to: requestor.email, ...tmpl });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/orders/:id - General update
router.put('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/orders/:id/invoice — Download GST PDF invoice
router.get('/:id/invoice', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('vendor',      'name address phone gst')
      .populate('project',     'name location')
      .populate('requestedBy', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const pdfBuffer = await generateInvoicePDF(order);
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `inline; filename="Invoice-${order.orderNumber}.pdf"`,
      'Content-Length':      pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id/qr — QR code for this order (PNG)
router.get('/:id/qr', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).select('orderNumber status');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const url    = `${process.env.CLIENT_URL || 'http://localhost:5173'}/orders/${order._id}`;
    const qrPng  = await QRCode.toBuffer(url, { type: 'png', width: 300, margin: 2 });
    res.set({ 'Content-Type': 'image/png' });
    res.send(qrPng);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/stats/dashboard
router.get('/stats/overview', async (req, res) => {
  try {
    const total = await Order.countDocuments();
    const pending = await Order.countDocuments({ status: 'pending_approval' });
    const approved = await Order.countDocuments({ status: { $in: ['approved', 'sent_to_vendor', 'accepted_by_vendor'] } });
    const dispatched = await Order.countDocuments({ status: 'dispatched' });
    const delivered = await Order.countDocuments({ status: 'delivered' });
    res.json({ success: true, stats: { total, pending, approved, dispatched, delivered } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
