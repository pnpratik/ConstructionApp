const express = require('express');
const router = express.Router();
const Contractor = require('../models/Contractor');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// GET /api/contractors
router.get('/', async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.type) filter.type = req.query.type;
    const contractors = await Contractor.find(filter)
      .populate('user', 'name email phone role company')
      .populate('projects', 'name location status')
      .sort('type');
    res.json({ success: true, contractors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/contractors
router.post('/', authorize('director', 'builder', 'chairperson', 'admin'), async (req, res) => {
  try {
    const contractor = await Contractor.create(req.body);
    res.status(201).json({ success: true, contractor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/contractors/:id
router.get('/:id', async (req, res) => {
  try {
    const contractor = await Contractor.findById(req.params.id)
      .populate('user', 'name email phone role company')
      .populate('projects', 'name location status');
    if (!contractor) return res.status(404).json({ success: false, message: 'Contractor not found' });
    res.json({ success: true, contractor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/contractors/:id
router.put('/:id', authorize('director', 'builder', 'chairperson', 'admin'), async (req, res) => {
  try {
    const contractor = await Contractor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, contractor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/contractors/:id
router.delete('/:id', authorize('director', 'chairperson', 'admin'), async (req, res) => {
  try {
    await Contractor.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Contractor deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
