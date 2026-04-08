const express = require('express');
const router  = express.Router();
const Delivery    = require('../models/Delivery');
const Order       = require('../models/Order');
const MaterialRequirement = require('../models/MaterialRequirement');
const { protect } = require('../middleware/auth');
const { uploadDelivery } = require('../middleware/upload');
const { notifyDelivery }  = require('../utils/notificationHelper');
const { saveSnapshot, findStoreForOrder } = require('../utils/cameraCapture');

router.use(protect);

// GET /api/deliveries
router.get('/', async (req, res) => {
  try {
    const deliveries = await Delivery.find()
      .populate({ path: 'order', populate: [
        { path: 'project', select: 'name' },
        { path: 'vendor',  select: 'name' },
      ]})
      .populate('uploadedBy', 'name role')
      .populate('receivedBy', 'name role')
      .sort('-createdAt');
    res.json({ success: true, deliveries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/deliveries/:orderId
router.post('/:orderId', uploadDelivery.fields([
  { name: 'challan', maxCount: 1 },
  { name: 'photos',  maxCount: 5 },
]), async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'dispatched')
      return res.status(400).json({ success: false, message: 'Order must be dispatched first' });

    const challanFile = req.files?.challan?.[0]?.filename
      ? `/uploads/challans/${req.files.challan[0].filename}` : null;
    const photos = (req.files?.photos || []).map(f => `/uploads/challans/${f.filename}`);

    if (!challanFile)   return res.status(400).json({ success: false, message: 'Challan file is required' });
    if (!photos.length) return res.status(400).json({ success: false, message: 'At least one delivery photo is required' });

    const delivery = await Delivery.create({
      order:         order._id,
      uploadedBy:    req.user._id,
      challanFile,
      challanNumber: req.body.challanNumber,
      photos,
      deliveredAt:   new Date(),
      remarks:       req.body.remarks,
    });

    order.status = 'delivered';
    order.deliveryDetails = { challanFile, challanNumber: req.body.challanNumber, photos, deliveredAt: new Date(), isConfirmed: false };
    await order.save();

    for (const item of order.items) {
      await MaterialRequirement.findOneAndUpdate(
        { project: order.project, materialName: item.materialName },
        { $inc: { totalDelivered: item.quantity } }
      );
    }

    // Auto CCTV Snapshot
    let snapshotInfo = { success: false };
    try {
      const store = await findStoreForOrder(order.items);
      if (store) {
        console.log(`[CCTV] Store matched: "${store.name}" — capturing snapshot...`);
        const snapResult = await saveSnapshot(store.camera, store._id.toString());
        snapshotInfo = {
          url:        snapResult.url  || null,
          capturedAt: new Date(),
          storeName:  store.name,
          cameraIp:   store.camera.ip,
          success:    snapResult.success,
          error:      snapResult.error || null,
        };
        delivery.storeSnapshot = snapshotInfo;
        await delivery.save();
        console.log(snapResult.success ? `[CCTV] Snapshot saved: ${snapResult.url}` : `[CCTV] Snapshot failed: ${snapResult.error}`);
      }
    } catch (snapErr) {
      console.error(`[CCTV] Error: ${snapErr.message}`);
    }

    await notifyDelivery(order);

    res.status(201).json({
      success: true,
      delivery,
      snapshotCaptured: snapshotInfo.success,
      snapshotStore:    snapshotInfo.storeName || null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/deliveries/:id/sign
router.put('/:id/sign', async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    delivery.digitalSignature = req.body.signature;
    delivery.receivedBy       = req.user._id;
    delivery.isConfirmed      = true;
    delivery.confirmedAt      = new Date();
    await delivery.save();
    await Order.findByIdAndUpdate(delivery.order, {
      'deliveryDetails.digitalSignature': req.body.signature,
      'deliveryDetails.receivedBy':       req.user._id,
      'deliveryDetails.isConfirmed':      true,
    });
    res.json({ success: true, delivery });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/deliveries/:id
router.get('/:id', async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id)
      .populate({ path: 'order', populate: [
        { path: 'project',     select: 'name' },
        { path: 'vendor',      select: 'name email' },
        { path: 'requestedBy', select: 'name role' },
      ]})
      .populate('uploadedBy', 'name role')
      .populate('receivedBy', 'name role');
    if (!delivery) return res.status(404).json({ success: false, message: 'Delivery not found' });
    res.json({ success: true, delivery });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
