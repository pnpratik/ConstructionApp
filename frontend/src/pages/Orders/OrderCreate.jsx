import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, ShoppingCart, ChevronDown } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ─── Category master — aligned with Vendor.materialCategories ─────────────────
const CATEGORY_LABELS = {
  steel:                    '🔩 Steel & Binding Wire',
  brick_block:              '🧱 Bricks & Blocks',
  concrete_rmc:             '🏗️ Concrete & Aggregate',
  cement:                   '🪨 Cement & Mortar',
  plumbing_pipes_fittings:  '🔧 Plumbing Pipes & Fittings',
  bath_fittings_ceramic:    '🚿 Bath Fittings',
  electrical_cables:        '⚡ Electrical Cables & Wires',
  electrical_accessories:   '🔌 Electrical Accessories & MCBs',
  tiles_ceramic:            '🟦 Tiles & Ceramics',
  acp_panels:               '🏢 ACP Panels',
  aluminium_glass:          '🪟 Aluminium & Glass',
  doors_locks:              '🚪 Doors & Lock Fittings',
  paint_chemicals:          '🎨 Paint & Chemicals',
  other:                    '📦 Other',
};

// ─── Category → material name suggestions ────────────────────────────────────
const CATEGORY_MATERIALS = {
  steel: [
    'TMT Steel Bar – 6mm (Stirrups)',
    'TMT Steel Bar – 8mm',
    'TMT Steel Bar – 12mm',
    'TMT Steel Bar – 16mm',
    'TMT Steel Bar – 20mm',
    'TMT Steel Bar – 25mm',
    'TMT Steel Bar – 32mm',
    'Binding Wire 16 Gauge',
    'MS Flat Bar',
    'MS Angle',
    'MS Channel',
  ],
  brick_block: [
    'Bricks – 3" / 75mm (Partition)',
    'Bricks – 4" / 100mm (Half Brick)',
    'Bricks – 9" / 230mm (Full Brick)',
    'Fly Ash Bricks',
    'AAC Block – 4" (600×100×200mm)',
    'AAC Block – 8" (600×200×200mm)',
    'Hollow Concrete Block – 6"',
    'Solid Concrete Block – 4"',
  ],
  concrete_rmc: [
    'Ready Mix Concrete – M20',
    'Ready Mix Concrete – M25',
    'Ready Mix Concrete – M30',
    'Ready Mix Concrete – M35',
    'Coarse Aggregate 20mm',
    'Coarse Aggregate 12mm',
    'River Sand / M-Sand',
  ],
  cement: [
    'Cement – OPC 53 Grade (50 kg bag)',
    'Cement – OPC 43 Grade (50 kg bag)',
    'Cement – PPC (50 kg bag)',
    'White Cement',
    'Block Jointing Mortar (Thin-bed)',
    'Tile Adhesive (C2 Grade)',
    'Grout (Unsanded)',
  ],
  plumbing_pipes_fittings: [
    'CPVC Pipe – 20mm (Cold Water)',
    'CPVC Pipe – 25mm (Hot Water)',
    'CPVC Pipe – 32mm',
    'CPVC Pipe – 40mm',
    'uPVC Drain Pipe – 75mm',
    'uPVC Drain Pipe – 110mm',
    'uPVC Drain Pipe – 160mm',
    'CPVC Fittings – 20mm (Elbow/Tee/Coupler)',
    'CPVC Fittings – 25mm',
    'uPVC Drain Fittings – 110mm',
    'Gate Valve – 20mm',
    'Ball Valve – 25mm',
    'Check Valve',
    'Water Storage Tank – 500L',
    'Water Storage Tank – 1000L',
  ],
  bath_fittings_ceramic: [
    'Water Closet (WC) – Wall Hung',
    'Water Closet (WC) – Floor Mount',
    'Wash Basin – Table Top',
    'Wash Basin – Wall Hung',
    'Shower Set (Overhead + Hand)',
    'Bathroom Faucet (Single Lever)',
    'Basin Mixer Tap',
    'Kitchen Sink – SS Single Bowl',
    'Kitchen Sink – SS Double Bowl',
    'Kitchen Tap',
    'Soap Dish (CP)',
    'Towel Rod – 24"',
    'Towel Ring',
    'Mirror Cabinet',
    'Shower Enclosure',
    'Floor Trap (SS)',
  ],
  electrical_cables: [
    'FR Wire – 1.5 sqmm (Light/Fan)',
    'FR Wire – 2.5 sqmm (Socket)',
    'FR Wire – 4 sqmm (AC)',
    'FR Wire – 6 sqmm',
    'FR Wire – 10 sqmm',
    'Earth Wire – 1.5 sqmm (Green/Yellow)',
    'Earth Wire – 4 sqmm',
    'Armoured Cable – 16mm',
    'Armoured Cable – 25mm',
    'PVC Conduit Pipe – 20mm',
    'PVC Conduit Pipe – 25mm',
    'Conduit Junction Box',
    'Conduit Bend / Elbow',
  ],
  electrical_accessories: [
    'MCB – 6A Single Pole',
    'MCB – 16A Single Pole',
    'MCB – 20A Single Pole',
    'MCB – 32A Double Pole',
    'MCB – 63A Double Pole',
    'MCB Distribution Board – 8-way',
    'MCB Distribution Board – 12-way',
    'MCB Distribution Board – 16-way',
    'RCCB – 40A/30mA',
    'Modular Switch – 1-way',
    'Modular Switch – 2-way',
    'Modular 5A Socket',
    'Modular 15A Socket',
    'AC Socket – 25A',
    'Fan Regulator (Electronic)',
    'Exhaust Fan – 6"',
    'Smoke Detector',
    'Switch Plate (6-module)',
    'Switch Plate (8-module)',
  ],
  tiles_ceramic: [
    'Vitrified Floor Tiles – 600×600mm',
    'Vitrified Floor Tiles – 800×800mm',
    'Vitrified Floor Tiles – 600×1200mm',
    'Ceramic Wall Tiles – 300×450mm',
    'Ceramic Wall Tiles – 300×600mm',
    'Anti-Skid Tiles – 300×300mm',
    'Parking Tiles – 400×400mm',
    'Digital Tiles – 600×1200mm',
    'Mosaic Tiles',
    'Skirting Tiles',
    'Step Riser Tiles',
    'Tile Adhesive – C2 Grade',
    'Tile Grout (Coloured)',
    'Tile Spacers – 2mm',
    'Tile Cutter Blade',
  ],
  acp_panels: [
    'ACP Sheet – 4mm PE Core',
    'ACP Sheet – 4mm FR Core',
    'ACP Sheet – 6mm FR Core',
    'ACP Extrusion – F-Profile',
    'ACP Extrusion – L-Angle',
    'ACP Extrusion – T-Profile',
    'ACP Corner Cap',
    'Silicone Sealant (Neutral)',
    'Rivet – SS 4mm',
  ],
  aluminium_glass: [
    'Aluminium Sliding Window (2-track)',
    'Aluminium Sliding Window (3-track)',
    'Aluminium Casement Window',
    'Aluminium Sliding Door',
    'Aluminium Door Frame',
    'Aluminium Partition System',
    'Float Glass – 5mm',
    'Float Glass – 8mm',
    'Toughened Glass – 10mm',
    'Toughened Glass – 12mm',
    'Reflective Glass',
    'Structural Sealant',
    'Spider Fitting (4-arm)',
    'Aluminium Handle',
    'Lock (Cremone)',
  ],
  doors_locks: [
    'Flush Door – Solid Core (900×2100mm)',
    'Flush Door – Solid Core (1200×2100mm)',
    'Fire Door – 90 min',
    'Wooden Door Frame – Teak',
    'Wooden Door Frame – Sal',
    'Main Door (Pre-hung)',
    'Mortise Lock (Brass)',
    'Cylindrical Lock (SS)',
    'Deadbolt Lock',
    'Door Closer (Heavy Duty)',
    'Door Stopper (Floor)',
    'Tower Bolt – 12"',
    'Door Hinges – SS 4"',
    'Door Hinges – SS 5" (Heavy)',
    'Wardrobe Handle – 6"',
    'Aldrop (SS)',
    'Magic Eye / Peephole',
  ],
  paint_chemicals: [
    'Interior Emulsion Paint (20L)',
    'Exterior Weatherproof Paint (20L)',
    'Primer – White (20L)',
    'Putty – Wall (40 kg bag)',
    'Enamel Paint – Gloss (4L)',
    'Texture Coat (20 kg)',
    'Waterproofing Chemical (5L)',
    'Tile Cleaner (5L)',
    'Wood Polish',
    'Painting Brush Set',
    'Paint Roller (9")',
  ],
  other: [],
};

