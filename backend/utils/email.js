const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!process.env.SMTP_USER) {
      console.log(`[EMAIL SKIPPED] To: ${to}, Subject: ${subject}`);
      return;
    }
    const mailOptions = {
      from: `"${process.env.FROM_NAME || 'Construction App'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️  Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Email error: ${error.message}`);
  }
};

// Email templates
const emailTemplates = {
  orderApproved: (order, approverName) => ({
    subject: `✅ Order ${order.orderNumber} Approved`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1e40af;color:white;padding:20px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;">🏗️ Construction App</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px;">
          <h3>Order Approved</h3>
          <p>Your order <strong>${order.orderNumber}</strong> has been approved by <strong>${approverName}</strong>.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;background:#e2e8f0;font-weight:bold;">Order #</td><td style="padding:8px;">${order.orderNumber}</td></tr>
            <tr><td style="padding:8px;background:#e2e8f0;font-weight:bold;">Status</td><td style="padding:8px;color:green;">Approved</td></tr>
            <tr><td style="padding:8px;background:#e2e8f0;font-weight:bold;">Items</td><td style="padding:8px;">${order.items?.length || 0} items</td></tr>
          </table>
          <p style="color:#64748b;font-size:12px;">Login to the Construction App to view full details.</p>
        </div>
      </div>`
  }),

  orderRejected: (order, reason) => ({
    subject: `❌ Order ${order.orderNumber} Rejected`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#dc2626;color:white;padding:20px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;">🏗️ Construction App</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px;">
          <h3>Order Rejected</h3>
          <p>Your order <strong>${order.orderNumber}</strong> has been rejected.</p>
          <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
          <p style="color:#64748b;font-size:12px;">Login to the Construction App to view full details.</p>
        </div>
      </div>`
  }),

  vendorOrderNotification: (order, vendor) => ({
    subject: `📦 New Order ${order.orderNumber} Assigned`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#059669;color:white;padding:20px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;">🏗️ Construction App</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px;">
          <h3>New Order Assigned to You</h3>
          <p>Dear <strong>${vendor.name}</strong>,</p>
          <p>A new order <strong>${order.orderNumber}</strong> has been assigned to you. Please login to accept or reject it.</p>
          <h4>Order Items:</h4>
          <ul>${order.items?.map(i => `<li>${i.materialName} - ${i.quantity} ${i.unit}</li>`).join('') || ''}</ul>
          <p><strong>Priority:</strong> ${order.priority?.toUpperCase() || 'MEDIUM'}</p>
          ${order.requiredByDate ? `<p><strong>Required By:</strong> ${new Date(order.requiredByDate).toLocaleDateString()}</p>` : ''}
          <p style="color:#64748b;font-size:12px;">Login to accept this order: <a href="${process.env.CLIENT_URL}">${process.env.CLIENT_URL}</a></p>
        </div>
      </div>`
  }),

  orderDispatched: (order, dispatch) => ({
    subject: `🚛 Order ${order.orderNumber} Dispatched`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#7c3aed;color:white;padding:20px;border-radius:8px 8px 0 0;">
          <h2 style="margin:0;">🏗️ Construction App</h2>
        </div>
        <div style="background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-radius:0 0 8px 8px;">
          <h3>Order Dispatched</h3>
          <p>Order <strong>${order.orderNumber}</strong> has been dispatched.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:8px;background:#e2e8f0;font-weight:bold;">Driver Name</td><td style="padding:8px;">${dispatch.driverName}</td></tr>
            <tr><td style="padding:8px;background:#e2e8f0;font-weight:bold;">Driver Phone</td><td style="padding:8px;">${dispatch.driverPhone}</td></tr>
            <tr><td style="padding:8px;background:#e2e8f0;font-weight:bold;">Vehicle No.</td><td style="padding:8px;">${dispatch.vehicleNumber}</td></tr>
            <tr><td style="padding:8px;background:#e2e8f0;font-weight:bold;">Dispatch Date</td><td style="padding:8px;">${new Date(dispatch.dispatchDate).toLocaleDateString()}</td></tr>
            ${dispatch.estimatedArrival ? `<tr><td style="padding:8px;background:#e2e8f0;font-weight:bold;">Est. Arrival</td><td style="padding:8px;">${new Date(dispatch.estimatedArrival).toLocaleDateString()}</td></tr>` : ''}
          </table>
          <p style="color:#64748b;font-size:12px;">Login to the Construction App to track delivery.</p>
        </div>
      </div>`
  })
};

module.exports = { sendEmail, emailTemplates };
