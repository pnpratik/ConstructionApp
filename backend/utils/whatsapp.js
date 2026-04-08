/**
 * whatsapp.js — WhatsApp notifications via Twilio
 *
 * When TWILIO_SID / TWILIO_TOKEN are not set in .env,
 * messages are logged to console (mock mode) so the app
 * works without credentials and activates automatically once they are added.
 *
 * Setup:
 *   1. Create free account at twilio.com
 *   2. Enable WhatsApp sandbox (for testing) or apply for business number
 *   3. Add to .env:
 *      TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *      TWILIO_TOKEN=your_auth_token
 *      TWILIO_WHATSAPP_FROM=+14155238886   (Twilio sandbox number)
 */

const isMock = () => !process.env.TWILIO_SID || !process.env.TWILIO_TOKEN;

// Format Indian mobile: 9876500001 → +919876500001
const formatIndian = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.startsWith('+')) return digits;
  return null;
};

// Core send function
const sendWhatsApp = async (toPhone, message) => {
  const to = formatIndian(toPhone);
  if (!to) return { success: false, error: 'Invalid phone number' };

  if (isMock()) {
    console.log(`\n📱 [WhatsApp MOCK] ───────────────────────`);
    console.log(`   To: ${to}`);
    console.log(`   ${message.replace(/\n/g, '\n   ')}`);
    console.log(`───────────────────────────────────────\n`);
    return { success: true, mock: true };
  }

  try {
    const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    const msg = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM || '+14155238886'}`,
      to:   `whatsapp:${to}`,
      body: message,
    });
    return { success: true, sid: msg.sid };
  } catch (err) {
    console.error(`[WhatsApp] Send failed to ${to}: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// Send to multiple numbers
const sendBulk = async (phones, message) => {
  const results = await Promise.allSettled(
    phones.filter(Boolean).map(p => sendWhatsApp(p, message))
  );
  return results;
};

// ─── Pre-built message templates ─────────────────────────────────────────────

const msg = {
  orderCreated: (order, requesterName) =>
`🏗️ *Nirmaan – New Order Request*

Order: *${order.orderNumber}*
Raised by: ${requesterName}
Project: ${order.project?.name || ''}
Items: ${(order.items || []).length} items | Est. ₹${(order.totalAmount || 0).toLocaleString('en-IN')}

👉 Approve or reject at: ${process.env.CLIENT_URL || 'http://localhost:5173'}/orders/${order._id}`,

  orderApproved: (order) =>
`✅ *Nirmaan – Order Approved*

Order *${order.orderNumber}* has been approved.
Project: ${order.project?.name || ''}

It will now be sent to the vendor.
View: ${process.env.CLIENT_URL || 'http://localhost:5173'}/orders/${order._id}`,

  orderRejected: (order, reason) =>
`❌ *Nirmaan – Order Rejected*

Order *${order.orderNumber}* has been rejected.
Reason: ${reason || 'N/A'}

Please revise and resubmit.
View: ${process.env.CLIENT_URL || 'http://localhost:5173'}/orders/${order._id}`,

  orderSentToVendor: (order) =>
`📋 *Nirmaan – New Order Received*

Order *${order.orderNumber}* has been placed with you.
Project: ${order.project?.name || ''}
Items: ${(order.items || []).map(i => `${i.materialName} – ${i.quantity} ${i.unit}`).join(', ')}

Please confirm acceptance:
${process.env.CLIENT_URL || 'http://localhost:5173'}/orders/${order._id}`,

  orderDispatched: (order) => {
    const d = order.dispatchDetails || {};
    return `🚛 *Nirmaan – Order Dispatched*

Order *${order.orderNumber}* is on the way!
Driver: ${d.driverName || '—'} | Vehicle: ${d.vehicleNumber || '—'}
${d.expectedDelivery ? `Expected delivery: ${new Date(d.expectedDelivery).toLocaleDateString('en-IN')}` : ''}

Upload challan when received:
${process.env.CLIENT_URL || 'http://localhost:5173'}/deliveries/${order._id}/upload`;
  },

  deliveryReceived: (order, challanNo) =>
`📦 *Nirmaan – Delivery Received*

Order *${order.orderNumber}* has been delivered.
Challan #: ${challanNo || '—'}
Project: ${order.project?.name || ''}

Please verify and sign off.
View: ${process.env.CLIENT_URL || 'http://localhost:5173'}/deliveries`,

  lowStock: (material, project) =>
`⚠️ *Nirmaan – Low Stock Alert*

Material: *${material.materialName}*
Project: ${project || ''}
Available: ${material.totalDelivered - material.totalUsed} ${material.unit}

Please raise a new order.
${process.env.CLIENT_URL || 'http://localhost:5173'}/materials/requirements`,

  attendanceSummary: (date, total, contractors) =>
`👷 *Nirmaan – Daily Attendance*

Date: ${date}
Total workers on site: *${total}*

${contractors.map(c => `• ${c.contractorName}: ${c.presentCount} workers`).join('\n')}

View dashboard: ${process.env.CLIENT_URL || 'http://localhost:5173'}`,
};

module.exports = { sendWhatsApp, sendBulk, msg, isMock };
