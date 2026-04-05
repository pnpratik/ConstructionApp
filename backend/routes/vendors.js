const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// GET /api/vendors
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find({ isActive: true }).populate('linkedUser', 'name email').sort('name');
    res.json({ success: true, vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/vendors
router.post('/', authorize('director', 'builder', 'chairperson', 'admin'), async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/vendors/:id
router.get('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('linkedUser', 'name email');
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/vendors/:id
router.put('/:id', authorize('director', 'builder', 'chairperson', 'admin'), async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, vendor });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/vendors/:id (soft delete)
router.delete('/:id', authorize('director', 'chairperson', 'admin'), async (req, res) => {
  try {
    await Vendor.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Vendor deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
