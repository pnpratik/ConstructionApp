import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, ShoppingCart } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['steel', 'brick', 'block', 'concrete', 'cement', 'pipe', 'fitting', 'bath_fittings', 'ceramic_tiles', 'cable', 'switch', 'electrical_accessories', 'tiles', 'acp_panel', 'aluminium', 'doors_locks', 'paint', 'other'];
const UNITS = ['kg', 'ton', 'nos', 'meter', 'sqft', 'sqm', 'cft', 'bag', 'liter', 'set', 'box'];

const emptyItem = { materialName: '', category: '', quantity: '', unit: '', estimatedCost: '' };

export default function OrderCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({
    project: searchParams.get('project') || '',
    vendor: '',
    priority: 'medium',
    requiredByDate: '',
    remarks: '',
  });
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/projects'), api.get('/vendors')]).then(([p, v]) => {
      setProjects(p.data.projects || []);
      setVendors(v.data.vendors || []);
    });
  }, []);

  const addItem = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (i) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => setItems(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project) return toast.error('Please select a project');
    const validItems = items.filter(i => i.materialName && i.quantity && i.unit);
    if (validItems.length === 0) return toast.error('Add at least one material item');

    setLoading(true);
    try {
      await api.post('/orders', { ...form, items: validItems });
      toast.success('Order submitted for approval!');
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating order');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = items.reduce((sum, i) => sum + (parseFloat(i.estimatedCost) || 0), 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={20} /></button>
        <div><h1 className="text-2xl font-bold text-gray-800">Create Order</h1><p className="text-gray-500">Raise a material procurement request</p></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-800">Order Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Project *</label>
              <select className="input" required value={form.project} onChange={e => setForm({ ...form, project: e.target.value })}>
                <option value="">Select project...</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Preferred Vendor</label>
              <select className="input" value={form.vendor} onChange={e => setForm({ ...form, vendor: e.target.value })}>
                <option value="">Select vendor (optional)...</option>
                {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="low">🟢 Low</option>
                <option value="medium">🔵 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Required By Date</label>
              <input type="date" className="input" value={form.requiredByDate} onChange={e => setForm({ ...form, requiredByDate: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="label">Remarks</label>
              <textarea className="input" rows={2} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Any special notes..." />
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Material Items</h3>
            <button type="button" onClick={addItem} className="btn-secondary text-sm"><Plus size={14} /> Add Item</button>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 p-3 bg-gray-50 rounded-lg items-end">
                <div className="col-span-4">
                  {i === 0 && <label className="label text-xs">Material Name *</label>}
                  <input className="input text-sm" required value={item.materialName} onChange={e => updateItem(i, 'materialName', e.target.value)} placeholder="e.g. TMT Steel Bars" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="label text-xs">Category</label>}
                  <select className="input text-sm" value={item.category} onChange={e => updateItem(i, 'category', e.target.value)}>
                    <option value="">Category...</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="label text-xs">Quantity *</label>}
                  <input type="number" className="input text-sm" required value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} placeholder="0" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className="label text-xs">Unit *</label>}
                  <select className="input text-sm" required value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                    <option value="">Unit...</option>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="col-span-1">
                  {i === 0 && <label className="label text-xs">Est. Cost (₹)</label>}
                  <input type="number" className="input text-sm" value={item.estimatedCost} onChange={e => updateItem(i, 'estimatedCost', e.target.value)} placeholder="0" />
                </div>
                <div className="col-span-1 flex justify-center pb-1">
                  <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} className="text-red-400 hover:text-red-600 disabled:opacity-30">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalCost > 0 && (
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <p className="text-gray-600 text-sm">Total Estimated Cost: <strong className="text-gray-800 text-lg">₹{totalCost.toLocaleString('en-IN')}</strong></p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ShoppingCart size={16} />}
            {loading ? 'Submitting...' : 'Submit for Approval'}
          </button>
        </div>
      </form>
    </div>
  );
}
