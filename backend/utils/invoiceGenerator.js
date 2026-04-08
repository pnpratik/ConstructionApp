/**
 * invoiceGenerator.js — GST-compliant PDF invoice using pdfkit
 *
 * Generates a professional GST invoice PDF for any approved order.
 * Returns a Buffer that can be streamed or saved.
 *
 * Tax logic:
 *   - Intra-state (same state): CGST 9% + SGST 9% = 18%
 *   - Inter-state: IGST 18%
 *   - Default: CGST + SGST (Gujarat-based assumption)
 */

const PDFDocument = require('pdfkit');

// Rupee formatter
const inr = (n) => `Rs. ${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const generateInvoicePDF = (order) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = 515; // usable width
    const vendor   = order.vendor   || {};
    const project  = order.project  || {};
    const items    = order.items    || [];
    const company  = { name: 'Nirmaan Construction Pvt. Ltd.', address: 'Ahmedabad, Gujarat – 380001', gstin: 'GSTIN: 24XXXXX0000X1ZX', phone: '+91 98765 00001' };

    // ─── HEADER ────────────────────────────────────────────────────────────
    doc.rect(40, 40, W, 70).fill('#1d4ed8');
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('NIRMAAN', 50, 52);
    doc.fontSize(9).font('Helvetica').text('Construction Management', 50, 76);
    doc.fontSize(18).font('Helvetica-Bold').text('TAX INVOICE', 350, 52, { width: 200, align: 'right' });
    doc.fontSize(9).font('Helvetica').fillColor('#bfdbfe')
      .text(`Invoice No: ${order.orderNumber}`, 350, 76, { width: 200, align: 'right' });

    // ─── SELLER / BUYER BLOCK ──────────────────────────────────────────────
    doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('FROM (Seller)', 40, 125);
    doc.font('Helvetica').fillColor('#374151')
      .text(vendor.name || 'Vendor Name', 40, 138)
      .text(vendor.address || 'Vendor Address', 40, 150)
      .text(vendor.gst ? `GSTIN: ${vendor.gst}` : 'GSTIN: N/A', 40, 162)
      .text(`Phone: ${vendor.phone || '—'}`, 40, 174);

    doc.fillColor('#1e293b').font('Helvetica-Bold').text('TO (Buyer)', 300, 125);
    doc.font('Helvetica').fillColor('#374151')
      .text(company.name, 300, 138)
      .text(company.address, 300, 150)
      .text(company.gstin, 300, 162)
      .text(company.phone, 300, 174);

    // Invoice meta
    doc.moveTo(40, 195).lineTo(580, 195).strokeColor('#e2e8f0').stroke();
    doc.fillColor('#374151').fontSize(8)
      .text(`Invoice Date: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`, 40, 202)
      .text(`Project: ${project.name || '—'}`, 200, 202)
      .text(`Due Date: ${new Date(Date.now() + 15*86400000).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`, 420, 202);

    // ─── TABLE HEADER ─────────────────────────────────────────────────────
    const tableTop = 225;
    doc.rect(40, tableTop, W, 20).fill('#1e293b');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    const cols = { sno: 40, desc: 60, hsn: 260, qty: 320, unit: 360, rate: 400, amt: 460, total: 510 };
    doc.text('#',          cols.sno,  tableTop + 6);
    doc.text('Description', cols.desc, tableTop + 6);
    doc.text('HSN',         cols.hsn,  tableTop + 6);
    doc.text('Qty',         cols.qty,  tableTop + 6);
    doc.text('Unit',        cols.unit, tableTop + 6);
    doc.text('Rate',        cols.rate, tableTop + 6);
    doc.text('Amount',      cols.amt,  tableTop + 6);

    // ─── TABLE ROWS ───────────────────────────────────────────────────────
    let y = tableTop + 20;
    let subtotal = 0;

    items.forEach((item, i) => {
      const rate   = Number(item.unitPrice)  || 0;
      const qty    = Number(item.quantity)   || 0;
      const amount = rate * qty;
      subtotal += amount;

      const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(40, y, W, 18).fill(bg);
      doc.fillColor('#374151').fontSize(8).font('Helvetica');
      doc.text(String(i + 1),            cols.sno,  y + 5);
      doc.text(item.materialName || '—', cols.desc, y + 5, { width: 190, ellipsis: true });
      doc.text(item.hsnCode || '—',      cols.hsn,  y + 5);
      doc.text(String(qty),              cols.qty,  y + 5);
      doc.text(item.unit || 'Nos',       cols.unit, y + 5);
      doc.text(inr(rate),                cols.rate, y + 5);
      doc.text(inr(amount),              cols.amt,  y + 5);
      y += 18;
    });

    // ─── TOTALS ───────────────────────────────────────────────────────────
    doc.moveTo(40, y + 5).lineTo(580, y + 5).strokeColor('#cbd5e1').stroke();
    y += 15;

    const cgst    = subtotal * 0.09;
    const sgst    = subtotal * 0.09;
    const grandTotal = subtotal + cgst + sgst;

    const totRow = (label, value, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fillColor('#374151').fontSize(9);
      doc.text(label, 360, y);
      doc.text(inr(value), cols.amt, y);
      y += 16;
    };

    totRow('Subtotal (before tax)', subtotal);
    totRow('CGST @ 9%', cgst);
    totRow('SGST @ 9%', sgst);

    doc.rect(355, y - 2, W - 315, 20).fill('#1d4ed8');
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10)
      .text('GRAND TOTAL', 360, y + 3)
      .text(inr(grandTotal), cols.amt, y + 3);
    y += 30;

    // Amount in words
    doc.fillColor('#475569').fontSize(8).font('Helvetica')
      .text(`Amount in words: ${numberToWords(Math.round(grandTotal))} Rupees Only`, 40, y + 5);

    // ─── BANK / TERMS ─────────────────────────────────────────────────────
    y += 30;
    doc.moveTo(40, y).lineTo(580, y).strokeColor('#e2e8f0').stroke();
    y += 10;

    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(8).text('Terms & Conditions', 40, y);
    y += 12;
    doc.fillColor('#64748b').font('Helvetica').fontSize(7.5)
      .text('1. Payment due within 15 days of invoice date.', 40, y); y += 11;
    doc.text('2. Goods once sold will not be taken back unless defective.', 40, y); y += 11;
    doc.text('3. Subject to Ahmedabad jurisdiction.', 40, y); y += 11;
    doc.text('4. This is a computer-generated invoice and does not require a signature.', 40, y);

    // ─── FOOTER ───────────────────────────────────────────────────────────
    doc.rect(40, 780, W, 1).fill('#e2e8f0');
    doc.fillColor('#94a3b8').fontSize(7).font('Helvetica')
      .text('Generated by Nirmaan – Construction Management System', 40, 786, { align: 'center', width: W });

    doc.end();
  });
};

// Minimal number-to-words for Indian amounts
const numberToWords = (n) => {
  if (n === 0) return 'Zero';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
                 'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
                 'Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  const convert = (num) => {
    if (num < 20)  return ones[num];
    if (num < 100) return tens[Math.floor(num/10)] + (num%10 ? ' '+ones[num%10] : '');
    if (num < 1000) return ones[Math.floor(num/100)] + ' Hundred' + (num%100 ? ' '+convert(num%100) : '');
    if (num < 100000) return convert(Math.floor(num/1000)) + ' Thousand' + (num%1000 ? ' '+convert(num%1000) : '');
    if (num < 10000000) return convert(Math.floor(num/100000)) + ' Lakh' + (num%100000 ? ' '+convert(num%100000) : '');
    return convert(Math.floor(num/10000000)) + ' Crore' + (num%10000000 ? ' '+convert(num%10000000) : '');
  };
  return convert(n);
};

module.exports = { generateInvoicePDF };
