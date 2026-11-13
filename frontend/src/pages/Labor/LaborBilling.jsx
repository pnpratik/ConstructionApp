import React, { useState, useEffect } from 'react';
import { IndianRupee, Users, CheckCircle, Edit2, X, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const TYPE_COLORS = {
  civil:      'bg-orange-100 text-orange-700',
  plumbing:   'bg-teal-100 text-teal-700',
  color:      'bg-pink-100 text-pink-700',
  lift:       'bg-yellow-100 text-yellow-700',
  electrical: 'bg-purple-100 text-purple-700',
  tile:       'bg-blue-100 text-blue-700',
  acp:        'bg-gray-100 text-gray-700',
  aluminium:  'bg-indigo-100 text-indigo-700',
  door_lock:  'bg-green-100 text-green-700',
};

const METHOD_LABELS = {
  cash:   '💵 Cash',
  upi:    '📱 UPI',
  cheque: '📄 Cheque',
  neft:   '🏦 NEFT',
  rtgs:   '🏦 RTGS',
  other:  '🔗 Other',
};

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function monthLabel(m) {
  const [y, mo] = m.split('-');
  return new Date(y, mo - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

// ── Pay Modal ─────────────────────────────────────────────────────────────────
function PayModal({ row, month, onClose, onSaved }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    amount: row.outstanding || row.totalDue,
    method: 'cash',
    reference: '',
    remarks: '',
  });
  const [saving, setSaving] = useState(false);
  const [paid, setPaid]     = useState(false);

  const handlePay = async () => {
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount');
    setSaving(true);
    try {
      await api.post('/labor-billing/pay', {
        contractorUserId: row.userId,
        contractorId:     row.contractorId,
        month,
        amount:           Number(form.amount),
        method:           form.method,
        reference:        form.reference,
        remarks:          form.remarks,
        daysPresent:      row.daysPresent,
        totalWorkerDays:  row.totalWorkerDays,
        dailyRate:        row.dailyRate,
        totalDue:         row.totalDue,
      });
      toast.success(`Payment of ${inr(form.amount)} recorded for ${row.name}`);
      onSaved();
      if (form.method === 'cheque') {
        setPaid(true);
      } else {
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleWriteCheque = () => {
    navigate('/cheque-writing', {
      state: {
        payTo:    row.name,
        amount:   form.amount,
        date:     new Date().toISOString().slice(0, 10),
        remarks:  `Labor payment ${monthLabel(month)}`,
        chequeNo: form.reference || '',
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-800">Pay Labor</h2>
            <p className="text-xs text-gray-500 mt-0.5">{row.name} · {monthLabel(month)}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 bg-orange-50 rounded-xl p-3 text-center text-sm">
            <div>
              <p className="text-xs text-gray-400">Worker-Days</p>
              <p className="font-bold text-gray-800">{row.totalWorkerDays}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Total Due</p>
              <p className="font-bold text-orange-600">{inr(row.totalDue)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Already Paid</p>
              <p className="font-bold text-green-600">{inr(row.totalPaid)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" className="input" min="1" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
                {Object.entries(METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {form.method !== 'cash' && (
            <div>
              <label className="label">Reference / UTR</label>
              <input className="input font-mono" placeholder="Transaction reference" value={form.reference}
                onChange={e => setForm({ ...form, reference: e.target.value })} />
            </div>
          )}

          <div>
            <label className="label">Remarks (optional)</label>
            <input className="input" placeholder="e.g. Advance for next month" value={form.remarks}
              onChange={e => setForm({ ...form, remarks: e.target.value })} />
          </div>

          {paid ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <CheckCircle size={16} className="text-green-600" />
                <p className="text-sm text-green-700 font-medium">Payment recorded! Write the cheque now?</p>
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="btn-secondary flex-1 justify-center">Skip</button>
                <button onClick={handleWriteCheque}
                  className="btn-primary flex-1 justify-center gap-2 flex items-center bg-blue-600 hover:bg-blue-700">
                  <FileText size={14} /> Write Cheque
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
              <button onClick={handlePay} disabled={saving} className="btn-primary flex-1 justify-center">
                {saving
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <IndianRupee size={14} />}
                {saving ? 'Saving…' : 'Record Payment'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Rate Edit Inline ──────────────────────────────────────────────────────────
function RateCell({ row, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [rate, setRate]       = useState(row.dailyRate);

  const save = async () => {
    try {
      await api.put(`/labor-billing/rate/${row.contractorId}`, { dailyRate: rate });
      toast.success('Rate updated');
      setEditing(false);
      onUpdated();
    } catch {
      toast.error('Failed to update rate');
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input type="number" className="input w-24 py-1 text-sm" value={rate}
          onChange={e => setRate(e.target.value)} onKeyDown={e => e.key === 'Enter' && save()} autoFocus />
        <button onClick={save} className="p-1 text-green-600 hover:bg-green-50 rounded"><CheckCircle size={14} /></button>
        <button onClick={() => { setEditing(false); setRate(row.dailyRate); }} className="p-1 text-gray-400 hover:bg-gray-50 rounded"><X size={14} /></button>
      </div>
    );
  }

  return (
    <button onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-sm font-semibold text-gray-800 hover:text-blue-600 group">
      {inr(rate)}/day
      <Edit2 size={11} className="opacity-0 group-hover:opacity-100 text-blue-400" />
    </button>
  );
}

// ── Payment History Expandable ────────────────────────────────────────────────
function PaymentHistory({ payments }) {
  const [open, setOpen] = useState(false);
  if (!payments?.length) return null;
  return (
    <div className="mt-2">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs text-blue-500 font-medium">
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {payments.length} payment{payments.length > 1 ? 's' : ''} this month
      </button>
      {open && (
        <div className="mt-2 space-y-1 pl-2 border-l-2 border-blue-100">
          {payments.map((p, i) => (
            <div key={i} className="text-xs text-gray-600 flex justify-between">
              <span>{new Date(p.paidAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })} · {METHOD_LABELS[p.method] || p.method}</span>
              <span className="font-semibold text-green-600">{inr(p.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function LaborBilling() {
  const { isAdmin } = useAuth();
  const [month, setMonth]       = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [payRow, setPayRow]     = useState(null);

  const load = () => {
    setLoading(true);
    api.get(`/labor-billing?month=${month}`)
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [month]);

  const rows = data?.rows || [];
  const totals = data?.totals || {};

  return (
    <div className="space-y-5 animate-slide-up">
      {payRow && <PayModal row={payRow} month={month} onClose={() => setPayRow(null)} onSaved={load} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Labor Billing</h1>
          <p className="text-sm text-gray-500">Track contractor attendance → calculate dues → record payments</p>
        </div>
        <input type="month" className="input w-auto"
          value={month} onChange={e => setMonth(e.target.value)} />
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Due',    value: inr(totals.totalDue),    bg: 'bg-gradient-to-br from-blue-600 to-blue-500', sub: `${monthLabel(month)}` },
            { label: 'Total Paid',   value: inr(totals.totalPaid),   bg: 'bg-gradient-to-br from-emerald-600 to-emerald-500', sub: `${rows.filter(r => r.totalPaid > 0).length} contractors paid` },
            { label: 'Outstanding',  value: inr(totals.outstanding), bg: totals.outstanding > 0 ? 'bg-gradient-to-br from-orange-500 to-red-400' : 'bg-gradient-to-br from-gray-400 to-gray-500', sub: `${rows.filter(r => r.outstanding > 0).length} pending` },
          ].map(c => (
            <div key={c.label} className={`${c.bg} text-white rounded-2xl p-4 shadow-md`}>
              <p className="text-white/70 text-xs font-medium">{c.label}</p>
              <p className="text-2xl font-bold mt-0.5">{c.value}</p>
              <p className="text-white/60 text-xs mt-1">{c.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Contractor rows */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No contractors found</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {rows.map(row => (
              <div key={row.userId} className={`card p-4 border-l-4 ${row.outstanding > 0 ? 'border-orange-400' : 'border-green-400'}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-gray-800">{row.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[row.type] || 'bg-gray-100 text-gray-600'}`}>
                      {row.type}
                    </span>
                    {row.company && <p className="text-xs text-gray-400 mt-0.5">{row.company}</p>}
                  </div>
                  {isAdmin() && row.outstanding > 0 && (
                    <button onClick={() => setPayRow(row)}
                      className="btn-primary py-1.5 px-3 text-xs flex-shrink-0">
                      Pay {inr(row.outstanding)}
                    </button>
                  )}
                  {row.outstanding === 0 && row.totalDue > 0 && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                      <CheckCircle size={13} /> Cleared
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 rounded-xl p-2.5 mt-2">
                  <div>
                    <p className="text-[10px] text-gray-400">Worker-Days</p>
                    <p className="text-sm font-bold text-gray-800">{row.totalWorkerDays}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Rate</p>
                    {isAdmin() ? <RateCell row={row} onUpdated={load} /> : <p className="text-sm font-bold">{inr(row.dailyRate)}</p>}
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Total Due</p>
                    <p className="text-sm font-bold text-blue-600">{inr(row.totalDue)}</p>
                  </div>
                </div>

                {/* Payment progress bar */}
                {row.totalDue > 0 && (
                  <div className="mt-2.5">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${Math.min((row.totalPaid / row.totalDue) * 100, 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-right">
                      {inr(row.totalPaid)} paid · {inr(row.outstanding)} outstanding
                    </p>
                  </div>
                )}

                <PaymentHistory payments={row.payments} />
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block card p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs text-gray-500 font-semibold px-5 py-3">Contractor</th>
                  <th className="text-center text-xs text-gray-500 font-semibold px-3 py-3">Type</th>
                  <th className="text-center text-xs text-gray-500 font-semibold px-3 py-3">Worker-Days</th>
                  <th className="text-center text-xs text-gray-500 font-semibold px-3 py-3">Rate / Day</th>
                  <th className="text-right text-xs text-gray-500 font-semibold px-3 py-3">Total Due</th>
                  <th className="text-right text-xs text-gray-500 font-semibold px-3 py-3">Paid</th>
                  <th className="text-right text-xs text-gray-500 font-semibold px-5 py-3">Outstanding</th>
                  {isAdmin() && <th className="text-center text-xs text-gray-500 font-semibold px-3 py-3">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(row => (
                  <tr key={row.userId} className={`hover:bg-gray-50 ${row.outstanding > 0 ? '' : 'opacity-70'}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-800 text-sm">{row.name}</p>
                      <p className="text-xs text-gray-400">{row.company}</p>
                      <PaymentHistory payments={row.payments} />
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[row.type] || 'bg-gray-100 text-gray-600'}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <p className="text-sm font-bold text-gray-800">{row.totalWorkerDays}</p>
                      <p className="text-[10px] text-gray-400">{row.daysPresent} days</p>
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      {isAdmin()
                        ? <RateCell row={row} onUpdated={load} />
                        : <span className="text-sm font-medium">{inr(row.dailyRate)}</span>
                      }
                    </td>
                    <td className="px-3 py-3.5 text-right font-bold text-blue-600 text-sm">{inr(row.totalDue)}</td>
                    <td className="px-3 py-3.5 text-right text-sm">
                      {row.totalPaid > 0
                        ? <span className="text-green-600 font-semibold">{inr(row.totalPaid)}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {row.outstanding > 0
                        ? <span className="text-sm font-bold text-orange-600">{inr(row.outstanding)}</span>
                        : row.totalDue > 0
                          ? <span className="flex items-center justify-end gap-1 text-xs text-green-600 font-semibold"><CheckCircle size={12} /> Cleared</span>
                          : <span className="text-gray-300 text-xs">No data</span>}
                    </td>
                    {isAdmin() && (
                      <td className="px-3 py-3.5 text-center">
                        {row.outstanding > 0 && (
                          <button onClick={() => setPayRow(row)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 mx-auto">
                            <IndianRupee size={11} /> Pay
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td colSpan={4} className="px-5 py-3 text-sm font-bold text-gray-700">Total</td>
                  <td className="px-3 py-3 text-right font-bold text-blue-600">{inr(totals.totalDue)}</td>
                  <td className="px-3 py-3 text-right font-bold text-green-600">{inr(totals.totalPaid)}</td>
                  <td className={`px-5 py-3 text-right font-bold ${totals.outstanding > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{inr(totals.outstanding)}</td>
                  {isAdmin() && <td />}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}

      {/* Tip */}
      <div className="text-xs text-gray-400 text-center pb-4">
        Worker-Days = sum of all workers present across all marked days · Rate is per worker per day · Click rate to edit
      </div>
    </div>
  );
}
