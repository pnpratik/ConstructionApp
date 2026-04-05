const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const MaterialRequirement = require('../models/MaterialRequirement');
const { protect } = require('../middleware/auth');
const { uploadDelivery } = require('../middleware/upload');
const { notifyDelivery } = require('../utils/notificationHelper');

router.use(protect);

// GET /api/deliveries
router.get('/', async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate({ path: 'order', populate: [{ path: 'project', select: 'name' }, { path: 'vendor', select: 'name' }] })
      .populate('uploadedBy', 'name role')
      .populate('receivedBy', 'name role')
      .sort('-createdAt');
    res.json({ success: true, deliveries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/deliveries/:orderId - Upload challan + photos
router.post('/:orderId', uploadDelivery.fields([
  { name: 'challan', maxCount: 1 },
  { name: 'photos', maxCount: 5 }
]), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'dispatched') return res.status(400).json({ success: false, message: 'Order must be dispatched first' });

    const challanFile = req.files?.challan?.[0]?.filename
      ? `/uploads/challans/${req.files.challan[0].filename}` : null;
    const photos = (req.files?.photos || []).map(f => `/uploads/challans/${f.filename}`);

    if (!challanFile) return res.status(400).json({ success: false, message: 'Challan file is required' });
    if (photos.length === 0) return res.status(400).json({ success: false, message: 'At least one delivery photo is required' });

    const delivery = await Delivery.create({
      order: order._id,
      uploadedBy: req.user._id,
      challanFile,
      challanNumber: req.body.challanNumber,
      photos,
      deliveredAt: new Date(),
      remarks: req.body.remarks
    });

    // Update order status
    order.status = 'delivered';
    order.deliveryDetails = {
      challanFile,
      challanNumber: req.body.challanNumber,
      photos,
      deliveredAt: new Date(),
      isConfirmed: false
    };
    await order.save();

    // Update material requirement totals
    for (const item of order.items) {
      await MaterialRequirement.findOneAndUpdate(
        { project: order.project, materialName: item.materialName },
        { $inc: { totalDelivered: item.quantity } }
      );
    }

    // Notify
    await notifyDelivery(order);

    res.status(201).json({ success: true, delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/deliveries/:id/sign - Engineer digital signature
router.put('/:id/sign', async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });

    delivery.digitalSignature = req.body.signature;
    delivery.receivedBy = req.user._id;
    delivery.isConfirmed = true;
    delivery.confirmedAt = new Date();
    await delivery.save();

    // Also confirm on order
    await Order.findByIdAndUpdate(delivery.order, {
      'deliveryDetails.digitalSignature': req.body.signature,
      'deliveryDetails.receivedBy': req.user._id,
      'deliveryDetails.isConfirmed': true
    });

    res.json({ success: true, delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/deliveries/:id
router.get('/:id', async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate({ path: 'order', populate: [{ path: 'project', select: 'name' }, { path: 'vendor', select: 'name email' }, { path: 'requestedBy', select: 'name role' }] })
      .populate('uploadedBy', 'name role')
      .populate('receivedBy', 'name role');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.json({ success: true, delivery });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
