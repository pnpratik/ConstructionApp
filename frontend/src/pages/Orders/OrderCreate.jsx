import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, ShoppingCart, ChevronDown, ScanLine, PenLine, LayoutList, Camera, X, CheckCircle } from 'lucide-react';
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
    'TMT Steel Bar – 6mm (Stirrups)', 'TMT Steel Bar – 8mm', 'TMT Steel Bar – 12mm',
    'TMT Steel Bar – 16mm', 'TMT Steel Bar – 20mm', 'TMT Steel Bar – 25mm',
    'TMT Steel Bar – 32mm', 'Binding Wire 16 Gauge', 'MS Flat Bar', 'MS Angle', 'MS Channel',
  ],
  brick_block: [
    'Bricks – 3" / 75mm (Partition)', 'Bricks – 4" / 100mm (Half Brick)',
    'Bricks – 9" / 230mm (Full Brick)', 'Fly Ash Bricks',
    'AAC Block – 4" (600×100×200mm)', 'AAC Block – 8" (600×200×200mm)',
    'Hollow Concrete Block – 6"', 'Solid Concrete Block – 4"',
  ],
  concrete_rmc: [
    'Ready Mix Concrete – M20', 'Ready Mix Concrete – M25', 'Ready Mix Concrete – M30',
    'Ready Mix Concrete – M35', 'Coarse Aggregate 20mm', 'Coarse Aggregate 12mm', 'River Sand / M-Sand',
  ],
  cement: [
    'Cement – OPC 53 Grade (50 kg bag)', 'Cement – PPC Grade (50 kg bag)',
    'White Cement (40 kg bag)', 'Wall Putty (40 kg bag)', 'Tile Adhesive (20 kg bag)',
    'Tile Grout (1 kg)', 'Rapid Set Cement', 'Waterproof Cement',
  ],
  plumbing_pipes_fittings: [
    'CPVC Pipe – 1/2"', 'CPVC Pipe – 3/4"', 'CPVC Pipe – 1"', 'UPVC Pipe – 4" (Drainage)',
    'UPVC Pipe – 6" (Main Drain)', 'PPR Pipe – 20mm', 'PPR Pipe – 25mm',
    'GI Pipe – 1/2"', 'CPVC Elbow', 'CPVC Tee', 'Ball Valve – 1/2"', 'Ball Valve – 3/4"',
    'P-Trap (4")', 'Floor Trap', 'Water Tank (500L)', 'Water Tank (1000L)',
  ],
  bath_fittings_ceramic: [
    'EWC (Western Commode)', 'Indian WC', 'Wash Basin', 'Pedestal Wash Basin',
    'Shower Panel', 'Overhead Shower', 'Hand Shower', 'Concealed Cistern',
    'Flush Valve', 'CP Tap – 1/2"', 'CP Mixer – Single Lever', 'Bib Tap',
  ],
  electrical_cables: [
    'FR Wire – 1 sqmm (White)', 'FR Wire – 1.5 sqmm (Red)', 'FR Wire – 2.5 sqmm (Yellow)',
    'FR Wire – 4 sqmm (Blue)', 'FR Wire – 6 sqmm (Green)', 'Armoured Cable – 4C×10mm',
    'Conduit Pipe – 25mm (PVC)', 'Conduit Pipe – 32mm (PVC)', 'Flex Wire – 1.5 sqmm',
  ],
  electrical_accessories: [
    'MCB – 6A SP', 'MCB – 16A SP', 'MCB – 32A SP', 'MCB – 63A DP', 'RCCB – 40A 30mA',
    'DB Box (4 Way)', 'DB Box (8 Way)', 'DB Box (12 Way)', 'Switch 6A', 'Switch 16A',
    'Socket 6A', 'Socket 16A', 'Fan Regulator', 'Junction Box', 'Earthing Electrode',
  ],
  tiles_ceramic: [
    'Floor Tile – 600×600mm (Vitrified)', 'Floor Tile – 800×800mm (Vitrified)',
    'Wall Tile – 300×600mm (Ceramic)', 'Wall Tile – 300×450mm (Ceramic)',
    'Parking Tile – 600×600mm', 'Outdoor Tile – 300×300mm (Anti-Skid)',
    'Bathroom Floor Tile – 300×300mm', 'Step Tile', 'Skirting Tile – 100×600mm',
    'Designer Wall Tile', 'Mosaic Tile', 'Wooden Finish Tile',
    'High Gloss Tile', 'Matt Finish Tile', 'Tile Spacer (2mm)',
  ],
  acp_panels: [
    'ACP Sheet – 4mm (Standard)', 'ACP Sheet – 6mm (Fire Retardant)',
    'ACP Cladding – Silver', 'ACP Cladding – Gold', 'ACP Cladding – Custom Colour',
    'ACP Fabrication Frame (GI)', 'ACP Corner Cap',
  ],
  aluminium_glass: [
    'Aluminium Section – 2" (Powder Coated)', 'Aluminium Section – 3"',
    'Sliding Window Frame', 'Casement Window Frame', 'Sliding Door Frame',
    'Float Glass – 5mm', 'Float Glass – 8mm', 'Toughened Glass – 10mm',
    'Reflective Glass', 'Window Mesh (Fibre)', 'Silicon Sealant',
  ],
  doors_locks: [
    'Flush Door – 32mm (30×78")', 'Flush Door – 35mm (36×84")',
    'Fibre Door', 'PVC Door (Bathroom)', 'Steel Door Frame',
    'Wooden Door Frame', 'Mortise Lock', 'Cylindrical Lock', 'Pad Lock',
    'Tower Bolt', 'Door Stopper', 'Hinges (SS 4")', 'Aldrop (SS)', 'Magic Eye / Peephole',
  ],
  paint_chemicals: [
    'Interior Emulsion Paint (20L)', 'Exterior Weatherproof Paint (20L)',
    'Primer – White (20L)', 'Putty – Wall (40 kg bag)', 'Enamel Paint – Gloss (4L)',
    'Texture Coat (20 kg)', 'Waterproofing Chemical (5L)', 'Tile Cleaner (5L)',
    'Wood Polish', 'Painting Brush Set', 'Paint Roller (9")',
  ],
  other: [],
};

