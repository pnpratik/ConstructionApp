const express = require('express');
const router  = express.Router();
const path    = require('path');

const Drawing             = require('../models/Drawing');
const MaterialRequirement = require('../models/MaterialRequirement');
const { protect, authorize } = require('../middleware/auth');
const { uploadDrawing }   = require('../middleware/upload');
const { calculateMaterials }  = require('../utils/materialCalculator');
const { analyzeDrawingWithAI } = require('../utils/drawingAI');

router.use(protect);

// ── GET /api/drawings?project=id&showAll=1 ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
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

// ── POST /api/drawings — Upload + AI analysis ────────────────────────────────
// Flow: store file → call Claude vision → store extracted data + questions →
//       return to frontend which shows questions → user answers → calculate
router.post('/', uploadDrawing.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { project, type, description, revisionNote } = req.body;

    // Handle revision tracking
    const existing = await Drawing.findOne({ project, type, isLatest: true });
    let revision      = 0;
    let parentDrawing = null;
    let prevAiExtracted = null;

    if (existing) {
      revision        = (existing.revision || 0) + 1;
      parentDrawing   = existing._id;
      prevAiExtracted = existing.aiExtracted || null;
      existing.isLatest = false;
      await existing.save();
    }

    // Save drawing record immediately so we have an ID
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
      status:       'ai_analyzing',
    });

    // Run AI analysis on the uploaded file
    const filePath  = path.join(__dirname, '..', 'uploads', 'drawings', req.file.filename);
    const aiResult  = await analyzeDrawingWithAI(filePath, type);

    if (aiResult.success) {
      drawing.aiExtracted           = aiResult.extracted;
      drawing.aiClarifyingQuestions = aiResult.clarifyingQuestions || [];
      drawing.aiConfidence          = aiResult.confidence;
      drawing.aiNotes               = aiResult.notes;
      drawing.status                = 'ai_done';
    } else {
      // AI failed — store the error, frontend will show manual fallback
      drawing.aiError  = aiResult.message;
      drawing.status   = 'uploaded';   // fall back to manual input state
    }

    await drawing.save();
    await drawing.populate(['project', 'uploadedBy']);

    res.status(201).json({
      success:      true,
      drawing,
      isRevision:   revision > 0,
      revision,
      aiSuccess:    aiResult.success,
      aiError:      aiResult.success ? null : aiResult.message,
      aiReason:     aiResult.reason || null,
      prevAiExtracted,  // for revision prefill
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

// ── GET /api/drawings/:id/revisions ──────────────────────────────────────────
router.get('/:id/revisions', async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    if (!drawing) return res.status(404).json({ success: false, message: 'Drawing not found' });

    const revisions = await Drawing.find({ project: drawing.project, type: drawing.type })
      .populate('uploadedBy', 'name role')
      .sort('revision');

    res.json({ success: true, revisions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/drawings/:id/calculate ─────────────────────────────────────────
// Body: { answers: { fieldName: value, … }, saveToRequirements: bool }
// 'answers' are the user's replies to clarifying questions.
// They are merged with aiExtracted to form the final inputs object.
router.post('/:id/calculate', async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    if (!drawing) return res.status(404).json({ success: false, message: 'Drawing not found' });

    const saveToRequirements = req.body.saveToRequirements === true;

    // Merge AI-extracted values with user answers (answers win on conflict)
    const aiBase  = drawing.aiExtracted || {};
    const answers = req.body.answers    || req.body.inputs || {};
    const inputs  = { ...aiBase, ...answers };

    const materials = calculateMaterials(drawing.type, inputs);

    drawing.inputs               = inputs;
    drawing.materialCalculations = materials;
    drawing.status               = 'analyzed';
    await drawing.save();

    if (saveToRequirements) {
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
    }

    res.json({ success: true, drawing, materials, savedToRequirements: saveToRequirements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── POST /api/drawings/:id/re-analyze — Re-run AI on the stored file ─────────
router.post('/:id/re-analyze', async (req, res) => {
  try {
    const drawing = await Drawing.findById(req.params.id);
    if (!drawing) return res.status(404).json({ success: false, message: 'Drawing not found' });

    const fileName = path.basename(drawing.fileUrl || '');
    const filePath = path.join(__dirname, '..', 'uploads', 'drawings', fileName);
    const aiResult = await analyzeDrawingWithAI(filePath, drawing.type);

    if (aiResult.success) {
      drawing.aiExtracted           = aiResult.extracted;
      drawing.aiClarifyingQuestions = aiResult.clarifyingQuestions || [];
      drawing.aiConfidence          = aiResult.confidence;
      drawing.aiNotes               = aiResult.notes;
      drawing.aiError               = null;
      drawing.status                = 'ai_done';
    } else {
      drawing.aiError = aiResult.message;
      drawing.status  = 'uploaded';
    }
    await drawing.save();

    res.json({ success: true, drawing, aiSuccess: aiResult.success, aiError: aiResult.success ? null : aiResult.message });
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
