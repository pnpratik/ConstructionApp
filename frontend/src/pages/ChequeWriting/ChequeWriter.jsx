import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Printer, PenLine, RotateCcw, ChevronLeft } from 'lucide-react';
import { amountInWords } from '../../utils/numberToWords';

const COMPANY = {
  name:    'Nirmaan Construction Pvt. Ltd.',
  bank:    'HDFC Bank',
  branch:  'Navrangpura, Ahmedabad',
  account: '50100 123456 789',
  ifsc:    'HDFC0001234',
  address: 'Plot 12, Ring Road, Ahmedabad – 380 009',
};

const today = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const fmt = (d) => {
  if (!d) return '  /  /      ';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function ChequePreview({ form }) {
  const words = form.amount ? amountInWords(Number(form.amount)) : '';
  const amtFormatted = form.amount
    ? Number(form.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '';

  return (
    <div id="cheque-print-area" className="cheque-paper font-mono select-none">
      {/* Bank header */}
      <div className="cheque-header">
        <div className="flex-1">
          <div className="cheque-bank-name">{COMPANY.bank}</div>
          <div className="cheque-sub">{COMPANY.branch}</div>
          <div className="cheque-sub">A/C: {COMPANY.account} &nbsp;·&nbsp; IFSC: {COMPANY.ifsc}</div>
        </div>
        <div className="cheque-date-box">
          <div className="cheque-label">Date</div>
          <div className="cheque-date-value">{fmt(form.date)}</div>
        </div>
      </div>

      {/* Account holder */}
      <div className="cheque-company-name">{COMPANY.name}</div>

      {/* Pay to */}
      <div className="cheque-row">
        <span className="cheque-field-label">Pay&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
        <span className="cheque-field-value cheque-pay-to">
          {form.payTo || <span className="cheque-placeholder">_________________________________</span>}
        </span>
        <span className="cheque-bearer-text">&nbsp;&nbsp;OR BEARER</span>
      </div>

      {/* Amount in words */}
      <div className="cheque-row cheque-words-row">
        <span className="cheque-field-label">Rupees&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
        <span className="cheque-field-value flex-1 cheque-words">
          {words
            ? words.replace('Rupees ', '')
            : <span className="cheque-placeholder">______________________________________________</span>}
        </span>
      </div>

      {/* Amount box */}
      <div className="cheque-amount-section">
        <div className="flex-1" />
        <div className="cheque-amount-box">
          <div className="cheque-amount-label">₹</div>
          <div className="cheque-amount-value">{amtFormatted || '____________'}</div>
        </div>
      </div>

      {/* Cheque number + signature */}
      <div className="cheque-footer">
        <div className="cheque-micr">
          <div className="cheque-label">Remarks: {form.remarks || '—'}</div>
        </div>
        <div className="cheque-signature-box">
          <div className="cheque-sig-line" />
          <div className="cheque-label text-center">Authorised Signatory</div>
        </div>
      </div>

      {/* MICR band */}
      <div className="cheque-micr-band">
        <span>⠃⠻ ██████ ⠃⠻</span>
        <span>⠃⠻ 123456 ⠃⠻</span>
        <span>⠃⠻ 50100123456789 ⠃⠻</span>
      </div>
    </div>
  );
}

export default function ChequeWriter() {
  const location = useLocation();
  const navigate  = useNavigate();
  const prefill   = location.state || {};

  const [form, setForm] = useState({
    payTo:   prefill.payTo   || '',
    amount:  prefill.amount  || '',
    date:    prefill.date    || today(),
    remarks: prefill.remarks || '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePrint = () => window.print();

  const handleReset = () => setForm({
    payTo: '', amount: '', date: today(), remarks: ''
  });

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Page-level print CSS injected inline */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #cheque-print-area, #cheque-print-area * { visibility: visible !important; }
          #cheque-print-area {
            position: fixed !important;
            top: 0; left: 0;
            width: 100vw;
            box-shadow: none !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
          }
        }
        .cheque-paper {
          background: linear-gradient(135deg, #fffde7 0%, #fff9e0 100%);
          border: 1.5px solid #c9aa71;
          border-radius: 10px;
          padding: 18px 22px 10px;
          min-height: 200px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          position: relative;
          overflow: hidden;
        }
        .cheque-paper::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: repeating-linear-gradient(
            45deg, transparent, transparent 12px,
            rgba(200,170,113,0.07) 12px, rgba(200,170,113,0.07) 14px
          );
          pointer-events: none;
        }
        .cheque-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 4px; }
        .cheque-bank-name { font-size: 15px; font-weight: 700; color: #1a3a6b; letter-spacing: 0.5px; font-family: sans-serif; }
        .cheque-sub { font-size: 10px; color: #555; font-family: sans-serif; }
        .cheque-company-name { font-size: 11px; font-weight: 600; color: #1a3a6b; font-family: sans-serif; margin-bottom: 10px; }
        .cheque-date-box { border: 1px solid #c9aa71; border-radius: 4px; padding: 4px 8px; min-width: 120px; text-align: center; }
        .cheque-date-value { font-size: 13px; font-weight: 700; letter-spacing: 1px; color: #1a1a1a; }
        .cheque-label { font-size: 9px; color: #888; font-family: sans-serif; text-transform: uppercase; letter-spacing: 0.5px; }
        .cheque-row { display: flex; align-items: baseline; border-bottom: 1px solid #c9aa71; margin-bottom: 8px; padding-bottom: 2px; }
        .cheque-words-row { margin-top: 2px; }
        .cheque-field-label { font-size: 11px; color: #444; white-space: nowrap; font-family: sans-serif; font-weight: 600; }
        .cheque-field-value { font-size: 13px; font-weight: 700; color: #1a1a1a; flex: 1; }
        .cheque-pay-to { font-size: 14px; }
        .cheque-words { font-size: 11px; font-weight: 600; font-family: sans-serif; line-height: 1.4; }
        .cheque-placeholder { color: #bbb; font-weight: 400; }
        .cheque-bearer-text { font-size: 10px; color: #555; white-space: nowrap; font-family: sans-serif; }
        .cheque-amount-section { display: flex; align-items: flex-end; margin-bottom: 8px; }
        .cheque-amount-box { border: 2px solid #1a3a6b; border-radius: 6px; padding: 4px 10px; min-width: 140px; text-align: right; background: rgba(255,255,255,0.6); }
        .cheque-amount-label { font-size: 9px; color: #888; font-family: sans-serif; }
        .cheque-amount-value { font-size: 15px; font-weight: 800; color: #1a1a1a; letter-spacing: 1px; }
        .cheque-footer { display: flex; align-items: flex-end; justify-content: space-between; margin-top: 4px; }
        .cheque-micr { flex: 1; }
        .cheque-cheque-no { font-size: 14px; font-weight: 700; letter-spacing: 2px; color: #1a1a1a; }
        .cheque-signature-box { min-width: 160px; text-align: right; }
        .cheque-sig-line { border-bottom: 1px solid #c9aa71; width: 140px; margin-left: auto; margin-bottom: 3px; height: 32px; }
        .cheque-micr-band { background: #1a3a6b; color: #fff; margin: 10px -22px -10px; padding: 5px 22px; display: flex; justify-content: space-between; font-size: 11px; letter-spacing: 1px; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px; font-family: 'Courier New', monospace; }
      `}</style>

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Cheque Writing</h1>
          <p className="text-sm text-gray-500">Fill details and print a cheque</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* ── Form ── */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <PenLine size={16} className="text-blue-600" />
            <h2 className="font-semibold text-gray-700">Cheque Details</h2>
          </div>

          <div>
            <label className="label">Pay To *</label>
            <input className="input" placeholder="Contractor / vendor name"
              value={form.payTo} onChange={e => set('payTo', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" className="input" placeholder="0"
                value={form.amount} onChange={e => set('amount', e.target.value)} min="1" />
            </div>
            <div>
              <label className="label">Cheque Date *</label>
              <input type="date" className="input"
                value={form.date} onChange={e => set('date', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Remarks (optional)</label>
            <input className="input" placeholder="e.g. Labor payment for August 2026"
              value={form.remarks} onChange={e => set('remarks', e.target.value)} />
          </div>

          {/* Bank info (read-only) */}
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700 space-y-1">
            <p className="font-semibold text-blue-800">Bank Account Details</p>
            <p>{COMPANY.bank} · {COMPANY.branch}</p>
            <p>A/C: {COMPANY.account} &nbsp;·&nbsp; IFSC: {COMPANY.ifsc}</p>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleReset}
              className="btn-secondary flex-1 justify-center gap-2 flex items-center">
              <RotateCcw size={13} /> Reset
            </button>
            <button onClick={handlePrint}
              className="btn-primary flex-1 justify-center gap-2 flex items-center">
              <Printer size={14} /> Print Cheque
            </button>
          </div>
        </div>

        {/* ── Live Preview ── */}
        <div className="space-y-3">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Live Preview</p>
          <ChequePreview form={form} />
          {form.amount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-xs text-amber-700">
              <span className="font-semibold">In words: </span>{amountInWords(Number(form.amount))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
