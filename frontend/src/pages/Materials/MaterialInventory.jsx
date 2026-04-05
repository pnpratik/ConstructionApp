import React, { useState, useEffect } from 'react';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const CATEGORIES = ['steel', 'brick', 'block', 'concrete', 'cement', 'pipe', 'fitting', 'bath_fittings', 'ceramic_tiles', 'cable', 'switch', 'electrical_accessories', 'tiles', 'acp_panel', 'aluminium', 'doors_locks', 'paint', 'chemical', 'other'];
const UNITS = ['kg', 'ton', 'nos', 'meter', 'sqft', 'sqm', 'cft', 'bag', 'liter', 'set', 'box'];

export default function MaterialInventory() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', unit: '', currentStock: 0, minStock: 0 });

  const load = () => api.get('/materials').then(r => setMaterials(r.data.materials || [])).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/materials', form);
      toast.success('Material added!');
      setShowModal(false);
      setForm({ name: '', category: '', unit: '', currentStock: 0, minStock: 0 });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const lowStock = materials.filter(m => m.currentStock <= m.minStock && m.minStock > 0);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Material Inventory</h1>
          <p className="text-gray-500">{materials.length} materials tracked</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary"><Plus size={16} /> Add Material</button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-700">Low Stock Alert</p>
            <p className="text-sm text-red-600">{lowStock.map(m => m.name).join(', ')} are below minimum stock levels</p>
          </div>
        </div>
      )}

      {materials.length === 0 ? (
        <div className="card text-center py-16"><Package size={48} className="text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No materials tracked yet.</p></div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-gray-100">
                <th className="table-header">Material</th>
                <th className="table-header">Category</th>
                <th className="table-header text-right">Current Stock</th>
                <th className="table-header text-right">Min Stock</th>
                <th className="table-header">Unit</th>
                <th className="table-header">Status</th>
              </tr></thead>
              <tbody>
                {materials.map(m => {
                  const isLow = m.currentStock <= m.minStock && m.minStock > 0;
                  return (
                    <tr key={m._id} className={`border-b border-gray-50 hover:bg-gray-50 ${isLow ? 'bg-red-50/30' : ''}`}>
                      <td className="table-cell font-medium">{m.name}</td>
                      <td className="table-cell capitalize text-gray-500">{m.category?.replace(/_/g, ' ')}</td>
                      <td className={`table-cell text-right font-bold ${isLow ? 'text-red-600' : 'text-gray-800'}`}>{m.currentStock?.toLocaleString()}</td>
                      <td className="table-cell text-right text-gray-400">{m.minStock?.toLocaleString()}</td>
                      <td className="table-cell text-gray-500">{m.unit}</td>
                      <td className="table-cell">
                        {isLow ? (
                          <span className="badge bg-red-100 text-red-700 flex items-center gap-1 w-fit"><AlertTriangle size={10} />Low Stock</span>
                        ) : (
                          <span className="badge bg-green-100 text-green-700">OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Material">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Name *</label><input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Category *</label>
            <select className="input" required value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="">Select...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div><label className="label">Unit *</label>
            <select className="input" required value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
              <option value="">Select...</option>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Current Stock</label><input type="number" className="input" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: +e.target.value })} /></div>
            <div><label className="label">Minimum Stock</label><input type="number" className="input" value={form.minStock} onChange={e => setForm({ ...form, minStock: +e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary">Add Material</button></div>
        </form>
      </Modal>
    </div>
  );
}
