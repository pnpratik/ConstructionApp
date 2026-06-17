import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Plus, IndianRupee, TrendingUp, AlertCircle, Trash2, Edit2, X, Check } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { key: 'civil',       label: 'Civil Work',       color: '#f97316' },
  { key: 'plumbing',    label: 'Plumbing',          color: '#14b8a6' },
  { key: 'electrical',  label: 'Electrical',        color: '#8b5cf6' },
  { key: 'tiles',       label: 'Tiles & Flooring',  color: '#3b82f6' },
  { key: 'acp',         label: 'ACP / Cladding',    color: '#6366f1' },
  { key: 'aluminium',   label: 'Aluminium & Glass', color: '#0ea5e9' },
  { key: 'doors',       label: 'Doors & Hardware',  color: '#84cc16' },
  { key: 'paint',       label: 'Painting',          color: '#ec4899' },
  { key: 'material',    label: 'Raw Material',      color: '#f59e0b' },
  { key: 'labour',      label: 'Labour',            color: '#10b981' },
  { key: 'equipment',   label: 'Equipment',         color: '#64748b' },
  { key: 'other',       label: 'Other',             color: '#94a3b8' },
];

const catColor = (key) => CATEGORIES.find(c => c.key === key)?.color || '#94a3b8';
const catLabel = (key) => CATEGORIES.find(c => c.key === key)?.label || key;
const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default function BudgetTracker() {
  const { isAdmin } = useAuth();
  const [projects, setProjects]   = useState([]);
  const [projectId, setProjectId] = useState('');
  const [summary, setSummary]     = useState(null);
  const [entries, setEntries]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState({ category: 'civil', allocatedAmount: '', description: '' });

  useEffect(() => {
    api.get('/projects').then(r => {
      const list = r.data.projects || [];
      setProjects(list);
      if (list.length) setProjectId(list[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    Promise.all([
      api.get(`/budget?project=${projectId}`),
      api.get(`/budget/summary/${projectId}`),
    ]).then(([e, s]) => {
      setEntries(e.data.entries || []);
      setSummary(s.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, [projectId]);

  const reload = () => {
    if (!projectId) return;
    Promise.all([
      api.get(`/budget?project=${projectId}`),
      api.get(`/budget/summary/${projectId}`),
    ]).then(([e, s]) => { setEntries(e.data.entries || []); setSummary(s.data); });
  };

  const openAdd  = () => { setEditing(null); setForm({ category: 'civil', allocatedAmount: '', description: '' }); setShowModal(true); };
  const openEdit = (entry) => { setEditing(entry); setForm({ category: entry.category, allocatedAmount: entry.allocatedAmount, description: entry.description || '' }); setShowModal(true); };

  const save = async () => {
    if (!form.allocatedAmount || isNaN(form.allocatedAmount)) return toast.error('Enter a valid amount');
    try {
      if (editing) {
        await api.put(`/budget/${editing._id}`, { ...form, allocatedAmount: Number(form.allocatedAmount) });
        toast.success('Updated');
      } else {
        await api.post('/budget', { ...form, allocatedAmount: Number(form.allocatedAmount), project: projectId });
        toast.success('Budget entry added');
      }
      setShowModal(false);
      reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this budget entry?')) return;
    await api.delete(`/budget/${id}`);
    toast.success('Deleted');
    reload();
  };

  const pct = summary?.percentUsed || 0;
  const pctColor = pct >= 90 ? '#ef4444' : pct >= 75 ? '#f59e0b' : '#10b981';

  const pieData = (summary?.allocatedByCategory || []).map(c => ({
    name: catLabel(c._id), value: c.total, color: catColor(c._id),
  }));

  const barData = (summary?.allocatedByCategory || []).map(c => ({
    name: catLabel(c._id).slice(0, 8),
    allocated: c.total,
    spent: summary?.spentByCategory?.[c._id] || 0,
  }));

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Budget Tracker</h1>
          <p className="text-gray-400 text-sm mt-0.5">Track allocated vs actual spend per project</p>
        </div>
        <div className="flex gap-2">
          <select className="select w-auto" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          {isAdmin() && <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Budget</button>}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Budget',   value: fmt(summary?.totalAllocated), icon: IndianRupee, bg: 'bg-blue-600' },
              { label: 'Spent',          value: fmt(summary?.totalSpent),     icon: TrendingUp,  bg: 'bg-red-500' },
              { label: 'Remaining',      value: fmt(summary?.remaining),      icon: Check,       bg: 'bg-emerald-500' },
              { label: 'Used',           value: `${Math.round(pct)}%`,        icon: AlertCircle, bg: pct >= 80 ? 'bg-red-500' : 'bg-amber-500' },
            ].map(c => (
              <div key={c.label} className="card flex items-center gap-3 p-4">
                <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <c.icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{c.label}</p>
                  <p className="text-lg font-bold text-gray-900 leading-none mt-0.5">{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {summary?.totalAllocated > 0 && (
            <div className="card p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-gray-700">Overall Budget Utilisation</span>
                <span className="font-bold" style={{ color: pctColor }}>{Math.round(pct)}%</span>
              </div>
              <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: pctColor }} />
              </div>
              {pct >= 80 && (
                <div className="flex items-center gap-2 mt-2 text-red-600 text-xs font-semibold">
                  <AlertCircle size={14} /> Budget {pct >= 100 ? 'exceeded' : 'nearing limit'} — review allocations
                </div>
              )}
            </div>
          )}

          {/* Charts */}
          {pieData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Budget by Category</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">Allocated vs Spent</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ left: -20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                    <Bar dataKey="allocated" fill="#3b82f6" radius={[4,4,0,0]} name="Allocated" />
                    <Bar dataKey="spent"     fill="#ef4444" radius={[4,4,0,0]} name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Category breakdown table */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Category Breakdown</h3>
              <span className="text-xs text-gray-400">{entries.length} entries</span>
            </div>
            {entries.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <IndianRupee size={36} className="mx-auto opacity-20 mb-2" />
                <p className="text-sm">No budget entries yet</p>
                {isAdmin() && <button onClick={openAdd} className="btn-primary mt-4 mx-auto"><Plus size={15} /> Add First Entry</button>}
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {entries.map(entry => {
                  const spent = summary?.spentByCategory?.[entry.category] || 0;
                  const entryPct = entry.allocatedAmount > 0 ? Math.round((spent / entry.allocatedAmount) * 100) : 0;
                  const col = entryPct >= 90 ? '#ef4444' : entryPct >= 70 ? '#f59e0b' : '#10b981';
                  return (
                    <div key={entry._id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: catColor(entry.category) }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-800">{catLabel(entry.category)}</p>
                          <p className="text-xs font-bold" style={{ color: col }}>{entryPct}%</p>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(entryPct, 100)}%`, background: col }} />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-gray-400">Spent: <span className="font-semibold text-gray-700">{fmt(spent)}</span></span>
                          <span className="text-xs text-gray-400">Budget: <span className="font-semibold text-gray-700">{fmt(entry.allocatedAmount)}</span></span>
                        </div>
                        {entry.description && <p className="text-xs text-gray-400 mt-0.5">{entry.description}</p>}
                      </div>
                      {isAdmin() && (
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => openEdit(entry)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                          <button onClick={() => del(entry._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Budget Entry' : 'Add Budget Entry'}</h2>
            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Category</label>
              <select className="select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Allocated Amount (₹)</label>
              <input type="number" className="input" placeholder="e.g. 500000" value={form.allocatedAmount} onChange={e => setForm({ ...form, allocatedAmount: e.target.value })} />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <input type="text" className="input" placeholder="e.g. Foundation + columns for Block A" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={save} className="btn-primary flex-1 justify-center">{editing ? 'Update' : 'Add Entry'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
