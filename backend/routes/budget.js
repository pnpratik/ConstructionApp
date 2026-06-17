const express = require('express');
const router  = express.Router();
const Budget  = require('../models/Budget');
const Order   = require('../models/Order');
const Payment = require('../models/Payment');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/budget?project=<id>
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    const entries = await Budget.find(filter).populate('project', 'name').sort('category');
    res.json({ success: true, entries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/budget/summary/:projectId
router.get('/summary/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const entries = await Budget.find({ project: projectId });

    const totalAllocated = entries.reduce((s, e) => s + e.allocatedAmount, 0);

    // Sum payments made for orders in this project
    const orders = await Order.find({ project: projectId, status: { $in: ['approved','dispatched','delivered'] } });
    const orderIds = orders.map(o => o._id);
    const payments = await Payment.find({ order: { $in: orderIds } });
    const totalSpent = payments.reduce((s, p) => s + (p.amount || 0), 0);

    // Allocated by category
    const allocatedByCategory = entries.map(e => ({ _id: e.category, total: e.allocatedAmount }));

    // Spent by category — map each order's category through its payments
    const spentByCategory = {};
    for (const order of orders) {
      const cat = order.materialCategory || 'material';
      const paid = payments.filter(p => String(p.order) === String(order._id)).reduce((s, p) => s + p.amount, 0);
      spentByCategory[cat] = (spentByCategory[cat] || 0) + paid;
    }

    const remaining   = totalAllocated - totalSpent;
    const percentUsed = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

    res.json({ success: true, totalAllocated, totalSpent, remaining, percentUsed, allocatedByCategory, spentByCategory });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/budget
router.post('/', async (req, res) => {
  try {
    const { project, category, allocatedAmount, description } = req.body;
    const entry = await Budget.create({ project, category, allocatedAmount, description, createdBy: req.user._id });
    res.status(201).json({ success: true, entry });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'Budget entry for this category already exists. Edit it instead.' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/budget/:id
router.put('/:id', async (req, res) => {
  try {
    const entry = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!entry) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/budget/:id
router.delete('/:id', async (req, res) => {
  try {
    await Budget.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
