const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');
const SitePhoto = require('../models/SitePhoto');
const { protect } = require('../middleware/auth');

// Multer for site photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/site-photos');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `site-${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) cb(null, true);
    else cb(new Error('Only image files allowed'));
  },
});

router.use(protect);

// GET /api/site-photos?project=&floor=&workType=
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.project)  filter.project  = req.query.project;
    if (req.query.floor)    filter.floor    = req.query.floor;
    if (req.query.workType) filter.workType = req.query.workType;
    const photos = await SitePhoto.find(filter)
      .populate('project', 'name')
      .populate('uploadedBy', 'name')
      .sort('-takenAt');
    res.json({ success: true, photos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/site-photos  (multipart: files[] + project, floor, workType, caption, takenAt)
router.post('/', upload.array('photos', 20), async (req, res) => {
  try {
    const { project, floor, workType, caption, takenAt, tags } = req.body;
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'No photos uploaded' });
    const docs = req.files.map(f => ({
      project, floor, workType, caption,
      takenAt: takenAt ? new Date(takenAt) : new Date(),
      url: `/uploads/site-photos/${f.filename}`,
      uploadedBy: req.user._id,
      tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
    }));
    const photos = await SitePhoto.insertMany(docs);
    res.status(201).json({ success: true, photos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/site-photos/:id
router.delete('/:id', async (req, res) => {
  try {
    const photo = await SitePhoto.findByIdAndDelete(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: 'Not found' });
    // Remove physical file
    const filePath = path.join(__dirname, '..', photo.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