const UNITS = ['kg', 'ton', 'nos', 'meter', 'sqft', 'sqm', 'cft', 'bag', 'liter', 'set', 'box', 'bundle', 'sheet', 'roll', 'pair', 'cum', 'rmt'];

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);
const emptyItem = { materialName: '', category: '', quantity: '', unit: '', estimatedCost: '' };

// ─── Material name dropdown with suggestions ───────────────────────────────────
function MaterialNameInput({ value, category, onChange }) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState(value);
  const ref                   = useRef();
  const suggestions           = CATEGORY_MATERIALS[category] || [];
  const filtered              = search
    ? suggestions.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : suggestions;

  useEffect(() => { setSearch(value); }, [value]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (name) => { onChange(name); setSearch(name); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <input
        className="input text-sm"
        required
        placeholder={category ? 'Type or pick from list…' : 'Select category first'}
        value={search}
        onChange={e => { setSearch(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => { if (category) setOpen(true); }}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
          {filtered.map(s => (
            <button key={s} type="button" onMouseDown={() => pick(s)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 border-b border-gray-50 last:border-0 truncate">
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function OrderCreate() {
  const navigate     = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [vendors, setVendors]   = useState([]);
  const [form, setForm] = useState({
    project:        searchParams.get('project') || '',
    vendor:         '',
    priority:       'medium',
    requiredByDate: '',
    remarks:        '',
  });
  const [items, setItems]   = useState([{ ...emptyItem }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/projects'), api.get('/vendors')]).then(([p, v]) => {
      setProjects(p.data.projects || []);
      setVendors(v.data.vendors || []);
    });
  }, []);

  // ── Get the selected vendor object ──────────────────────────────────────────
  const selectedVendor = vendors.find(v => v._id === form.vendor) || null;

  // ── Available categories: filtered by vendor, or all if no vendor ──────────
  const availableCategories = selectedVendor?.materialCategories?.length
    ? selectedVendor.materialCategories
    : ALL_CATEGORIES;

  // ── When vendor changes, clear any item categories not in new vendor's list ─
  const handleVendorChange = (vendorId) => {
    const newVendor = vendors.find(v => v._id === vendorId);
    const allowed   = newVendor?.materialCategories || ALL_CATEGORIES;
    setForm(f => ({ ...f, vendor: vendorId }));
    setItems(prev => prev.map(item => ({
      ...item,
      category:     allowed.includes(item.category) ? item.category : '',
      materialName: allowed.includes(item.category) ? item.materialName : '',
    })));
  };

  const addItem    = () => setItems([...items, { ...emptyItem }]);
  const removeItem = (i) => items.length > 1 && setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, field, val) => setItems(items.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  // When category changes on an item, clear material name so user picks fresh
  const handleCategoryChange = (i, cat) => {
    setItems(items.map((item, idx) => idx === i ? { ...item, category: cat, materialName: '' } : item));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.project) return toast.error('Please select a project');
    const validItems = items.filter(i => i.materialName && i.quantity && i.unit);
    if (validItems.length === 0) return toast.error('Add at least one complete material item');

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
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create Order</h1>
          <p className="text-gray-500">Raise a material procurement request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Details */}
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
              <select className="input" value={form.vendor} onChange={e => handleVendorChange(e.target.value)}>
                <option value="">Select vendor (optional)...</option>
                {vendors.map(v => (
                  <option key={v._id} value={v._id}>
                    {v.name} — {(v.materialCategories || []).map(c => CATEGORY_LABELS[c]?.split(' ').slice(1).join(' ') || c).join(', ')}
                  </option>
                ))}
              </select>
              {selectedVendor && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {(selectedVendor.materialCategories || []).map(c => (
                    <span key={c} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                      {CATEGORY_LABELS[c] || c}
                    </span>
                  ))}
                </div>
              )}
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

        {/* Material Items */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Material Items</h3>
              {selectedVendor && (
                <p className="text-xs text-blue-600 mt-0.5">
                  Showing categories for <strong>{selectedVendor.name}</strong>
                </p>
              )}
            </div>
            <button type="button" onClick={addItem} className="btn-secondary text-sm"><Plus size={14} /> Add Item</button>
          </div>

          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                {/* Row 1: Category + Material Name */}
                <div className="grid grid-cols-12 gap-3 items-end">
                  {/* Category */}
                  <div className="col-span-4">
                    {i === 0 && <label className="label text-xs mb-1">Category</label>}
                    <select
                      className={`input text-sm ${!item.category ? 'border-gray-200' : 'border-blue-300 bg-blue-50'}`}
                      value={item.category}
                      onChange={e => handleCategoryChange(i, e.target.value)}
                    >
                      <option value="">Select category…</option>
                      {availableCategories.map(c => (
                        <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Material Name — with autocomplete */}
                  <div className="col-span-8">
                    {i === 0 && <label className="label text-xs mb-1">Material Name *</label>}
                    <MaterialNameInput
                      value={item.materialName}
                      category={item.category}
                      onChange={val => updateItem(i, 'materialName', val)}
                    />
                  </div>
                </div>

                {/* Row 2: Qty + Unit + Cost + Delete */}
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-4">
                    {i === 0 && <label className="label text-xs mb-1">Quantity *</label>}
                    <input type="number" className="input text-sm" required min="0" step="any"
                      value={item.quantity}
                      onChange={e => updateItem(i, 'quantity', e.target.value)}
                      placeholder="0" />
                  </div>

                  <div className="col-span-4">
                    {i === 0 && <label className="label text-xs mb-1">Unit *</label>}
                    <select className="input text-sm" required value={item.unit} onChange={e => updateItem(i, 'unit', e.target.value)}>
                      <option value="">Unit…</option>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  <div className="col-span-3">
                    {i === 0 && <label className="label text-xs mb-1">Est. Cost (₹)</label>}
                    <input type="number" className="input text-sm" min="0"
                      value={item.estimatedCost}
                      onChange={e => updateItem(i, 'estimatedCost', e.target.value)}
                      placeholder="0" />
                  </div>

                  <div className="col-span-1 flex justify-center pb-1">
                    <button type="button" onClick={() => removeItem(i)}
                      disabled={items.length === 1}
                      className="text-red-400 hover:text-red-600 disabled:opacity-30">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalCost > 0 && (
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <p className="text-gray-600 text-sm">
                Total Estimated Cost: <strong className="text-gray-800 text-lg">₹{totalCost.toLocaleString('en-IN')}</strong>
              </p>
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
