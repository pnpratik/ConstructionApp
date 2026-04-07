const express = require('express');
const router  = express.Router();
const path    = require('path');

const Drawing             = require('../models/Drawing');
const MaterialRequirement = require('../models/MaterialRequirement');
const { protect, authorize } = require('../middleware/auth');
const { uploadDrawing }   = require('../middleware/upload');
const { calculateMaterials }  = require('../utils/materialCalculator');
const { analyzeDrawingFile }  = require('../utils/dwgAnalyzer');

router.use(protect);

// ── GET /api/drawings?project=id&showAll=1 ────────────────────────────────────
// By default only returns the latest revision of each drawing.
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    // showAll=1 returns every revision; default → only latest
    if (!req.query.showAll) filter.isLatest = true;

    const drawings = await Drawing.find(filter)
      .populate('project',    'name')
      .populate('uploadedBy', 'name role')
      .populate('approvedBy', 'name')
      .sort('-createdAt');
    res.json({ success: true, drawings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/drawings — Upload + auto-analyze + auto-calculate ───────────────
router.post('/', uploadDrawing.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { project, type, description, revisionNote } = req.body;

    // Check if a drawing of same project+type already exists (latest)
    const existing = await Drawing.findOne({ project, type, isLatest: true });
    let revision = 0;
    let parentDrawing = null;

    if (existing) {
      // This is a revision upload — mark old one as not latest
      revision      = (existing.revision || 0) + 1;
      parentDrawing = existing._id;
      existing.isLatest = false;
      await existing.save();
    }

    // Create the drawing record
    const drawing = await Drawing.create({
      project,
      type,
      description,
      fileName:     req.file.originalname,
      fileUrl:      `/uploads/drawings/${req.file.filename}`,
      uploadedBy:   req.user._id,
      revision,
      revisionNote: revisionNote || '',
      parentDrawing,
      isLatest:     true,
      status:       'uploaded',
    });

    // ── Auto-analyze file ─────────────────────────────────────────────────
    const filePath = path.join(__dirname, '..', 'uploads', 'drawings', req.file.filename);
    const analysis = await analyzeDrawingFile(filePath, type);
    const inputs   = analysis.inputs || {};

    // ── Auto-calculate materials ──────────────────────────────────────────
    const materials = calculateMaterials(type, inputs);

    // Save inputs + calculations back to drawing
    drawing.inputs               = inputs;
    drawing.materialCalculations = materials;
    drawing.status               = 'analyzed';
    await drawing.save();

    // ── Upsert MaterialRequirements (add delta if revision) ───────────────
    for (const mat of materials) {
      await MaterialRequirement.findOneAndUpdate(
        { project, materialName: mat.materialName },
        {
          $set: {
            category:    mat.category,
            unit:        mat.unit,
            fromDrawing: drawing._id,
          },
          // On revision: replace quantity (not add), so use $set for totalRequired
          // We use a two-step approach: first get old, then update delta
        },
        { upsert: true, new: true }
      );
      // Replace totalRequired with latest drawing's value
      await MaterialRequirement.findOneAndUpdate(
        { project, materialName: mat.materialName },
        { $set: { totalRequired: mat.quantity } }
      );
    }

    // ── Populate for response ─────────────────────────────────────────────
    await drawing.populate(['project', 'uploadedBy']);

    res.status(201).json({
      success: true,
      drawing,
      materials,
      analysisConfidence: analysis.confidence,
      isRevision: revision > 0,
      revision,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/drawings/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id)
      .populate('project',       'name location')
      .populate('uploadedBy',    'name role')
      .populate('approvedBy',    'name')
      .populate('parentDrawing', 'fileName revision createdAt');
    if (!drawing) return res.status(404).json({ success: false, message: 'Drawing not found' });
    res.json({ success: true, drawing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── GET /api/drawings/:id/revisions — All revisions for same project+type ─────
router.get('/:id/revisions', async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    if (!drawing) return res.status(404).json({ success: false, message: 'Drawing not found' });

    // Find all drawings for same project+type, ordered by revision
    const revisions = await Drawing.find({
      project: drawing.project,
      type:    drawing.type,
    })
      .populate('uploadedBy', 'name role')
      .sort('revision');

    res.json({ success: true, revisions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/drawings/:id/calculate — Manual recalculate (override inputs) ───
// Still available for manual correction but optional now
router.post('/:id/calculate', async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    if (!drawing) return res.status(404).json({ success: false, message: 'Drawing not found' });

    const inputs    = req.body.inputs || drawing.inputs || {};
    const materials = calculateMaterials(drawing.type, inputs);

    drawing.inputs               = inputs;
    drawing.materialCalculations = materials;
    drawing.status               = 'analyzed';
    await drawing.save();

    // Update MaterialRequirements
    for (const mat of materials) {
      await MaterialRequirement.findOneAndUpdate(
        { project: drawing.project, materialName: mat.materialName },
        {
          $set: {
            category:      mat.category,
            unit:          mat.unit,
            fromDrawing:   drawing._id,
            totalRequired: mat.quantity,
          },
        },
        { upsert: true, new: true }
      );
    }

    res.json({ success: true, drawing, materials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/drawings/:id/analyze — Re-analyze file (re-extract from file) ──
router.post('/:id/analyze', async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    if (!drawing) return res.status(404).json({ success: false, message: 'Drawing not found' });

    const uploadsDir = path.join(__dirname, '..', 'uploads', 'drawings');
    const fileName   = path.basename(drawing.fileUrl || '');
    const filePath   = path.join(uploadsDir, fileName);
    const analysis   = await analyzeDrawingFile(filePath, drawing.type);

    if (analysis.inputs && Object.keys(analysis.inputs).length > 0) {
      drawing.inputs = analysis.inputs;
      await drawing.save();
    }

    res.json({
      success: true,
      analysis: {
        format:     analysis.format,
        confidence: analysis.confidence,
        inputs:     analysis.inputs,
        details:    analysis.details,
        error:      analysis.error || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── PUT /api/drawings/:id/approve ────────────────────────────────────────────
router.put('/:id/approve',
  authorize('director', 'builder', 'chairperson', 'admin'),
  async (req, res) => {
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
  }
);

module.exports = router;
