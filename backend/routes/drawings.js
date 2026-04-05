const express = require('express');
const router = express.Router();
const Drawing = require('../models/Drawing');
const MaterialRequirement = require('../models/MaterialRequirement');
const { protect, authorize } = require('../middleware/auth');
const { uploadDrawing } = require('../middleware/upload');
const { calculateMaterials } = require('../utils/materialCalculator');

router.use(protect);

// GET /api/drawings?project=id
router.get('/', async (req, res) => {
  try {
    const filter = req.query.project ? { project: req.query.project } : {};
    const drawings = await Drawing.find(filter)
      .populate('project', 'name')
      .populate('uploadedBy', 'name role')
      .populate('approvedBy', 'name')
      .sort('-createdAt');
    res.json({ success: true, drawings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/drawings - Upload a drawing file
router.post('/', uploadDrawing.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { project, type, description } = req.body;
    const drawing = await Drawing.create({
      project,
      type,
      description,
      fileName: req.file.originalname,
      fileUrl: `/uploads/drawings/${req.file.filename}`,
      uploadedBy: req.user._id
    });

    res.status(201).json({ success: true, drawing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/drawings/:id
router.get('/:id', async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id)
      .populate('project', 'name location')
      .populate('uploadedBy', 'name role')
      .populate('approvedBy', 'name');
    if (!drawing) return res.status(404).json({ success: false, message: 'Drawing not found' });
    res.json({ success: true, drawing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/drawings/:id/calculate - Calculate materials from drawing inputs
router.post('/:id/calculate', async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    if (!drawing) return res.status(404).json({ success: false, message: 'Drawing not found' });

    const inputs = req.body.inputs || {};
    const materials = calculateMaterials(drawing.type, inputs);

    // Update drawing with inputs + calculations
    drawing.inputs = inputs;
    drawing.materialCalculations = materials;
    drawing.status = 'analyzed';
    await drawing.save();

    // Upsert into MaterialRequirement
    for (const mat of materials) {
      await MaterialRequirement.findOneAndUpdate(
        { project: drawing.project, materialName: mat.materialName },
        {
          $inc: { totalRequired: mat.quantity },
          $set: {
            category: mat.category,
            unit: mat.unit,
            fromDrawing: drawing._id
          }
        },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, drawing, materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/drawings/:id/approve
router.put('/:id/approve', authorize('director', 'builder', 'chairperson', 'admin'), async (req, res) => {
  try {
    const drawing = await Drawing.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, drawing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
