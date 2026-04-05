const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/notifications - For current user
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ recipients: req.user._id })
      .populate('relatedOrder', 'orderNumber status')
      .populate('relatedProject', 'name')
      .sort('-createdAt')
      .limit(50);
    const unreadCount = await Notification.countDocuments({
      recipients: req.user._id,
      readBy: { $ne: req.user._id }
    });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/notifications/:id/read
router.put('/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id }
    });
    res.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/notifications/read-all
router.put('/read-all/mark', async (req, res) => {
  try {
    await Notification.updateMany(
      { recipients: req.user._id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
