const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendWhatsApp, sendBulk, msg } = require('./whatsapp');

// ── In-app notification ───────────────────────────────────────────────────────
const createNotification = async ({ recipients, title, message, type, relatedOrder, relatedProject, link }) => {
  try {
    await Notification.create({ recipients, title, message, type, relatedOrder, relatedProject, link });
  } catch (error) {
    console.error('Notification error:', error.message);
  }
};

const getUsersByRoles = async (roles) => {
  return await User.find({ role: { $in: roles }, isActive: true }).select('_id email name phone');
};

// ── Notify approvers on new order ────────────────────────────────────────────
const notifyApprovers = async (order, requestorName) => {
  const approvers = await getUsersByRoles(['director', 'builder', 'chairperson', 'admin']);
  const ids = approvers.map(u => u._id);

  await createNotification({
    recipients: ids,
    title: 'New Order Request',
    message: `${requestorName} has raised order ${order.orderNumber} for approval.`,
    type: 'order_created',
    relatedOrder: order._id,
    relatedProject: order.project,
    link: `/orders/${order._id}`,
  });

  // WhatsApp to all approvers
  const phones = approvers.map(u => u.phone).filter(Boolean);
  await sendBulk(phones, msg.orderCreated(order, requestorName));

  return approvers;
};

// ── Notify requestor about approval / rejection ───────────────────────────────
const notifyOrderStatus = async (order, status, remarks) => {
  const title   = status === 'approved' ? '✅ Order Approved' : '❌ Order Rejected';
  const message = status === 'approved'
    ? `Your order ${order.orderNumber} has been approved.`
    : `Your order ${order.orderNumber} has been rejected. Reason: ${remarks || 'N/A'}`;

  await createNotification({
    recipients: [order.requestedBy],
    title, message,
    type: status === 'approved' ? 'order_approved' : 'order_rejected',
    relatedOrder: order._id,
    relatedProject: order.project,
    link: `/orders/${order._id}`,
  });

  // WhatsApp to requester
  const requester = await User.findById(order.requestedBy).select('phone');
  if (requester?.phone) {
    if (status === 'approved') {
      await sendWhatsApp(requester.phone, msg.orderApproved(order));
    } else {
      await sendWhatsApp(requester.phone, msg.orderRejected(order, remarks));
    }
  }
};

// ── Notify vendor when order is sent ─────────────────────────────────────────
const notifyVendorOrder = async (order, vendor) => {
  if (vendor?.phone) {
    await sendWhatsApp(vendor.phone, msg.orderSentToVendor(order));
  }
};

// ── Notify on dispatch ───────────────────────────────────────────────────────
const notifyDispatch = async (order) => {
  const directors  = await getUsersByRoles(['director', 'builder', 'chairperson']);
  const recipients = [...directors.map(u => u._id), order.requestedBy];

  await createNotification({
    recipients,
    title: '🚛 Order Dispatched',
    message: `Order ${order.orderNumber} has been dispatched. Driver: ${order.dispatchDetails?.driverName}, Vehicle: ${order.dispatchDetails?.vehicleNumber}`,
    type: 'order_dispatched',
    relatedOrder: order._id,
    relatedProject: order.project,
    link: `/orders/${order._id}`,
  });

  // WhatsApp to directors + requestor
  const phones = directors.map(u => u.phone).filter(Boolean);
  const requester = await User.findById(order.requestedBy).select('phone');
  if (requester?.phone) phones.push(requester.phone);
  await sendBulk(phones, msg.orderDispatched(order));
};

// ── Notify on delivery ───────────────────────────────────────────────────────
const notifyDelivery = async (order, challanNo) => {
  const directors  = await getUsersByRoles(['director', 'builder', 'chairperson']);
  const recipients = [...directors.map(u => u._id), order.requestedBy];

  await createNotification({
    recipients,
    title: '📦 Order Delivered',
    message: `Order ${order.orderNumber} has been delivered. Please verify the challan.`,
    type: 'order_delivered',
    relatedOrder: order._id,
    relatedProject: order.project,
    link: `/deliveries/${order._id}`,
  });

  // WhatsApp to directors
  const phones = directors.map(u => u.phone).filter(Boolean);
  await sendBulk(phones, msg.deliveryReceived(order, challanNo));
};

module.exports = {
  createNotification, getUsersByRoles,
  notifyApprovers, notifyOrderStatus, notifyVendorOrder,
  notifyDispatch, notifyDelivery,
};
