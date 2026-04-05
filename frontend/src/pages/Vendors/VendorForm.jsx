import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'steel', label: '🔩 Steel & Structure' },
  { value: 'brick_block', label: '🧱 Brick & Block' },
  { value: 'concrete_rmc', label: '🏗️ Concrete / RMC' },
  { value: 'cement', label: '🪨 Cement' },
  { value: 'plumbing_pipes_fittings', label: '🔧 Plumbing Pipes & Fittings' },
  { value: 'bath_fittings_ceramic', label: '🚿 Bath Fittings & Ceramic' },
  { value: 'electrical_cables', label: '⚡ Electrical Cables' },
  { value: 'electrical_accessories', label: '🔌 Electrical Accessories' },
  { value: 'tiles_ceramic', label: '🟦 Tiles & Ceramic' },
  { value: 'acp_panels', label: '🏢 ACP Panels' },
  { value: 'aluminium_glass', label: '🪟 Aluminium & Glass' },
  { value: 'doors_locks', label: '🚪 Doors & Locks' },
  { value: 'paint_chemicals', label: '🎨 Paint & Chemicals' },
  { value: 'other', label: '📦 Other' },
];

export default function VendorForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', gst: '', contactPerson: '', materialCategories: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/vendors/${id}`).then(r => {
        const v = r.data.vendor;
        setForm({ name: v.name || '', email: v.email || '', phone: v.phone || '', address: v.address || '', gst: v.gst || '', contactPerson: v.contactPerson || '', materialCategories: v.materialCategories || [] });
      });
    }
  }, [id]);

  const toggleCat = (cat) => {
    setForm(f => ({
      ...f,
      materialCategories: f.materialCategories.includes(cat)
        ? f.materialCategories.filter(c => c !== cat)
        : [...f.materialCategories, cat]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/vendors/${id}`, form);
        toast.success('Vendor updated!');
      } else {
        await api.post('/vendors', form);
        toast.success('Vendor added!');
      }
      navigate('/vendors');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={20} /></button>
        <div><h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit Vendor' : 'Add Vendor'}</h1></div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Company Name *</label><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Contact Person</label><input className="input" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} /></div>
          <div><label className="label">Phone *</label><input className="input" required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Email *</label><input type="email" className="input" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">GST Number</label><input className="input" value={form.gst} onChange={e => setForm({ ...form, gst: e.target.value })} placeholder="22AAAAA0000A1Z5" /></div>
          <div className="col-span-2"><label className="label">Address</label><textarea className="input" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
        </div>

        <div>
          <label className="label">Material Categories (select all that apply)</label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {CATEGORIES.map(cat => (
              <label key={cat.value} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all text-sm
                ${form.materialCategories.includes(cat.value) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'}`}>
                <input type="checkbox" className="hidden" checked={form.materialCategories.includes(cat.value)} onChange={() => toggleCat(cat.value)} />
                <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${form.materialCategories.includes(cat.value) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {form.materialCategories.includes(cat.value) && <svg viewBox="0 0 12 12" className="w-3 h-3 text-white fill-current"><path d="M1 6l3.5 3.5L11 2" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
                </div>
                {cat.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
            {isEdit ? 'Update Vendor' : 'Add Vendor'}
          </button>
        </div>
      </form>
    </div>
  );
}
