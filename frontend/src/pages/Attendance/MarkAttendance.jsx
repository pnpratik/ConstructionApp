import React, { useState, useEffect } from 'react';
import { Users, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const TYPE_LABELS = {
  civil: 'Civil', plumbing: 'Plumbing', color: 'Painting',
  lift: 'Lift', electrical: 'Electrical', tile: 'Tile',
  acp: 'ACP', aluminium: 'Aluminium', door_lock: 'Door & Lock',
};

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

// ─── Contractor self-mark panel ────────────────────────────────────────────────
function SelfMarkPanel({ todayRecord, onSaved }) {
  const [count, setCount] = useState(todayRecord?.presentCount ?? '');
  const [note, setNote] = useState(todayRecord?.note ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (count === '' || parseInt(count) < 0) {
      toast.error('Please enter a valid worker count');
      return;
    }
    setSaving(true);
    try {
      await api.post('/attendance', { presentCount: parseInt(count), note });
      toast.success('Attendance marked successfully!');
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card max-w-md mx-auto p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
          <Users size={22} className="text-blue-600" />
        </div>
        <div>
          <h2 className="font-bold text-gray-800 text-lg">Mark Today's Attendance</h2>
          <p className="text-sm text-gray-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {todayRecord && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle size={16} />
          Already marked: <strong>{todayRecord.presentCount} workers present</strong>. You can update below.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="label">Workers Present Today <span className="text-red-500">*</span></label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCount(c => Math.max(0, parseInt(c || 0) - 1))}
              className="w-10 h-10 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold text-lg flex items-center justify-center"
            >−</button>
            <input
              type="number" min="0"
              className="input text-center text-2xl font-bold flex-1"
              value={count}
              onChange={e => setCount(e.target.value)}
              placeholder="0"
            />
            <button
              onClick={() => setCount(c => parseInt(c || 0) + 1)}
              className="w-10 h-10 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-lg flex items-center justify-center"
            >+</button>
          </div>
        </div>

        <div>
          <label className="label">Note (optional)</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. 2 on leave, 1 joining tomorrow"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary w-full justify-center">
          {saving
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <CheckCircle size={16} />}
          {saving ? 'Saving…' : (todayRecord ? 'Update Attendance' : 'Mark Attendance')}
        </button>
      </div>
    </div>
  );
}

// ─── Director / Engineer overview panel ────────────────────────────────────────
function OverviewPanel({ contractors, onSave }) {
  const [counts, setCounts] = useState({});
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    const init = {};
    contractors.forEach(c => {
      // Preserve any edited value; only set from server if not yet touched
      init[c._id] = c.presentCount !== null ? c.presentCount : '';
    });
    setCounts(init);
  }, [contractors]);

  const handleSave = async (contractor) => {
    const raw   = counts[contractor._id];
    const count = parseInt(raw);
    if (raw === '' || raw === undefined || isNaN(count) || count < 0) {
      toast.error('Enter a valid worker count (0 or more)');
      return;
    }
    setSaving(contractor._id);
    try {
      await api.post('/attendance', { presentCount: count, contractorId: contractor._id });
      toast.success(`Updated: ${contractor.name} — ${count} workers`);
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(null);
    }
  };

  const totalPresent = contractors.reduce((s, c) => {
    const v = counts[c._id];
    return s + (v !== '' && !isNaN(parseInt(v)) ? parseInt(v) : 0);
  }, 0);

  const unmarked = contractors.filter(c => c.presentCount === null);
  const marked   = contractors.filter(c => c.presentCount !== null);

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-gray-800">Mark / Update Contractor Attendance</h2>
            <p className="text-sm text-gray-400">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          {/* Live total — updates as you type */}
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">{totalPresent}</p>
            <p className="text-xs text-gray-400">total workers today</p>
          </div>
        </div>

        {/* Unmarked contractors */}
        {unmarked.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-orange-500 uppercase mb-2">{unmarked.length} not yet marked</p>
            <div className="space-y-2">
              {unmarked.map(c => (
                <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[c.type] || 'bg-gray-100 text-gray-600'}`}>
                        {TYPE_LABELS[c.type] || c.type}
                      </span>
                      {c.company && <span className="text-xs text-gray-400 truncate">{c.company}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="number" min="0"
                      className="w-20 input text-center py-1.5"
                      placeholder="0"
                      value={counts[c._id] ?? ''}
                      onChange={e => setCounts(p => ({ ...p, [c._id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleSave(c)}
                    />
                    <button
                      onClick={() => handleSave(c)}
                      disabled={saving === c._id}
                      className="btn-primary py-1.5 px-3 text-sm"
                    >
                      {saving === c._id ? '…' : 'Save'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Already marked — always visible, no collapse */}
        {marked.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-600 uppercase mb-2">{marked.length} marked — tap count to update</p>
            <div className="space-y-2">
              {marked.map(c => (
                <div key={c._id} className="flex items-center gap-3 p-3 rounded-xl border border-green-100 bg-green-50">
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[c.type] || 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[c.type] || c.type}
                    </span>
                    {c.company && <span className="text-xs text-gray-400 ml-2">{c.company}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <input
                      type="number" min="0"
                      className="w-20 input text-center py-1.5"
                      value={counts[c._id] ?? c.presentCount}
                      onChange={e => setCounts(p => ({ ...p, [c._id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleSave(c)}
                    />
                    <button
                      onClick={() => handleSave(c)}
                      disabled={saving === c._id}
                      className="btn-primary py-1.5 px-3 text-sm"
                    >
                      {saving === c._id ? '…' : 'Update'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {contractors.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Users size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No contractors registered yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function MarkAttendance() {
  const { user } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [todayRecord, setTodayRecord] = useState(null);
  const [contractors, setContractors] = useState([]);

  const isContractor = user?.role?.includes('contractor');
  const isAdmin = ['director', 'site_engineer', 'builder', 'chairperson'].includes(user?.role);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isContractor) {
        const r = await api.get('/attendance/my-today');
        setTodayRecord(r.data.record);
      } else if (isAdmin) {
        const r = await api.get('/attendance/contractors');
        setContractors(r.data.contractors || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto md:max-w-none">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Worker Attendance</h1>
        <p className="text-sm text-gray-500">Record daily site workforce</p>
      </div>

      {isContractor && (
        <SelfMarkPanel todayRecord={todayRecord} onSaved={loadData} />
      )}

      {isAdmin && (
        <OverviewPanel contractors={contractors} onSave={loadData} />
      )}

      {!isContractor && !isAdmin && (
        <div className="card text-center py-16 text-gray-400">
          <Users size={48} className="mx-auto mb-3 opacity-30" />
          <p>Attendance is managed by contractors and site engineers.</p>
        </div>
      )}
    </div>
  );
}
