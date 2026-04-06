const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { protect, authorize } = require('../middleware/auth');
const { uploadProjectImage } = require('../middleware/upload');

router.use(protect);

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find({ isActive: true })
      .populate('assignedEngineers', 'name email role')
      .populate('assignedContractors', 'name email role')
      .populate('createdBy', 'name email')
      .sort('-createdAt');
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/projects — supports optional image upload
router.post('/',
  authorize('director', 'builder', 'chairperson', 'admin'),
  uploadProjectImage.single('image'),
  async (req, res) => {
    try {
      const data = { ...req.body, createdBy: req.user._id };
      if (req.file) data.imageUrl = `/uploads/projects/${req.file.filename}`;
      const project = await Project.create(data);
      res.status(201).json({ success: true, project });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// GET /api/projects/:id
router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('assignedEngineers', 'name email role phone')
      .populate('assignedContractors', 'name email role phone company')
      .populate('createdBy', 'name email');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/projects/:id — supports optional image upload
router.put('/:id',
  authorize('director', 'builder', 'chairperson', 'admin'),
  uploadProjectImage.single('image'),
  async (req, res) => {
    try {
      const update = { ...req.body };
      if (req.file) update.imageUrl = `/uploads/projects/${req.file.filename}`;
      const project = await Project.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
      res.json({ success: true, project });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// DELETE /api/projects/:id (soft delete)
router.delete('/:id', authorize('director', 'chairperson', 'admin'), async (req, res) => {
  try {
    await Project.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
