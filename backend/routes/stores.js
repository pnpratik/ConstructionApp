const express = require('express');
const router  = express.Router();
const Store   = require('../models/Store');
const { protect, authorize } = require('../middleware/auth');
const { saveSnapshot, getSnapshotUrl } = require('../utils/cameraCapture');

router.use(protect);

// ── Mask password before sending to client ────────────────────────────────
const safeStore = (s) => {
  const obj = s.toObject ? s.toObject() : { ...s };
  if (obj.camera?.password) obj.camera.password = '••••••••';
  return obj;
};

// GET /api/stores
router.get('/', async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.project) filter.project = req.query.project;

    const stores = await Store.find(filter).populate('project', 'name').sort('name');
    res.json({ success: true, stores: stores.map(safeStore) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/stores/:id
router.get('/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id).populate('project', 'name');
    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, store: safeStore(store) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/stores
router.post('/', authorize('director', 'chairperson', 'builder', 'admin'), async (req, res) => {
  try {
    const store = await Store.create(req.body);
    res.status(201).json({ success: true, store: safeStore(store) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/stores/:id
router.put('/:id', authorize('director', 'chairperson', 'builder', 'admin'), async (req, res) => {
  try {
    // If password field is masked (user didn't change it), don't overwrite
    if (req.body.camera?.password === '••••••••') delete req.body.camera.password;

    const store = await Store.findByIdAndUpdate(
      req.params.id, { $set: req.body }, { new: true, runValidators: true }
    ).populate('project', 'name');

    if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, store: safeStore(store) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/stores/:id  (soft delete)
router.delete('/:id', authorize('director', 'chairperson', 'admin'), async (req, res) => {
  try {
    await Store.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Store removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/stores/:id/test-camera — Live snapshot test
router.post('/:id/test-camera',
  authorize('director', 'chairperson', 'builder', 'site_engineer', 'admin'),
  async (req, res) => {
    try {
      const store = await Store.findById(req.params.id);
      if (!store) return res.status(404).json({ success: false, message: 'Store not found' });
      if (!store.camera?.enabled)
        return res.status(400).json({ success: false, message: 'Camera is not enabled for this store' });
      if (!store.camera?.ip)
        return res.status(400).json({ success: false, message: 'Camera IP not configured' });

      const result = await saveSnapshot(store.camera, store._id.toString());

      // Record test result (without overwriting password)
      await Store.findByIdAndUpdate(store._id, {
        'camera.lastTestAt':      new Date(),
        'camera.lastTestSuccess': result.success,
        'camera.lastTestError':   result.error || '',
      });

      if (result.success) {
        res.json({
          success:     true,
          message:     '📷 Camera snapshot captured successfully!',
          snapshotUrl: result.url,
          resolvedUrl: getSnapshotUrl(store.camera),
        });
      } else {
        res.status(400).json({
          success: false,
          message: `Camera test failed: ${result.error}`,
          resolvedUrl: getSnapshotUrl(store.camera),
        });
      }
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
