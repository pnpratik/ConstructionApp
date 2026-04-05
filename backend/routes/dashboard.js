const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const Contractor = require('../models/Contractor');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalProjects, activeProjects,
      totalOrders, pendingOrders, deliveredOrders,
      totalVendors, totalContractors,
      recentOrders
    ] = await Promise.all([
      Project.countDocuments({ isActive: true }),
      Project.countDocuments({ isActive: true, status: 'active' }),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending_approval' }),
      Order.countDocuments({ status: 'delivered' }),
      Vendor.countDocuments({ isActive: true }),
      Contractor.countDocuments({ isActive: true }),
      Order.find()
        .populate('project', 'name')
        .populate('requestedBy', 'name role')
        .populate('vendor', 'name')
        .sort('-createdAt')
        .limit(5)
    ]);

    // Order status breakdown
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Monthly orders trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      stats: {
        totalProjects, activeProjects,
        totalOrders, pendingOrders, deliveredOrders,
        totalVendors, totalContractors
      },
      ordersByStatus,
      monthlyOrders,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
