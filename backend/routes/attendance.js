const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

router.use(protect);

// Helper: today's date string
const todayStr = () => new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

const CONTRACTOR_ROLES = [
  'civil_contractor', 'plumbing_contractor', 'color_contractor',
  'lift_contractor', 'electric_contractor', 'tile_contractor',
  'acp_contractor', 'aluminium_contractor', 'door_lock_contractor',
];

const typeFromRole = (role) => role?.replace('_contractor', '').replace('electric', 'electrical');

// ── GET /api/attendance/today ─────────────────────────────────────────────────
// Returns only contractors with presentCount > 0 for today
router.get('/today', async (req, res) => {
  try {
    const date = todayStr();
    const records = await Attendance.find({ date, presentCount: { $gt: 0 } })
      .populate('project', 'name')
      .sort('-presentCount');

    const totalPresent = records.reduce((s, r) => s + r.presentCount, 0);

    res.json({ success: true, date, records, totalPresent });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/attendance/my-today ──────────────────────────────────────────────
// Returns the logged-in contractor's entry for today (for the mark-attendance form)
router.get('/my-today', async (req, res) => {
  try {
    const date = todayStr();
    const record = await Attendance.findOne({ date, contractor: req.user._id })
      .populate('project', 'name');
    res.json({ success: true, date, record: record || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/attendance ──────────────────────────────────────────────────────
// Contractor (or engineer/director) marks/updates today's attendance
router.post('/', async (req, res) => {
  try {
    const { presentCount, note, project, contractorId } = req.body;

    if (presentCount === undefined || presentCount < 0) {
      return res.status(400).json({ success: false, message: 'presentCount is required and must be ≥ 0' });
    }

    // Who is the contractor?
    let targetUser = req.user;
    // Directors / engineers can mark on behalf of a contractor
    if (contractorId && ['director', 'site_engineer', 'builder', 'chairperson'].includes(req.user.role)) {
      targetUser = await User.findById(contractorId);
      if (!targetUser) return res.status(404).json({ success: false, message: 'Contractor not found' });
    }

    const date = todayStr();
    const entry = {
      date,
      contractor: targetUser._id,
      contractorName: targetUser.name,
      contractorType: typeFromRole(targetUser.role),
      contractorCompany: targetUser.company || '',
      presentCount: parseInt(presentCount) || 0,
      markedBy: req.user._id,
      note: note || '',
    };
    if (project) entry.project = project;

    const record = await Attendance.findOneAndUpdate(
      { date, contractor: targetUser._id },
      entry,
      { upsert: true, new: true }
    ).populate('project', 'name');

    res.json({ success: true, record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/attendance/contractors ──────────────────────────────────────────
// Returns list of all contractor users + their attendance for today (for director view)
router.get('/contractors', async (req, res) => {
  try {
    const date = todayStr();
    const contractors = await User.find({ role: { $in: CONTRACTOR_ROLES }, isActive: true }, 'name role company');
    const todayRecords = await Attendance.find({ date });

    const recordMap = {};
    todayRecords.forEach(r => { recordMap[r.contractor.toString()] = r; });

    const list = contractors.map(c => ({
      _id: c._id,
      name: c.name,
      type: typeFromRole(c.role),
      company: c.company || '',
      presentCount: recordMap[c._id.toString()]?.presentCount ?? null, // null = not marked yet
    }));

    res.json({ success: true, date, contractors: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/attendance/history?days=7 ───────────────────────────────────────
router.get('/history', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const from = new Date();
    from.setDate(from.getDate() - days + 1);
    const fromStr = from.toISOString().slice(0, 10);

    const records = await Attendance.find({ date: { $gte: fromStr }, presentCount: { $gt: 0 } })
      .populate('project', 'name')
      .sort('date');

    // Group by date
    const byDate = {};
    records.forEach(r => {
      if (!byDate[r.date]) byDate[r.date] = { date: r.date, total: 0, contractors: [] };
      byDate[r.date].total += r.presentCount;
      byDate[r.date].contractors.push({ name: r.contractorName, type: r.contractorType, count: r.presentCount });
    });

    res.json({ success: true, history: Object.values(byDate).sort((a, b) => b.date.localeCompare(a.date)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
