const express  = require('express');
const router   = express.Router();
const Attendance    = require('../models/Attendance');
const Contractor    = require('../models/Contractor');
const LaborPayment  = require('../models/LaborPayment');
const User          = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// ── GET /api/labor-billing?month=YYYY-MM ─────────────────────────────────────
// Full billing summary for a month: attendance + rates + payments
router.get('/', async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7); // default current month
    const from  = `${month}-01`;
    const to    = `${month}-31`;

    // All contractors with their user info
    const contractors = await Contractor.find({ isActive: true })
      .populate('user', 'name phone company role');

    // All attendance records for the month
    const records = await Attendance.find({ date: { $gte: from, $lte: to } });

    // All labor payments for the month
    const payments = await LaborPayment.find({ month })
      .populate('paidBy', 'name');

    // Build per-contractor billing row
    const rows = contractors.map(c => {
      const userId   = c.user?._id?.toString();
      const cRecords = records.filter(r => r.contractor?.toString() === userId);

      // Days they worked (distinct dates with presentCount > 0)
      const workedDays = [...new Set(
        cRecords.filter(r => r.presentCount > 0).map(r => r.date)
      )].length;

      // Sum of worker-days (presentCount × 1 day)
      const totalWorkerDays = cRecords.reduce((s, r) => s + (r.presentCount || 0), 0);

      const rate     = c.dailyRate || 0;
      const totalDue = totalWorkerDays * rate;

      const cPayments = payments.filter(p => p.contractor?.toString() === userId);
      const totalPaid = cPayments.reduce((s, p) => s + p.amount, 0);
      const outstanding = Math.max(0, totalDue - totalPaid);

      return {
        contractorId: c._id,
        userId,
        name:         c.user?.name,
        phone:        c.user?.phone,
        type:         c.type,
        company:      c.company,
        dailyRate:    rate,
        daysPresent:  workedDays,
        totalWorkerDays,
        totalDue,
        totalPaid,
        outstanding,
        payments:     cPayments,
        attendance:   cRecords,
      };
    });

    const totals = {
      totalDue:  rows.reduce((s, r) => s + r.totalDue, 0),
      totalPaid: rows.reduce((s, r) => s + r.totalPaid, 0),
      outstanding: rows.reduce((s, r) => s + r.outstanding, 0),
    };

    res.json({ success: true, month, rows, totals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/labor-billing/pay ───────────────────────────────────────────────
// Record a labor payment to a contractor
router.post('/pay', authorize('director', 'builder', 'chairperson'), async (req, res) => {
  try {
    const { contractorUserId, contractorId, month, amount, method, reference, remarks, daysPresent, totalWorkerDays, dailyRate, totalDue } = req.body;
    if (!contractorUserId || !month || !amount) {
      return res.status(400).json({ success: false, message: 'contractor, month, amount required' });
    }
    const payment = await LaborPayment.create({
      contractor:   contractorUserId,
      contractorId: contractorId || null,
      month,
      amount:       Number(amount),
      method:       method || 'cash',
      reference:    reference || '',
      remarks:      remarks || '',
      daysPresent:  daysPresent || 0,
      totalWorkers: totalWorkerDays || 0,
      dailyRate:    dailyRate || 0,
      totalDue:     totalDue || 0,
      paidBy:       req.user._id,
    });
    await payment.populate('paidBy', 'name');
    res.status(201).json({ success: true, payment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/labor-billing/rate/:contractorId ─────────────────────────────────
// Update a contractor's daily rate
router.put('/rate/:contractorId', authorize('director', 'builder', 'chairperson'), async (req, res) => {
  try {
    const { dailyRate } = req.body;
    const contractor = await Contractor.findByIdAndUpdate(
      req.params.contractorId,
      { $set: { dailyRate: Number(dailyRate) || 0 } },
      { new: true }
    ).populate('user', 'name');
    if (!contractor) return res.status(404).json({ success: false, message: 'Contractor not found' });
    res.json({ success: true, contractor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/labor-billing/history/:contractorUserId ─────────────────────────
// Payment history for a specific contractor
router.get('/history/:contractorUserId', async (req, res) => {
  try {
    const payments = await LaborPayment.find({ contractor: req.params.contractorUserId })
      .populate('paidBy', 'name')
      .sort('-paidAt');
    res.json({ success: true, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
