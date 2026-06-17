const express    = require('express');
const router     = express.Router();
const Order      = require('../models/Order');
const Payment    = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Delivery   = require('../models/Delivery');
const User       = require('../models/User');
const Project    = require('../models/Project');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/reports/overview
router.get('/overview', async (req, res) => {
  try {
    const [totalOrders, totalPayments, totalProjects, totalUsers] = await Promise.all([
      Order.countDocuments(),
      Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Project.countDocuments(),
      User.countDocuments({ isActive: true }),
    ]);
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const recentPayments = await Payment.find().sort('-createdAt').limit(5)
      .populate('order', 'orderNumber')
      .populate('paidBy', 'name');

    res.json({
      success: true,
      totalOrders,
      totalRevenue: totalPayments[0]?.total || 0,
      totalProjects,
      totalUsers,
      ordersByStatus,
      recentPayments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/project-cost/:projectId
router.get('/project-cost/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const orders = await Order.find({ project: projectId });
    const orderIds = orders.map(o => o._id);
    const payments = await Payment.find({ order: { $in: orderIds } });

    const totalOrderValue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
    const totalPaid       = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const pendingPayment  = totalOrderValue - totalPaid;

    // Cost by vendor
    const costByVendor = await Order.aggregate([
      { $match: { project: orders[0]?.project || null } },
      { $lookup: { from: 'users', localField: 'vendor', foreignField: '_id', as: 'vendorInfo' } },
      { $unwind: { path: '$vendorInfo', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$vendorInfo.name', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    // Monthly spend trend
    const monthlyTrend = await Payment.aggregate([
      { $match: { order: { $in: orderIds } } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        total: { $sum: '$amount' },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({ success: true, totalOrderValue, totalPaid, pendingPayment, costByVendor, monthlyTrend, orders: orders.length, payments: payments.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/attendance-summary?days=30
router.get('/attendance-summary', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date(Date.now() - days * 86400000);

    const records = await Attendance.find({ date: { $gte: since } })
      .populate('user', 'name role');

    // By user
    const byUser = {};
    for (const r of records) {
      const uid = String(r.user?._id || r.user);
      if (!byUser[uid]) byUser[uid] = { name: r.user?.name || 'Unknown', role: r.user?.role, present: 0, absent: 0, halfDay: 0, total: 0 };
      byUser[uid].total++;
      if (r.status === 'present')  byUser[uid].present++;
      if (r.status === 'absent')   byUser[uid].absent++;
      if (r.status === 'half_day') byUser[uid].halfDay++;
    }

    // By day (last 14 days)
    const byDay = await Attendance.aggregate([
      { $match: { date: { $gte: new Date(Date.now() - 14 * 86400000) } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent:  { $sum: { $cond: [{ $eq: ['$status', 'absent']  }, 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]);

    const summary = Object.values(byUser);
    const overallRate = summary.length > 0
      ? Math.round(summary.reduce((s, u) => s + (u.present / Math.max(u.total, 1)), 0) / summary.length * 100)
      : 0;

    res.json({ success: true, summary, byDay, overallRate, days });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/vendor-performance
router.get('/vendor-performance', async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor', isActive: true });
    const result = [];

    for (const v of vendors) {
      const orders = await Order.find({ vendor: v._id });
      const delivered  = orders.filter(o => o.status === 'delivered').length;
      const total      = orders.length;
      const onTime     = orders.filter(o => {
        if (o.status !== 'delivered' || !o.expectedDeliveryDate || !o.deliveryDetails?.deliveredAt) return false;
        return new Date(o.deliveryDetails.deliveredAt) <= new Date(o.expectedDeliveryDate);
      }).length;
      const totalValue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

      result.push({
        vendor: v.name,
        email:  v.email,
        totalOrders:   total,
        delivered,
        pending:       total - delivered,
        onTimeRate:    total > 0 ? Math.round((onTime / total) * 100) : 0,
        deliveryRate:  total > 0 ? Math.round((delivered / total) * 100) : 0,
        totalValue,
      });
    }

    result.sort((a, b) => b.totalOrders - a.totalOrders);
    res.json({ success: true, vendors: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/material-consumption?project=
router.get('/material-consumption', async (req, res) => {
  try {
    const match = { status: 'delivered' };
    if (req.query.project) match.project = require('mongoose').Types.ObjectId(req.query.project);

    const data = await Order.aggregate([
      { $match: match },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.materialName',
        totalQty:   { $sum: '$items.quantity' },
        totalValue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } },
        orders:     { $sum: 1 },
      }},
      { $sort: { totalValue: -1 } },
      { $limit: 20 },
    ]);

    res.json({ success: true, materials: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
