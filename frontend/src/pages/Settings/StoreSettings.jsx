import React, { useState, useEffect } from 'react';
import {
  Warehouse, Camera, Plus, Edit2, Trash2, CheckCircle, XCircle,
  Wifi, WifiOff, AlertCircle, Eye, EyeOff, Play, Package,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ── Category labels (matches backend enum) ───────────────────────────────────
const CAT_LABELS = {
  steel:                    '🔩 Steel / TMT',
  cement:                   '🏗️ Cement',
  brick_block:              '🧱 Bricks & Blocks',
  concrete_rmc:             '🪨 Concrete / RMC',
  aggregate_sand:           '⛏️ Aggregate & Sand',
  plumbing_pipes_fittings:  '🔧 Plumbing Pipes',
  bath_fittings_ceramic:    '🚿 Bath Fittings',
  tiles_ceramic:            '🏺 Tiles & Ceramic',
  electrical_cables:        '⚡ Electrical Cables',
  electrical_accessories:   '🔌 Electrical Accessories',
  acp_panels:               '🪞 ACP Panels',
  aluminium_glass:          '🪟 Aluminium & Glass',
  doors_locks:              '🚪 Doors & Locks',
  other:                    '📦 Other',
};

const STORE_TYPES = { open: '☀️ Open Yard', semi_open: '🏚️ Semi-Covered', closed: '🔒 Closed Room' };
const BRANDS      = ['hikvision', 'dahua', 'cpplus', 'axis', 'onvif', 'generic', 'none'];
const BRAND_ICONS = { hikvision: '🔵', dahua: '🟢', cpplus: '🟡', axis: '🔴', onvif: '⚪', generic: '⚪', none: '—' };

const STATUS_DOT = ({ camera }) => {
  if (!camera?.enabled || camera?.brand === 'none')
    return <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" title="Camera not configured" />;
  if (camera?.lastTestSuccess === true)
    return <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block animate-pulse" title="Camera OK" />;
  if (camera?.lastTestSuccess === false)
    return <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" title={camera.lastTestError} />;
  return <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" title="Not tested yet" />;
};

const EMPTY_FORM = {
  name: '', description: '', location: '', storeType: 'closed',
  materialCategories: [],
  camera: { enabled: false, brand: 'none', ip: '', port: 80, username: 'admin', password: '', channel: 1, snapshotUrl: '' },
};

export default function StoreSettings() {
  const [stores,  setStores]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | 'add' | 'edit'
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [editId,  setEditId]  = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testSnap, setTestSnap] = useState(null); // snapshot URL after test
  const [saving,  setSaving]  = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/stores').then(r => setStores(r.data.stores || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY_FORM); setEditId(null); setTestSnap(null); setModal('add'); };
  const openEdit = (s) => {
    setForm({
      name: s.name, description: s.description || '', location: s.location || '',
      storeType: s.storeType, materialCategories: s.materialCategories || [],
      camera: { ...s.camera, password: '' }, // don't pre-fill password
    });
    setEditId(s._id); setTestSnap(null); setModal('edit');
  };

  const closeModal = () => { setModal(null); setTestSnap(null); setShowPass(false); };

  const toggleCategory = (cat) => {
    setForm(f => ({
      ...f,
      materialCategories: f.materialCategories.includes(cat)
        ? f.materialCategories.filter(c => c !== cat)
        : [...f.materialCategories, cat],
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Store name is required');
    if (!form.materialCategories.length) return toast.error('Select at least one material category');
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/stores/${editId}`, form);
        toast.success('Store updated');
      } else {
        await api.post('/stores', form);
        toast.success('Store created');
      }
      closeModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}"?`)) return;
    try {
      await api.delete(`/stores/${id}`);
      toast.success('Store removed');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleTest = async () => {
    if (!editId) return toast.error('Save the store first, then test camera');
    setTesting(true); setTestSnap(null);
    try {
      const r = await api.post(`/stores/${editId}/test-camera`);
      toast.success(r.data.message || 'Camera OK!');
      if (r.data.snapshotUrl) setTestSnap(r.data.snapshotUrl);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Camera test failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Store & Camera Settings</h1>
          <p className="text-gray-500">Configure material stores and link CCTV cameras for auto-snapshot on delivery</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus size={16} /> Add Store</button>
      </div>

      {/* How it works banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Camera size={20} className="text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">How Auto-Snapshot Works</p>
          <p>When a delivery challan is uploaded, Nirmaan checks the material category of the order, finds the matching store, and automatically captures a photo from that store's CCTV camera. The snapshot is attached to the delivery record as proof.</p>
        </div>
      </div>

      {/* Store Cards */}
      {stores.length === 0 ? (
        <div className="card text-center py-16">
          <Warehouse size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No stores configured yet. Add your first store to get started.</p>
          <button onClick={openAdd} className="btn-primary inline-flex"><Plus size={16} /> Add Store</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map(s => (
            <div key={s._id} className="card flex flex-col gap-3 hover:shadow-md transition-all">
              {/* Store Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-2xl">{STORE_TYPES[s.storeType]?.split(' ')[0]}</div>
                  <div>
                    <p className="font-semibold text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-400">{STORE_TYPES[s.storeType]?.split(' ').slice(1).join(' ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-500"><Edit2 size={14} /></button>
                  <button onClick={() => handleDelete(s._id, s.name)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>

              {/* Location */}
              {s.location && <p className="text-xs text-gray-500 flex items-center gap-1">📍 {s.location}</p>}

              {/* Material Categories */}
              <div className="flex flex-wrap gap-1">
                {(s.materialCategories || []).map(c => (
                  <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {CAT_LABELS[c] || c}
                  </span>
                ))}
              </div>

              {/* Camera Status */}
              <div className="border-t border-gray-50 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <STATUS_DOT camera={s.camera} />
                    <span className="text-xs font-medium text-gray-600">
                      {s.camera?.enabled && s.camera?.brand !== 'none'
                        ? `${BRAND_ICONS[s.camera.brand]} ${s.camera.brand?.toUpperCase()} · ${s.camera.ip || 'No IP'}`
                        : 'No Camera Configured'}
                    </span>
                  </div>
                  {s.camera?.enabled && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.camera.lastTestSuccess ? 'bg-green-100 text-green-700' :
                      s.camera.lastTestSuccess === false ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {s.camera.lastTestSuccess ? '✅ Online' : s.camera.lastTestSuccess === false ? '❌ Offline' : '⚠️ Untested'}
                    </span>
                  )}
                </div>
                {s.camera?.lastTestAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last test: {new Date(s.camera.lastTestAt).toLocaleString('en-IN')}
                    {s.camera.lastTestError && <span className="text-red-400 ml-1">— {s.camera.lastTestError}</span>}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ─────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Warehouse size={20} /> {editId ? 'Edit Store' : 'Add New Store'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Store Name *</label>
                  <input className="input" placeholder="e.g. Steel Yard, Cement Godown"
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div>
                  <label className="label">Store Type *</label>
                  <select className="input" value={form.storeType} onChange={e => setForm({...form, storeType: e.target.value})}>
                    {Object.entries(STORE_TYPES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Location</label>
                  <input className="input" placeholder="e.g. North corner, Site entrance"
                    value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                </div>
                <div className="col-span-2">
                  <label className="label">Description</label>
                  <input className="input" placeholder="Brief description of what's stored here"
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
              </div>

              {/* Material Categories */}
              <div>
                <label className="label">Material Categories Stored Here *</label>
                <p className="text-xs text-gray-400 mb-2">When a delivery of these materials arrives, this store's camera will be triggered</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(CAT_LABELS).map(([k, v]) => (
                    <button type="button" key={k}
                      onClick={() => toggleCategory(k)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        form.materialCategories.includes(k)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                      }`}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Config */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2"><Camera size={16} /> Camera Configuration</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-blue-600"
                      checked={form.camera.enabled}
                      onChange={e => setForm({...form, camera: {...form.camera, enabled: e.target.checked}})} />
                    <span className="text-sm font-medium text-gray-600">Enable CCTV Snapshot</span>
                  </label>
                </div>

                {form.camera.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Camera Brand</label>
                      <select className="input" value={form.camera.brand}
                        onChange={e => setForm({...form, camera: {...form.camera, brand: e.target.value}})}>
                        {BRANDS.map(b => (
                          <option key={b} value={b}>{BRAND_ICONS[b]} {b.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Channel No.</label>
                      <input type="number" min="1" max="16" className="input" value={form.camera.channel}
                        onChange={e => setForm({...form, camera: {...form.camera, channel: parseInt(e.target.value)||1}})} />
                    </div>
                    <div>
                      <label className="label">Camera IP Address *</label>
                      <input className="input font-mono" placeholder="192.168.1.101"
                        value={form.camera.ip}
                        onChange={e => setForm({...form, camera: {...form.camera, ip: e.target.value}})} />
                    </div>
                    <div>
                      <label className="label">Port</label>
                      <input type="number" className="input font-mono" placeholder="80"
                        value={form.camera.port}
                        onChange={e => setForm({...form, camera: {...form.camera, port: parseInt(e.target.value)||80}})} />
                    </div>
                    <div>
                      <label className="label">Username</label>
                      <input className="input" placeholder="admin"
                        value={form.camera.username}
                        onChange={e => setForm({...form, camera: {...form.camera, username: e.target.value}})} />
                    </div>
                    <div>
                      <label className="label">Password</label>
                      <div className="relative">
                        <input className="input pr-10" type={showPass ? 'text' : 'password'}
                          placeholder={editId ? 'Leave blank to keep existing' : 'Camera password'}
                          value={form.camera.password}
                          onChange={e => setForm({...form, camera: {...form.camera, password: e.target.value}})} />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          onClick={() => setShowPass(!showPass)}>
                          {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="label">Custom Snapshot URL <span className="text-gray-400 font-normal">(optional — overrides brand defaults)</span></label>
                      <input className="input font-mono text-sm" placeholder="http://192.168.1.101/custom/snapshot.jpg"
                        value={form.camera.snapshotUrl}
                        onChange={e => setForm({...form, camera: {...form.camera, snapshotUrl: e.target.value}})} />
                    </div>

                    {/* Test Camera Button — only when editing existing store */}
                    {editId && (
                      <div className="col-span-2">
                        <button type="button" onClick={handleTest} disabled={testing}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium">
                          {testing
                            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <Play size={14} />}
                          {testing ? 'Capturing...' : '📷 Test Camera Now'}
                        </button>
                        {testSnap && (
                          <div className="mt-3 border border-green-200 rounded-xl overflow-hidden">
                            <div className="bg-green-50 px-3 py-1.5 text-xs text-green-700 font-medium flex items-center gap-1">
                              <CheckCircle size={12} /> Live snapshot captured successfully
                            </div>
                            <img src={`http://localhost:5001${testSnap}`} alt="Test Snapshot"
                              className="w-full max-h-48 object-cover" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  {saving ? 'Saving...' : editId ? 'Update Store' : 'Create Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
