import React, { useState, useEffect, useRef } from 'react';
import { Plus, Calendar, ChevronDown, Trash2, Edit2, X, CheckCircle, Clock, AlertCircle, PauseCircle } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const PHASES = [
  { key: 'foundation',    label: 'Foundation',        color: '#f97316', bg: '#fff7ed' },
  { key: 'structure',     label: 'Structure',         color: '#3b82f6', bg: '#eff6ff' },
  { key: 'plumbing',      label: 'Plumbing',          color: '#14b8a6', bg: '#f0fdfa' },
  { key: 'electrical',    label: 'Electrical',        color: '#8b5cf6', bg: '#f5f3ff' },
  { key: 'tiles',         label: 'Tiles & Flooring',  color: '#ec4899', bg: '#fdf2f8' },
  { key: 'finishing',     label: 'Finishing',         color: '#84cc16', bg: '#f7fee7' },
  { key: 'painting',      label: 'Painting',          color: '#f59e0b', bg: '#fffbeb' },
  { key: 'acp_aluminium', label: 'ACP & Aluminium',   color: '#6366f1', bg: '#eef2ff' },
  { key: 'doors',         label: 'Doors & Hardware',  color: '#64748b', bg: '#f8fafc' },
  { key: 'handover',      label: 'Handover',          color: '#10b981', bg: '#ecfdf5' },
  { key: 'other',         label: 'Other',             color: '#94a3b8', bg: '#f8fafc' },
];

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', icon: Clock,       color: 'text-gray-500', bg: 'bg-gray-100' },
  in_progress:  { label: 'In Progress', icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
  completed:    { label: 'Completed',   icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  delayed:      { label: 'Delayed',     icon: AlertCircle, color: 'text-red-600',  bg: 'bg-red-50' },
  on_hold:      { label: 'On Hold',     icon: PauseCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
};

const phaseInfo = (key) => PHASES.find(p => p.key === key) || PHASES[PHASES.length - 1];
const fmtDate   = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—';
const daysBetween = (a, b) => Math.max(1, Math.ceil((new Date(b) - new Date(a)) / 86400000));

function GanttBar({ phase, projectStart, totalDays }) {
  const pi = phaseInfo(phase.phase);
  const pStart  = new Date(projectStart);
  const pStart_ = new Date(phase.startDate);
  const pEnd    = new Date(phase.endDate);
  const offset  = Math.max(0, daysBetween(pStart, pStart_) - 1);
  const width   = daysBetween(pStart_, pEnd);
  const leftPct  = (offset / totalDays) * 100;
  const widthPct = Math.min((width / totalDays) * 100, 100 - leftPct);
  const prog = phase.progress || 0;

  return (
    <div className="relative h-8 rounded-lg overflow-hidden" style={{ marginLeft: `${leftPct}%`, width: `${widthPct}%`, background: pi.bg, border: `1.5px solid ${pi.color}30` }}>
      <div className="h-full rounded-lg transition-all duration-500" style={{ width: `${prog}%`, background: pi.color + '40' }} />
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: pi.color }}>{prog}%</span>
    </div>
  );
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default function WorkSchedule() {
  const { isAdmin } = useAuth();
  const [projects, setProjects]   = useState([]);
  const [projectId, setProjectId] = useState('');
  const [phases, setPhases]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm] = useState({
    phase: 'foundation', label: '', startDate: '', endDate: '',
    progress: 0, status: 'not_started', notes: '',
  });

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
    api.get(`/schedule?project=${projectId}`)
      .then(r => setPhases(r.data.phases || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  const reload = () => api.get(`/schedule?project=${projectId}`).then(r => setPhases(r.data.phases || []));

  const openAdd  = () => { setEditing(null); setForm({ phase: 'foundation', label: '', startDate: '', endDate: '', progress: 0, status: 'not_started', notes: '' }); setShowModal(true); };
  const openEdit = (p) => { setEditing(p); setForm({ phase: p.phase, label: p.label || '', startDate: p.startDate?.slice(0,10), endDate: p.endDate?.slice(0,10), progress: p.progress, status: p.status, notes: p.notes || '' }); setShowModal(true); };

  const save = async () => {
    if (!form.startDate || !form.endDate) return toast.error('Start and end dates required');
    if (new Date(form.endDate) <= new Date(form.startDate)) return toast.error('End date must be after start date');
    try {
      if (editing) {
        await api.put(`/schedule/${editing._id}`, { ...form, project: projectId });
        toast.success('Phase updated');
      } else {
        await api.post('/schedule', { ...form, project: projectId });
        toast.success('Phase added');
      }
      setShowModal(false);
      reload();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Remove this phase?')) return;
    await api.delete(`/schedule/${id}`);
    toast.success('Phase removed');
    reload();
  };

  const quickProgress = async (phase, newProg) => {
    const newStatus = newProg === 100 ? 'completed' : newProg > 0 ? 'in_progress' : 'not_started';
    await api.put(`/schedule/${phase._id}`, { ...phase, project: projectId, progress: newProg, status: newStatus });
    reload();
  };

  // Gantt bounds
  const allDates = phases.flatMap(p => [new Date(p.startDate), new Date(p.endDate)]);
  const projectStart = allDates.length ? new Date(Math.min(...allDates)) : new Date();
  const projectEnd   = allDates.length ? new Date(Math.max(...allDates)) : new Date(Date.now() + 30*86400000);
  const totalDays    = Math.max(daysBetween(projectStart, projectEnd), 30);

  const overall = phases.length > 0 ? Math.round(phases.reduce((s, p) => s + p.progress, 0) / phases.length) : 0;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Work Schedule</h1>
          <p className="text-gray-400 text-sm mt-0.5">Project phase timeline & progress tracking</p>
        </div>
        <div className="flex gap-2">
          <select className="select w-auto" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          {isAdmin() && <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Phase</button>}
        </div>
      </div>

      {/* Overall progress */}
      {phases.length > 0 && (
        <div className="card p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold text-gray-700 text-sm">Overall Project Progress</span>
            <span className="font-bold text-blue-600 text-lg">{overall}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-700" style={{ width: `${overall}%` }} />
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span>{phases.filter(p => p.status === 'completed').length} completed</span>
            <span>{phases.filter(p => p.status === 'in_progress').length} in progress</span>
            <span>{phases.filter(p => p.status === 'delayed').length} delayed</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : phases.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Calendar size={40} className="mx-auto opacity-20 mb-3" />
          <p className="text-sm">No phases added yet</p>
          {isAdmin() && <button onClick={openAdd} className="btn-primary mt-4 mx-auto"><Plus size={15} /> Add First Phase</button>}
        </div>
      ) : (
        <>
          {/* Gantt chart */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Gantt Chart</h3>
              <div className="text-xs text-gray-400">{fmtDate(projectStart)} → {fmtDate(projectEnd)}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left text-xs text-gray-400 font-medium px-5 py-2 w-36">Phase</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-3 py-2 w-28">Dates</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-3 py-2">Timeline</th>
                    <th className="w-10 px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {phases.map(p => {
                    const pi = phaseInfo(p.phase);
                    const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.not_started;
                    return (
                      <tr key={p._id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: pi.color }} />
                            <div>
                              <p className="text-xs font-semibold text-gray-800 leading-tight">{p.label || pi.label}</p>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-400">
                          <div>{fmtDate(p.startDate)}</div>
                          <div>{fmtDate(p.endDate)}</div>
                        </td>
                        <td className="px-3 py-3">
                          <GanttBar phase={p} projectStart={projectStart} totalDays={totalDays} />
                        </td>
                        <td className="px-3 py-3">
                          {isAdmin() && (
                            <div className="flex gap-1">
                              <button onClick={() => openEdit(p)} className="p-1 hover:bg-blue-50 rounded text-gray-400 hover:text-blue-600"><Edit2 size={13} /></button>
                              <button onClick={() => del(p._id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Phase cards with progress sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {phases.map(p => {
              const pi = phaseInfo(p.phase);
              const sc = STATUS_CONFIG[p.status] || STATUS_CONFIG.not_started;
              return (
                <div key={p._id} className="card p-4 border-l-4" style={{ borderColor: pi.color }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{p.label || pi.label}</p>
                      <p className="text-xs text-gray-400">{fmtDate(p.startDate)} → {fmtDate(p.endDate)}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range" min={0} max={100} step={5}
                      value={p.progress}
                      onChange={e => quickProgress(p, Number(e.target.value))}
                      disabled={!isAdmin()}
                      className="flex-1 h-1.5 accent-blue-500"
                    />
                    <span className="text-xs font-bold w-8 text-right" style={{ color: pi.color }}>{p.progress}%</span>
                  </div>
                  {p.notes && <p className="text-xs text-gray-400 mt-2">{p.notes}</p>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 text-lg">{editing ? 'Edit Phase' : 'Add Phase'}</h2>
            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">Phase Type</label>
              <select className="select" value={form.phase} onChange={e => setForm({ ...form, phase: e.target.value })}>
                {PHASES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Custom Label (optional)</label>
              <input type="text" className="input" placeholder="e.g. Foundation – Block A" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start Date</label>
                <input type="date" className="input" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" className="input" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Progress: {form.progress}%</label>
              <input type="range" min={0} max={100} step={5} className="w-full accent-blue-500" value={form.progress} onChange={e => setForm({ ...form, progress: Number(e.target.value) })} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Notes (optional)</label>
              <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this phase..." />
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={save} className="btn-primary flex-1 justify-center">{editing ? 'Update' : 'Add Phase'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
