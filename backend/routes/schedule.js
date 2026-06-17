const express  = require('express');
const router   = express.Router();
const WorkSchedule = require('../models/WorkSchedule');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/schedule?project=<id>
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    const phases = await WorkSchedule.find(filter)
      .populate('project', 'name')
      .populate('assignedTo', 'name role')
      .sort('startDate');
    res.json({ success: true, phases });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/schedule
router.post('/', async (req, res) => {
  try {
    const phase = await WorkSchedule.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, phase });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/schedule/:id
router.put('/:id', async (req, res) => {
  try {
    const phase = await WorkSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!phase) return res.status(404).json({ success: false, message: 'Phase not found' });
    res.json({ success: true, phase });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/schedule/:id
router.delete('/:id', async (req, res) => {
  try {
    await WorkSchedule.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
