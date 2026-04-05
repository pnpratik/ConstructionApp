import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const CONTRACTOR_TYPES = [
  { value: 'civil', label: '🏗️ Civil Contractor' },
  { value: 'plumbing', label: '🔧 Plumbing Contractor' },
  { value: 'color', label: '🎨 Color / Paint Contractor' },
  { value: 'lift', label: '🛗 Lift Contractor' },
  { value: 'electrical', label: '⚡ Electric Contractor' },
  { value: 'tile', label: '🟦 Tile Contractor' },
  { value: 'acp', label: '🏢 ACP Contractor' },
  { value: 'aluminium', label: '🪟 Aluminium Contractor' },
  { value: 'door_lock', label: '🚪 Door & Lock Fitting Contractor' },
];

export default function ContractorForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ user: '', type: '', company: '', license: '', experience: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/auth/users').then(r => {
      const contractorRoles = ['civil_contractor', 'plumbing_contractor', 'color_contractor', 'lift_contractor', 'electric_contractor', 'tile_contractor', 'acp_contractor', 'aluminium_contractor', 'door_lock_contractor'];
      setUsers((r.data.users || []).filter(u => contractorRoles.includes(u.role)));
    });
    if (isEdit) {
      api.get(`/contractors/${id}`).then(r => {
        const c = r.data.contractor;
        setForm({ user: c.user?._id || '', type: c.type || '', company: c.company || '', license: c.license || '', experience: c.experience || '' });
      });
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) { await api.put(`/contractors/${id}`, form); toast.success('Contractor updated!'); }
      else { await api.post('/contractors', form); toast.success('Contractor added!'); }
      navigate('/contractors');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={20} /></button>
        <div><h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Contractor' : 'Add Contractor'}</h1></div>
      </div>
      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="label">User Account *</label>
          <select className="input" required value={form.user} onChange={e => setForm({ ...form, user: e.target.value })}>
            <option value="">Select user...</option>
            {users.map(u => <option key={u._id} value={u._id}>{u.name} — {u.email} ({u.role.replace(/_/g, ' ')})</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">User must have a contractor role assigned</p>
        </div>
        <div>
          <label className="label">Contractor Type *</label>
          <select className="input" required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="">Select type...</option>
            {CONTRACTOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div><label className="label">Company Name</label><input className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="e.g. Sharma Construction Pvt Ltd" /></div>
        <div><label className="label">License Number</label><input className="input" value={form.license} onChange={e => setForm({ ...form, license: e.target.value })} placeholder="e.g. GJ-CIV-2023-1234" /></div>
        <div><label className="label">Experience (years)</label><input type="number" className="input" value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} placeholder="5" /></div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
            {isEdit ? 'Update' : 'Add Contractor'}
          </button>
        </div>
      </form>
    </div>
  );
}
