const express = require('express');
const router  = express.Router();
const Payment = require('../models/Payment');
const Order   = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');

router.use(protect);

// ── Multer for payment screenshot ────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/payments');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `pay_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  /\.(jpg|jpeg|png|pdf)$/i.test(file.originalname) ? cb(null, true) : cb(new Error('Only jpg/png/pdf allowed'));
}});

// ── GET /api/payments ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    if (req.query.vendor)  filter.vendor  = req.query.vendor;
    if (req.query.status)  filter.status  = req.query.status;

    const payments = await Payment.find(filter)
      .populate('order',   'orderNumber totalAmount')
      .populate('vendor',  'name')
      .populate('project', 'name')
      .populate('paidBy',  'name role')
      .sort('-paidAt');
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/payments/summary — totals by project/vendor ─────────────────────
router.get('/summary', async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;

    const [totalPaid, byMethod, monthly] = await Promise.all([
      Payment.aggregate([
        { $match: { ...filter, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { ...filter, status: 'completed' } },
        { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { ...filter, status: 'completed' } },
        { $group: {
          _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
          total: { $sum: '$amount' },
        }},
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 6 },
      ]),
    ]);

    res.json({
      success: true,
      summary: {
        totalPaid:  totalPaid[0]?.total  || 0,
        totalCount: totalPaid[0]?.count  || 0,
        byMethod,
        monthly,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/payments/outstanding — delivered orders without full payment ─────
router.get('/outstanding', async (req, res) => {
  try {
    const deliveredOrders = await Order.find({ status: 'delivered' })
      .populate('vendor',  'name')
      .populate('project', 'name')
      .select('orderNumber totalAmount vendor project deliveredAt');

    // Get payment totals per order
    const paid = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$order', paid: { $sum: '$amount' } } },
    ]);
    const paidMap = Object.fromEntries(paid.map(p => [String(p._id), p.paid]));

    const outstanding = deliveredOrders.map(o => ({
      _id:           o._id,
      orderNumber:   o.orderNumber,
      vendor:        o.vendor,
      project:       o.project,
      totalAmount:   o.totalAmount || 0,
      paid:          paidMap[String(o._id)] || 0,
      outstanding:   (o.totalAmount || 0) - (paidMap[String(o._id)] || 0),
      deliveredAt:   o.deliveredAt,
    })).filter(o => o.outstanding > 0);

    res.json({ success: true, outstanding });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/payments — Record a payment ────────────────────────────────────
router.post('/', upload.single('screenshot'), async (req, res) => {
  try {
    const { orderId, amount, method, upiTransactionId, chequeNumber, neftRef, otherRef, remarks } = req.body;

    const order = await Order.findById(orderId).populate('vendor project');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const screenshot = req.file ? `/uploads/payments/${req.file.filename}` : null;

    const payment = await Payment.create({
      order:   order._id,
      vendor:  order.vendor?._id || order.vendor,
      project: order.project?._id || order.project,
      amount:  Number(amount),
      method,
      upiTransactionId, chequeNumber, neftRef, otherRef,
      screenshot,
      remarks,
      paidBy:  req.user._id,
      paidAt:  new Date(),
      status:  'completed',
    });

    await payment.populate([
      { path: 'order',   select: 'orderNumber' },
      { path: 'vendor',  select: 'name' },
      { path: 'project', select: 'name' },
      { path: 'paidBy',  select: 'name role' },
    ]);

    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/payments/:id ──────────────────────────────────────────────────
router.delete('/:id', authorize('director', 'chairperson', 'admin'), async (req, res) => {
  try {
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Payment record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
