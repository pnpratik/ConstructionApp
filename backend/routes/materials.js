const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const MaterialRequirement = require('../models/MaterialRequirement');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// GET /api/materials
router.get('/', async (req, res) => {
  try {
    const filter = req.query.project ? { project: req.query.project } : {};
    const materials = await Material.find(filter).sort('category name');
    res.json({ success: true, materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/materials
router.post('/', authorize('director', 'site_engineer', 'builder', 'chairperson', 'admin'), async (req, res) => {
  try {
    const material = await Material.create(req.body);
    res.status(201).json({ success: true, material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/materials/requirements/:projectId
router.get('/requirements/:projectId', async (req, res) => {
  try {
    const requirements = await MaterialRequirement.find({ project: req.params.projectId })
      .populate('fromDrawing', 'type fileName')
      .sort('category materialName');
    res.json({ success: true, requirements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/materials/summary/:projectId - Total Required vs Ordered
router.get('/summary/:projectId', async (req, res) => {
  try {
    const requirements = await MaterialRequirement.find({ project: req.params.projectId });
    const summary = {
      totalItems: requirements.length,
      byCategory: {},
      items: requirements
    };
    requirements.forEach(r => {
      if (!summary.byCategory[r.category]) {
        summary.byCategory[r.category] = { totalRequired: 0, totalOrdered: 0, totalDelivered: 0 };
      }
      summary.byCategory[r.category].totalRequired += r.totalRequired;
      summary.byCategory[r.category].totalOrdered += r.totalOrdered;
      summary.byCategory[r.category].totalDelivered += r.totalDelivered;
    });
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/materials/:id
router.get('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    res.json({ success: true, material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/materials/:id
router.put('/:id', authorize('director', 'site_engineer', 'builder', 'chairperson', 'admin'), async (req, res) => {
  try {
    const material = await Material.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, material });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/materials/:id
router.delete('/:id', authorize('director', 'chairperson', 'admin'), async (req, res) => {
  try {
    await Material.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Material deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
