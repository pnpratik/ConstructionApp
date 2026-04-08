import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, CreditCard, AlertCircle, CheckCircle, Plus, Upload, Trash2, X, FileText } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:5001';

const METHOD_LABELS = {
  upi:    { label: '📱 UPI',       color: 'bg-purple-100 text-purple-700' },
  neft:   { label: '🏦 NEFT',      color: 'bg-blue-100 text-blue-700' },
  rtgs:   { label: '🏦 RTGS',      color: 'bg-indigo-100 text-indigo-700' },
  cheque: { label: '📄 Cheque',    color: 'bg-yellow-100 text-yellow-700' },
  cash:   { label: '💵 Cash',      color: 'bg-green-100 text-green-700' },
  other:  { label: '🔗 Other',     color: 'bg-gray-100 text-gray-700' },
};

const inr = (n) => `₹${(Number(n)||0).toLocaleString('en-IN')}`;

// ─── Record Payment Modal ─────────────────────────────────────────────────────
function PaymentModal({ order, onClose, onSaved }) {
  const [form, setForm]       = useState({ amount: order.outstanding || '', method: 'upi', upiTransactionId: '', chequeNumber: '', neftRef: '', otherRef: '', remarks: '' });
  const [file, setFile]       = useState(null);
  const [saving, setSaving]   = useState(false);
  const fileRef               = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.method) return toast.error('Amount and method required');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      fd.append('orderId', order._id);
      if (file) fd.append('screenshot', file);
      await api.post('/payments', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Payment recorded!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-gray-800 flex items-center gap-2"><IndianRupee size={18} /> Record Payment</h2>
            <p className="text-xs text-gray-500 mt-0.5">{order.orderNumber} · {order.vendor?.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Outstanding summary */}
          <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex justify-between text-sm">
            <div><p className="text-gray-500">Order Total</p><p className="font-bold text-gray-800">{inr(order.totalAmount)}</p></div>
            <div><p className="text-gray-500">Already Paid</p><p className="font-bold text-green-600">{inr(order.paid)}</p></div>
            <div><p className="text-gray-500">Outstanding</p><p className="font-bold text-orange-600">{inr(order.outstanding)}</p></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Amount (₹) *</label>
              <input type="number" className="input" required min="1" value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})} />
            </div>
            <div>
              <label className="label">Payment Method *</label>
              <select className="input" value={form.method} onChange={e => setForm({...form, method: e.target.value})}>
                {Object.entries(METHOD_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference fields */}
          {form.method === 'upi' && (
            <div>
              <label className="label">UPI Transaction ID / UTR</label>
              <input className="input font-mono" placeholder="e.g. 4125XXXXX789" value={form.upiTransactionId}
                onChange={e => setForm({...form, upiTransactionId: e.target.value})} />
            </div>
          )}
          {form.method === 'cheque' && (
            <div>
              <label className="label">Cheque Number</label>
              <input className="input font-mono" placeholder="e.g. 001234" value={form.chequeNumber}
                onChange={e => setForm({...form, chequeNumber: e.target.value})} />
            </div>
          )}
          {(form.method === 'neft' || form.method === 'rtgs') && (
            <div>
              <label className="label">NEFT/RTGS Reference</label>
              <input className="input font-mono" placeholder="UTR number" value={form.neftRef}
                onChange={e => setForm({...form, neftRef: e.target.value})} />
            </div>
          )}

          {/* Screenshot */}
          <div>
            <label className="label">Payment Screenshot / Receipt</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-blue-300 hover:text-blue-500">
                <Upload size={14} /> {file ? file.name : 'Upload proof'}
              </button>
              {file && <button type="button" onClick={() => setFile(null)} className="text-red-400 hover:text-red-600"><X size={14} /></button>}
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
          </div>

          <div>
            <label className="label">Remarks</label>
            <input className="input" placeholder="Optional note" value={form.remarks}
              onChange={e => setForm({...form, remarks: e.target.value})} />
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <IndianRupee size={14} />}
              {saving ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PaymentTracker() {
  const [outstanding, setOutstanding] = useState([]);
  const [payments,    setPayments]    = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [payOrder,    setPayOrder]    = useState(null);
  const [tab,         setTab]         = useState('outstanding');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/payments/outstanding'),
      api.get('/payments'),
      api.get('/payments/summary'),
    ]).then(([o, p, s]) => {
      setOutstanding(o.data.outstanding || []);
      setPayments(p.data.payments || []);
      setSummary(s.data.summary || null);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const totalOutstanding = outstanding.reduce((s, o) => s + o.outstanding, 0);

  return (
    <div className="space-y-6">
      {payOrder && <PaymentModal order={payOrder} onClose={() => setPayOrder(null)} onSaved={load} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-800">Payment Tracker</h1>
        <p className="text-gray-500">Track payments against delivered orders — UPI, NEFT, Cheque, Cash</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-green-500 to-emerald-600 text-white p-4">
          <p className="text-green-100 text-sm">Total Paid</p>
          <p className="text-2xl font-bold mt-1">{inr(summary?.totalPaid)}</p>
          <p className="text-green-200 text-xs mt-1">{summary?.totalCount || 0} transactions</p>
        </div>
        <div className="card bg-gradient-to-br from-orange-500 to-red-500 text-white p-4">
          <p className="text-orange-100 text-sm">Outstanding</p>
          <p className="text-2xl font-bold mt-1">{inr(totalOutstanding)}</p>
          <p className="text-orange-200 text-xs mt-1">{outstanding.length} invoices pending</p>
        </div>
        {(summary?.byMethod || []).slice(0, 2).map(m => (
          <div key={m._id} className="card p-4">
            <p className="text-gray-500 text-sm">{METHOD_LABELS[m._id]?.label || m._id}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{inr(m.total)}</p>
            <p className="text-gray-400 text-xs mt-1">{m.count} payments</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'outstanding', label: `⏳ Outstanding (${outstanding.length})` },
          { key: 'history',     label: `✅ Payment History (${payments.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              tab === t.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Outstanding Tab */}
      {tab === 'outstanding' && (
        <div className="card">
          {outstanding.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">All invoices paid!</p>
              <p className="text-gray-400 text-sm">No outstanding payments</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  <th className="table-header">Order</th>
                  <th className="table-header">Vendor</th>
                  <th className="table-header">Project</th>
                  <th className="table-header">Total</th>
                  <th className="table-header">Paid</th>
                  <th className="table-header">Outstanding</th>
                  <th className="table-header">Delivered</th>
                  <th className="table-header">Action</th>
                </tr></thead>
                <tbody>
                  {outstanding.map(o => (
                    <tr key={o._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="table-cell">
                        <Link to={`/orders/${o._id}`} className="text-blue-600 hover:underline font-medium text-sm">{o.orderNumber}</Link>
                      </td>
                      <td className="table-cell text-sm text-gray-700">{o.vendor?.name || '—'}</td>
                      <td className="table-cell text-sm text-gray-500">{o.project?.name || '—'}</td>
                      <td className="table-cell text-sm font-medium">{inr(o.totalAmount)}</td>
                      <td className="table-cell text-sm text-green-600 font-medium">{inr(o.paid)}</td>
                      <td className="table-cell">
                        <span className="text-sm font-bold text-orange-600">{inr(o.outstanding)}</span>
                      </td>
                      <td className="table-cell text-xs text-gray-400">
                        {o.deliveredAt ? new Date(o.deliveredAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="table-cell">
                        <button onClick={() => setPayOrder(o)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700">
                          <Plus size={11} /> Pay
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="card">
          {payments.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No payment records yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  <th className="table-header">Date</th>
                  <th className="table-header">Order</th>
                  <th className="table-header">Vendor</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Method</th>
                  <th className="table-header">Reference</th>
                  <th className="table-header">Paid By</th>
                  <th className="table-header">Proof</th>
                </tr></thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="table-cell text-xs text-gray-400">
                        {new Date(p.paidAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'2-digit' })}
                      </td>
                      <td className="table-cell">
                        <Link to={`/orders/${p.order?._id}`} className="text-blue-600 hover:underline text-sm">
                          {p.order?.orderNumber || '—'}
                        </Link>
                      </td>
                      <td className="table-cell text-sm text-gray-700">{p.vendor?.name || '—'}</td>
                      <td className="table-cell font-bold text-green-700">{inr(p.amount)}</td>
                      <td className="table-cell">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${METHOD_LABELS[p.method]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {METHOD_LABELS[p.method]?.label || p.method}
                        </span>
                      </td>
                      <td className="table-cell text-xs font-mono text-gray-500">
                        {p.upiTransactionId || p.chequeNumber || p.neftRef || p.otherRef || '—'}
                      </td>
                      <td className="table-cell text-xs text-gray-500">{p.paidBy?.name || '—'}</td>
                      <td className="table-cell">
                        {p.screenshot
                          ? <a href={`${API_BASE}${p.screenshot}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">📎 View</a>
                          : <span className="text-gray-300 text-xs">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