const UNITS = ['kg', 'ton', 'nos', 'meter', 'sqft', 'sqm', 'cft', 'bag', 'liter', 'set', 'box', 'bundle', 'sheet', 'roll', 'pair', 'cum', 'rmt'];
const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS);
const emptyItem = { materialName: '', category: '', quantity: '', unit: '', estimatedCost: '', mode: 'select' };

// ─── Mode toggle button ───────────────────────────────────────────────────────
const ModeBtn = ({ active, onClick, icon: Icon, label, color }) => (
  <button type="button" onClick={onClick}
    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
      active
        ? `bg-${color}-600 text-white border-${color}-600`
        : `bg-white text-gray-500 border-gray-200 hover:border-${color}-300 hover:text-${color}-600`
    }`}>
    <Icon size={12} />{label}
  </button>
);

// ─── Select-mode input: category dropdown + material autocomplete ─────────────
function SelectModeRow({ item, i, availableCategories, updateItem, handleCategoryChange }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState(item.materialName);
  const ref                 = useRef();
  const suggestions         = CATEGORY_MATERIALS[item.category] || [];
  const filtered            = search
    ? suggestions.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : suggestions;

  useEffect(() => { setSearch(item.materialName); }, [item.materialName]);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = (name) => { updateItem(i, 'materialName', name); setSearch(name); setOpen(false); };

  return (
    <div className="grid grid-cols-12 gap-3 items-end">
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
      <div ref={ref} className="col-span-8 relative">
        {i === 0 && <label className="label text-xs mb-1">Material Name *</label>}
        <input
          className="input text-sm" required
          placeholder={item.category ? 'Type or pick from list…' : 'Select category first'}
          value={search}
          onChange={e => { setSearch(e.target.value); updateItem(i, 'materialName', e.target.value); setOpen(true); }}
          onFocus={() => { if (item.category) setOpen(true); }}
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
    </div>
  );
}

// ─── Manual-mode input: free text, optional category ─────────────────────────
function ManualModeRow({ item, i, updateItem }) {
  return (
    <div className="grid grid-cols-12 gap-3 items-end">
      <div className="col-span-5">
        {i === 0 && <label className="label text-xs mb-1">Material Name *</label>}
        <input
          className="input text-sm border-orange-200 focus:border-orange-400" required
          placeholder="Type material name freely…"
          value={item.materialName}
          onChange={e => updateItem(i, 'materialName', e.target.value)}
        />
      </div>
      <div className="col-span-4">
        {i === 0 && <label className="label text-xs mb-1">Material Code / HSN</label>}
        <input
          className="input text-sm font-mono"
          placeholder="Code (optional)"
          value={item.materialCode || ''}
          onChange={e => updateItem(i, 'materialCode', e.target.value)}
        />
      </div>
      <div className="col-span-3">
        {i === 0 && <label className="label text-xs mb-1">Category</label>}
        <select className="input text-sm" value={item.category}
          onChange={e => updateItem(i, 'category', e.target.value)}>
          <option value="">None</option>
          {ALL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
        </select>
      </div>
    </div>
  );
}

// ─── QR / Barcode Scanner Modal ───────────────────────────────────────────────
function QRScannerModal({ onScan, onClose }) {
  const scannerRef  = useRef(null);
  const instanceRef = useRef(null);
  const [error, setError]   = useState('');
  const [scanned, setScanned] = useState(null);

  useEffect(() => {
    let scanner;
    const init = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        scanner = new Html5Qrcode('qr-scanner-view');
        instanceRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' }, // rear camera
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            setScanned(decodedText);
            scanner.stop().catch(() => {});
          },
          () => {}
        );
      } catch (err) {
        setError('Camera not accessible. Use manual entry instead.');
      }
    };
    init();
    return () => {
      if (instanceRef.current) {
        instanceRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Parse scanned text → material fields
  const parseScan = (text) => {
    // Try JSON first: {"materialName":"...","category":"...","unit":"...","quantity":...}
    try {
      const obj = JSON.parse(text);
      if (obj.materialName) return obj;
    } catch {}
    // URL: extract meaningful part
    if (text.startsWith('http')) {
      const parts = text.split('/');
      return { materialName: parts[parts.length - 1] || text };
    }
    // Plain text = material name
    return { materialName: text };
  };

  const confirmScan = () => {
    if (scanned) {
      onScan(parseScan(scanned));
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm">
        {/* Header */}
        <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine size={18} className="text-green-400" />
            <span className="font-semibold">Scan QR / Barcode</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-lg"><X size={16} /></button>
        </div>

        {/* Camera view */}
        {!scanned && !error && (
          <>
            <div id="qr-scanner-view" className="w-full" style={{ minHeight: 280 }} ref={scannerRef} />
            <p className="text-center text-xs text-gray-500 py-2">Point camera at QR code or barcode</p>
          </>
        )}

        {/* Error state */}
        {error && (
          <div className="p-6 text-center">
            <Camera size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            {/* Fallback: manual type */}
            <ManualScanInput onScan={(text) => { onScan(parseScan(text)); onClose(); }} />
          </div>
        )}

        {/* Scanned result */}
        {scanned && (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={20} />
              <span className="font-semibold">Scan successful!</span>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700 font-mono break-all">{scanned}</div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setScanned(null)}
                className="btn-secondary flex-1 text-sm">Scan Again</button>
              <button type="button" onClick={confirmScan}
                className="btn-primary flex-1 text-sm">Use This</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Fallback text input inside scanner modal when camera unavailable
function ManualScanInput({ onScan }) {
  const [val, setVal] = useState('');
  return (
    <div className="flex gap-2">
      <input className="input text-sm flex-1" placeholder="Type or paste barcode / code"
        value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && val.trim() && onScan(val.trim())} />
      <button type="button" onClick={() => val.trim() && onScan(val.trim())}
        className="btn-primary text-sm px-3">Add</button>
    </div>
  );
}

// ─── Scan-mode row: shows scanned value + re-scan button ─────────────────────
function ScanModeRow({ item, i, updateItem }) {
  const [showScanner, setShowScanner] = useState(!item.materialName);

  const handleScan = (parsed) => {
    updateItem(i, 'materialName', parsed.materialName || '');
    if (parsed.category)  updateItem(i, 'category', parsed.category);
    if (parsed.unit)      updateItem(i, 'unit', parsed.unit);
    if (parsed.quantity)  updateItem(i, 'quantity', String(parsed.quantity));
    setShowScanner(false);
  };

  return (
    <>
      {showScanner && <QRScannerModal onScan={handleScan} onClose={() => setShowScanner(false)} />}
      <div className="grid grid-cols-12 gap-3 items-end">
        <div className="col-span-9">
          {i === 0 && <label className="label text-xs mb-1">Scanned Material</label>}
          <div className={`input text-sm flex items-center gap-2 cursor-pointer ${!item.materialName ? 'border-dashed border-green-300 text-gray-400' : 'border-green-300 bg-green-50 text-gray-800'}`}
            onClick={() => setShowScanner(true)}>
            <ScanLine size={14} className={item.materialName ? 'text-green-600' : 'text-gray-400'} />
            {item.materialName || 'Tap to scan QR or barcode…'}
          </div>
        </div>
        <div className="col-span-3">
          <button type="button" onClick={() => setShowScanner(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-xs font-medium hover:bg-green-700">
            <ScanLine size={13} /> Scan
          </button>
        </div>
      </div>
      {item.materialName && item.category && (
        <div className="text-xs text-green-700 flex items-center gap-1 mt-1">
          <CheckCircle size={11} /> Category: {CATEGORY_LABELS[item.category] || item.category}
        </div>
      )}
    </>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function OrderCreate() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [vendors,  setVendors]  = useState([]);
  const [form, setForm] = useState({
    project:        searchParams.get('project') || '',
    vendor:         '',
    priority:       'medium',
    requiredByDate: '',
    remarks:        '',
  });
  const [items,   setItems]   = useState([{ ...emptyItem }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/projects'), api.get('/vendors')]).then(([p, v]) => {
      setProjects(p.data.projects || []);
      setVendors(v.data.vendors   || []);
    });
  }, []);

  const selectedVendor      = vendors.find(v => v._id === form.vendor) || null;
  const availableCategories = selectedVendor?.materialCategories?.length
    ? selectedVendor.materialCategories : ALL_CATEGORIES;

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
  const setItemMode = (i, mode) => setItems(items.map((item, idx) => idx === i ? { ...item, mode, materialName: '', category: '' } : item));

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

  const MODE_TABS = [
    { key: 'select', icon: LayoutList, label: 'Select',  color: 'blue',   desc: 'Pick from category list' },
    { key: 'manual', icon: PenLine,    label: 'Manual',  color: 'orange', desc: 'Type freely / enter code' },
    { key: 'scan',   icon: ScanLine,   label: 'Scan',    color: 'green',  desc: 'Scan QR or barcode' },
  ];

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

          {/* Mode legend */}
          <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
            <span className="font-medium text-gray-600">Entry mode per item:</span>
            {MODE_TABS.map(m => (
              <span key={m.key} className="flex items-center gap-1">
                <m.icon size={11} className={`text-${m.color}-500`} />
                <span className="font-medium">{m.label}</span> — {m.desc}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            {items.map((item, i) => {
              const mode = item.mode || 'select';
              return (
                <div key={i} className={`p-3 rounded-xl border space-y-3 ${
                  mode === 'select' ? 'bg-blue-50/40 border-blue-100' :
                  mode === 'manual' ? 'bg-orange-50/40 border-orange-100' :
                  'bg-green-50/40 border-green-100'
                }`}>
                  {/* Mode toggle + item label */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Item {i + 1}</span>
                    <div className="flex items-center gap-1.5">
                      {MODE_TABS.map(m => {
                        const colors = {
                          blue:   mode === m.key ? 'bg-blue-600 text-white border-blue-600'   : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600',
                          orange: mode === m.key ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-600',
                          green:  mode === m.key ? 'bg-green-600 text-white border-green-600'  : 'bg-white text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-600',
                        };
                        return (
                          <button key={m.key} type="button"
                            onClick={() => setItemMode(i, m.key)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${colors[m.color]}`}>
                            <m.icon size={11} />{m.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mode-specific name input */}
                  {mode === 'select' && (
                    <SelectModeRow item={item} i={i}
                      availableCategories={availableCategories}
                      updateItem={updateItem}
                      handleCategoryChange={handleCategoryChange} />
                  )}
                  {mode === 'manual' && (
                    <ManualModeRow item={item} i={i} updateItem={updateItem} />
                  )}
                  {mode === 'scan' && (
                    <ScanModeRow item={item} i={i} updateItem={updateItem} />
                  )}

                  {/* Row: Qty + Unit + Cost + Delete */}
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
              );
            })}
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
