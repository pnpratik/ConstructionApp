const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Create an in-app notification
 */
const createNotification = async ({ recipients, title, message, type, relatedOrder, relatedProject, link }) => {
  try {
    await Notification.create({ recipients, title, message, type, relatedOrder, relatedProject, link });
  } catch (error) {
    console.error('Notification error:', error.message);
  }
};

/**
 * Get users by roles
 */
const getUsersByRoles = async (roles) => {
  return await User.find({ role: { $in: roles }, isActive: true }).select('_id email name');
};

/**
 * Notify approvers (director, builder, chairperson)
 */
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
    link: `/orders/${order._id}`
  });
  return approvers;
};

/**
 * Notify requestor about order approval/rejection
 */
const notifyOrderStatus = async (order, status, remarks) => {
  const title = status === 'approved' ? '✅ Order Approved' : '❌ Order Rejected';
  const message = status === 'approved'
    ? `Your order ${order.orderNumber} has been approved.`
    : `Your order ${order.orderNumber} has been rejected. Reason: ${remarks || 'N/A'}`;

  await createNotification({
    recipients: [order.requestedBy],
    title,
    message,
    type: status === 'approved' ? 'order_approved' : 'order_rejected',
    relatedOrder: order._id,
    relatedProject: order.project,
    link: `/orders/${order._id}`
  });
};

/**
 * Notify on dispatch
 */
const notifyDispatch = async (order) => {
  // Notify requestor + directors
  const directors = await getUsersByRoles(['director', 'builder', 'chairperson']);
  const recipients = [...directors.map(u => u._id), order.requestedBy];
  const dispatch = order.dispatchDetails;

  await createNotification({
    recipients,
    title: '🚛 Order Dispatched',
    message: `Order ${order.orderNumber} has been dispatched. Driver: ${dispatch.driverName}, Vehicle: ${dispatch.vehicleNumber}`,
    type: 'order_dispatched',
    relatedOrder: order._id,
    relatedProject: order.project,
    link: `/orders/${order._id}`
  });
};

/**
 * Notify on delivery
 */
const notifyDelivery = async (order) => {
  const directors = await getUsersByRoles(['director', 'builder', 'chairperson']);
  const recipients = [...directors.map(u => u._id), order.requestedBy];

  await createNotification({
    recipients,
    title: '📦 Order Delivered',
    message: `Order ${order.orderNumber} has been delivered. Please verify the challan.`,
    type: 'order_delivered',
    relatedOrder: order._id,
    relatedProject: order.project,
    link: `/deliveries/${order._id}`
  });
};

module.exports = { createNotification, getUsersByRoles, notifyApprovers, notifyOrderStatus, notifyDispatch, notifyDelivery };
