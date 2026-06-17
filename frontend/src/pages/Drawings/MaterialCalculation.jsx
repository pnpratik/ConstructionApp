import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, RefreshCw, Upload, Save,
  TrendingUp, TrendingDown, Minus, FileImage,
  Clock, User, ChevronDown, ChevronUp, GitBranch,
  Calculator, AlertCircle, Package, X,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CAT_COLORS = {
  steel:                  'bg-gray-100 text-gray-700',
  cement:                 'bg-yellow-50 text-yellow-700',
  brick:                  'bg-orange-50 text-orange-700',
  block:                  'bg-amber-50 text-amber-700',
  concrete:               'bg-blue-50 text-blue-700',
  pipe:                   'bg-teal-50 text-teal-700',
  fitting:                'bg-cyan-50 text-cyan-700',
  bath_fittings:          'bg-pink-50 text-pink-700',
  cable:                  'bg-purple-50 text-purple-700',
  switch:                 'bg-indigo-50 text-indigo-700',
  electrical_accessories: 'bg-violet-50 text-violet-700',
  other:                  'bg-gray-50 text-gray-600',
};

const TYPE_ICONS = { architectural: '🏛️', structural: '🏗️', plumbing: '🔧', electrical: '⚡', other: '📄' };
const TYPE_LABELS = { architectural: 'Architectural', structural: 'Structural', plumbing: 'Plumbing', electrical: 'Electrical', other: 'Other' };

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function RevLabel({ rev }) {
  if (rev === 0) return <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">Initial</span>;
  return <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-semibold">Rev {rev}</span>;
}

function DiffBadge({ oldQty, newQty }) {
  if (oldQty == null) return <span className="text-xs text-green-600 font-medium flex items-center gap-0.5"><TrendingUp size={11} />New</span>;
  const delta = newQty - oldQty;
  if (Math.abs(delta) < 0.01) return <span className="text-xs text-gray-400 flex items-center gap-0.5"><Minus size={11} />No change</span>;
  const pct = oldQty !== 0 ? ((delta / oldQty) * 100).toFixed(1) : '∞';
  return delta > 0
    ? <span className="text-xs text-red-600 font-medium flex items-center gap-0.5"><TrendingUp size={11} />+{pct}%</span>
    : <span className="text-xs text-green-600 font-medium flex items-center gap-0.5"><TrendingDown size={11} />{pct}%</span>;
}

// ─── Input form per drawing type ─────────────────────────────────────────────
function InputForm({ type, initial, onCalculate, calculating }) {
  const [v, setV] = useState(() => {
    if (type === 'structural' || type === 'architectural') return {
      floorArea: initial?.floorArea || '', floors: initial?.floors || '',
      wallLength: initial?.wallLength || '', wallHeight: initial?.wallHeight || '3',
      wallThickness: initial?.wallThickness || '9', masonryType: initial?.masonryType || 'brick',
    };
    if (type === 'plumbing') return {
      coldWaterPipeRuns: initial?.coldWaterPipeRuns || '',
      hotWaterPipeRuns:  initial?.hotWaterPipeRuns  || '',
      drainPipeRuns:     initial?.drainPipeRuns     || '',
      bathrooms:         initial?.bathrooms         || '',
      kitchens:          initial?.kitchens          || '',
    };
    if (type === 'electrical') return {
      lightPoints:        initial?.lightPoints        || '',
      fanPoints:          initial?.fanPoints          || '',
      socketPoints:       initial?.socketPoints       || '',
      acPoints:           initial?.acPoints           || '',
      totalCircuitLength: initial?.totalCircuitLength || '',
      panels:             initial?.panels             || '1',
    };
    return {};
  });

  const set = (k, val) => setV(p => ({ ...p, [k]: val }));
  const num = (k) => <input type="number" min={0} className="input text-sm" value={v[k]} onChange={e => set(k, e.target.value)} />;

  const validate = () => {
    const toNum = o => Object.fromEntries(Object.entries(o).map(([k, val]) => [k, Number(val) || 0]));
    const inputs = toNum(v);
    if (type === 'structural' || type === 'architectural') {
      if (!inputs.floorArea) return toast.error('Floor area is required'), false;
      if (!inputs.floors)    return toast.error('Number of floors is required'), false;
    }
    if (type === 'plumbing') {
      const total = inputs.coldWaterPipeRuns + inputs.hotWaterPipeRuns + inputs.drainPipeRuns;
      if (!total) return toast.error('Enter at least one pipe run length'), false;
    }
    if (type === 'electrical') {
      const pts = inputs.lightPoints + inputs.fanPoints + socketPoints + inputs.acPoints;
      if (!inputs.totalCircuitLength) return toast.error('Total circuit length is required'), false;
    }
    return true;
  };

  const submit = () => {
    if (!validate()) return;
    const toNum = o => Object.fromEntries(Object.entries(o).map(([k, val]) => [k, Number(val) || 0]));
    onCalculate(toNum(v));
  };

  return (
    <div className="card space-y-5">
      <div className="flex items-center gap-2">
        <Calculator size={18} className="text-blue-500" />
        <h3 className="font-bold text-gray-900">Enter Drawing Parameters</h3>
        <span className="text-xs text-gray-400 ml-1">— quantities will be calculated from these inputs</span>
      </div>

      {(type === 'structural' || type === 'architectural') && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Floor Area per Floor (sqft) *</label>
              {num('floorArea')}
              <p className="text-xs text-gray-400 mt-1">e.g. 1200 for a 1200 sqft floor</p>
            </div>
            <div>
              <label className="label">Number of Floors *</label>
              {num('floors')}
              <p className="text-xs text-gray-400 mt-1">including Ground floor (G+2 = 3)</p>
            </div>
            <div>
              <label className="label">Total Wall Length per Floor (m)</label>
              {num('wallLength')}
              <p className="text-xs text-gray-400 mt-1">sum of all wall centre-lines</p>
            </div>
            <div>
              <label className="label">Floor-to-Ceiling Height (m)</label>
              {num('wallHeight')}
              <p className="text-xs text-gray-400 mt-1">typically 3.0 m (10 ft)</p>
            </div>
            <div>
              <label className="label">Wall Thickness (inches)</label>
              <select className="select text-sm" value={v.wallThickness} onChange={e => set('wallThickness', e.target.value)}>
                <option value="3">3" (75mm) — Partition</option>
                <option value="4">4" (100mm) — Half brick</option>
                <option value="9">9" (230mm) — Full brick</option>
              </select>
            </div>
            <div>
              <label className="label">Masonry Type</label>
              <select className="select text-sm" value={v.masonryType} onChange={e => set('masonryType', e.target.value)}>
                <option value="brick">🧱 Brick</option>
                <option value="block">🟫 AAC Block</option>
              </select>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            <strong>Tip:</strong> These values come from your structural/architectural drawing. Check the title block or schedule of areas for floor area. Measure wall centre-lines from the plan.
          </div>
        </>
      )}

      {type === 'plumbing' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Cold Water Pipe Runs (m)</label>
              {num('coldWaterPipeRuns')}
              <p className="text-xs text-gray-400 mt-1">total CPVC 20mm length</p>
            </div>
            <div>
              <label className="label">Hot Water Pipe Runs (m)</label>
              {num('hotWaterPipeRuns')}
              <p className="text-xs text-gray-400 mt-1">total CPVC 25mm length</p>
            </div>
            <div>
              <label className="label">Drain / Soil Pipe Runs (m)</label>
              {num('drainPipeRuns')}
              <p className="text-xs text-gray-400 mt-1">total uPVC 110mm length</p>
            </div>
            <div>
              <label className="label">Number of Bathrooms / Toilets</label>
              {num('bathrooms')}
            </div>
            <div>
              <label className="label">Number of Kitchens / Utility</label>
              {num('kitchens')}
            </div>
          </div>
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-xs text-teal-700">
            <strong>Tip:</strong> Measure pipe runs from the plumbing schematic — cold water from main to each fixture, hot water from geyser to fixture, and drain from fixture to stack.
          </div>
        </>
      )}

      {type === 'electrical' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Light Points</label>
              {num('lightPoints')}
              <p className="text-xs text-gray-400 mt-1">ceiling + wall lights total</p>
            </div>
            <div>
              <label className="label">Fan Points</label>
              {num('fanPoints')}
            </div>
            <div>
              <label className="label">Socket / Power Points</label>
              {num('socketPoints')}
              <p className="text-xs text-gray-400 mt-1">5A + 15A combined</p>
            </div>
            <div>
              <label className="label">AC Points</label>
              {num('acPoints')}
              <p className="text-xs text-gray-400 mt-1">25A dedicated circuits</p>
            </div>
            <div>
              <label className="label">Total Circuit Length (m) *</label>
              {num('totalCircuitLength')}
              <p className="text-xs text-gray-400 mt-1">sum of all wiring runs on drawing</p>
            </div>
            <div>
              <label className="label">DB Panels / Distribution Boards</label>
              {num('panels')}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs text-purple-700">
            <strong>Tip:</strong> Count each switch/socket/fan symbol on the electrical plan. For circuit length, sum the wiring routes shown on the drawing from DB to each point.
          </div>
        </>
      )}

      {type === 'other' && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Material calculation is available for Structural, Plumbing, and Electrical drawings.</p>
        </div>
      )}

      {type !== 'other' && (
        <div className="flex justify-end">
          <button onClick={submit} disabled={calculating} className="btn-primary">
            {calculating
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Calculator size={16} />}
            {calculating ? 'Calculating…' : 'Calculate Materials'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Materials table ───────────────────────────────────────────────────────────
function MaterialTable({ materials, prevMaterials }) {
  const prevMap = {};
  (prevMaterials || []).forEach(m => { prevMap[m.materialName] = m.quantity; });

  // Group by category
  const groups = materials.reduce((acc, m) => {
    if (!acc[m.category]) acc[m.category] = [];
    acc[m.category].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([cat, items]) => (
        <div key={cat}>
          <p className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg inline-block mb-2 ${CAT_COLORS[cat] || 'bg-gray-100 text-gray-600'}`}>
            {cat.replace(/_/g, ' ')}
          </p>
          <div className="space-y-1">
            {items.map((mat, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <p className="text-sm font-medium text-gray-800 flex-1 min-w-0 pr-4">{mat.materialName}</p>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-900 text-base">{mat.quantity?.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">{mat.unit}</p>
                  {prevMaterials && <DiffBadge oldQty={prevMap[mat.materialName]} newQty={mat.quantity} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Revision upload modal ────────────────────────────────────────────────────
function RevisionModal({ drawing, onClose, onUploaded }) {
  const [file, setFile]         = useState(null);
  const [note, setNote]         = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a drawing file');
    setLoading(true);
    const fd = new FormData();
    fd.append('file',         file);
    fd.append('project',      drawing.project?._id || drawing.project);
    fd.append('type',         drawing.type);
    fd.append('description',  drawing.description || '');
    fd.append('revisionNote', note);
    try {
      const res = await api.post('/drawings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Rev ${res.data.revision} uploaded — enter inputs to calculate materials`);
      onUploaded(res.data.drawing._id, res.data.prevInputs);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-800">Upload Revised Drawing</h3>
            <p className="text-xs text-gray-400 mt-0.5">Creates <strong>Rev {(drawing.revision || 0) + 1}</strong> — previous revision kept for reference</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Revision Note *</label>
            <input className="input" placeholder="e.g. Column positions revised per structural consultant"
              value={note} onChange={e => setNote(e.target.value)} required />
          </div>
          <div>
            <label className="label">Revised Drawing File *</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('revFile').click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
            >
              {file ? (
                <div className="flex items-center gap-2 justify-center">
                  <FileImage size={20} className="text-blue-500" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Drop file or click to browse</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DWG, DXF, PNG up to 30MB</p>
                </>
              )}
            </div>
            <input id="revFile" type="file" className="hidden"
              accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg"
              onChange={e => { if (e.target.files[0]) setFile(e.target.files[0]); }} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}
              {loading ? 'Uploading…' : 'Upload Revision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function MaterialCalculation() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [drawing, setDrawing]       = useState(null);
  const [revisions, setRevisions]   = useState([]);
  const [activeRev, setActiveRev]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [showInputs, setShowInputs] = useState(false);

  // Calculation state
  const [showForm, setShowForm]         = useState(false);   // show input form
  const [prefillInputs, setPrefillInputs] = useState(null); // for revision reuse
  const [calculating, setCalculating]   = useState(false);
  const [preview, setPreview]           = useState(null);    // materials preview (not yet saved)
  const [saving, setSaving]             = useState(false);

  const canEdit = ['director', 'site_engineer', 'builder', 'chairperson'].includes(user?.role);

  const loadDrawing = async (drawingId) => {
    setLoading(true);
    try {
      const [dRes, rRes] = await Promise.all([
        api.get(`/drawings/${drawingId}`),
        api.get(`/drawings/${drawingId}/revisions`),
      ]);
      setDrawing(dRes.data.drawing);
      setRevisions(rRes.data.revisions || []);
      setActiveRev(dRes.data.drawing);
      setPreview(null);
      // Auto-show form if drawing hasn't been calculated yet
      if (dRes.data.drawing.status === 'uploaded') {
        setShowForm(true);
      }
    } catch {
      toast.error('Could not load drawing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDrawing(id); }, [id]);

  const handleRevisionUploaded = (newId, prevInputs) => {
    setShowModal(false);
    setPrefillInputs(prevInputs);  // prefill inputs from previous revision
    navigate(`/drawings/${newId}/calculate`);
  };

  const handleCalculate = async (inputs) => {
    setCalculating(true);
    try {
      const res = await api.post(`/drawings/${activeRev._id}/calculate`, {
        inputs,
        saveToRequirements: false,   // preview only
      });
      setPreview(res.data.materials);
      setDrawing(prev => ({ ...prev, ...res.data.drawing }));
      setActiveRev(prev => ({ ...prev, ...res.data.drawing }));
      setShowForm(false);
      toast.success(`${res.data.materials.length} materials calculated — review then save to requirements`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const handleSaveToRequirements = async () => {
    setSaving(true);
    try {
      await api.post(`/drawings/${activeRev._id}/calculate`, {
        inputs: activeRev.inputs,
        saveToRequirements: true,
      });
      toast.success('✅ Material quantities saved to Project Requirements!');
      setPreview(null);
      await loadDrawing(id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const prevRevision = activeRev && revisions.length > 1
    ? revisions.find(r => r.revision === (activeRev.revision || 0) - 1)
    : null;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Loading drawing…</p>
    </div>
  );

  if (!drawing) return (
    <div className="card text-center py-16"><p className="text-gray-500">Drawing not found</p></div>
  );

  const displayDrawing = activeRev || drawing;
  const materials      = preview || displayDrawing.materialCalculations || [];
  const prevMaterials  = prevRevision?.materialCalculations || null;
  const isUnsaved      = preview !== null;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-gray-800">
              {TYPE_ICONS[drawing.type]} {TYPE_LABELS[drawing.type]} Drawing
            </h1>
            <RevLabel rev={drawing.revision} />
            {drawing.status === 'approved' && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold flex items-center gap-1">
                <CheckCircle size={11} /> Approved
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm">{drawing.project?.name}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {materials.length > 0 && !showForm && (
              <button onClick={() => { setShowForm(true); setPrefillInputs(displayDrawing.inputs); }}
                className="btn-secondary text-sm">
                <RefreshCw size={14} /> Recalculate
              </button>
            )}
            <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
              <Upload size={14} /> Upload Revision
            </button>
          </div>
        )}
      </div>

      {/* Revision tabs */}
      {revisions.length > 1 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch size={14} className="text-gray-400" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Revision History</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {revisions.map(rev => (
              <button key={rev._id} onClick={() => { setActiveRev(rev); setPreview(null); setShowForm(rev.status === 'uploaded'); }}
                className={`flex flex-col items-start px-4 py-2.5 rounded-xl border-2 text-left transition-all ${
                  activeRev?._id === rev._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <div className="flex items-center gap-2">
                  <RevLabel rev={rev.revision} />
                  {rev.isLatest && <span className="text-xs text-green-600 font-medium">Latest</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate max-w-[160px]">{rev.fileName}</p>
                {rev.revisionNote && <p className="text-xs text-orange-500 mt-0.5 italic">"{rev.revisionNote}"</p>}
                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={9} />{formatDate(rev.createdAt)}</span>
                  <span className="flex items-center gap-1"><User size={9} />{rev.uploadedBy?.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File info */}
      <div className="card p-4 flex items-center gap-4 flex-wrap">
        <FileImage size={18} className="text-blue-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm truncate">{displayDrawing.fileName}</p>
          {displayDrawing.description && <p className="text-xs text-gray-400">{displayDrawing.description}</p>}
          {displayDrawing.revisionNote && <p className="text-xs text-orange-500 mt-0.5 italic">📝 {displayDrawing.revisionNote}</p>}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
          <span className="flex items-center gap-1"><User size={11} />{displayDrawing.uploadedBy?.name}</span>
          <span className="flex items-center gap-1"><Clock size={11} />{formatDate(displayDrawing.createdAt)}</span>
        </div>
        {displayDrawing.inputs && Object.keys(displayDrawing.inputs).some(k => displayDrawing.inputs[k]) && (
          <button onClick={() => setShowInputs(v => !v)}
            className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 px-2.5 py-1.5 rounded-lg hover:bg-blue-50">
            {showInputs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showInputs ? 'Hide' : 'View'} Inputs
          </button>
        )}
      </div>

      {/* Inputs used */}
      {showInputs && displayDrawing.inputs && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
          {Object.entries(displayDrawing.inputs)
            .filter(([, v]) => v !== undefined && v !== null && v !== 0 && v !== '')
            .map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-gray-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-sm font-semibold text-gray-700">{String(v)}</p>
              </div>
            ))}
        </div>
      )}

      {/* Prefill banner for revisions */}
      {prefillInputs && showForm && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertCircle size={16} />
            <span>Previous revision inputs are prefilled — adjust for any design changes</span>
          </div>
          <button onClick={() => setPrefillInputs(null)} className="text-amber-600 hover:text-amber-800"><X size={16} /></button>
        </div>
      )}

      {/* Input form — shown when status is 'uploaded' or user clicked Recalculate */}
      {showForm && canEdit && (
        <InputForm
          type={displayDrawing.type}
          initial={prefillInputs || displayDrawing.inputs}
          onCalculate={handleCalculate}
          calculating={calculating}
        />
      )}

      {/* Status: no calculation yet */}
      {!showForm && materials.length === 0 && (
        <div className="card text-center py-12 text-gray-400">
          <Calculator size={40} className="mx-auto opacity-20 mb-3" />
          <p className="text-sm font-medium">No material calculation yet</p>
          <p className="text-xs mt-1">Enter the drawing parameters above to calculate required materials</p>
          {canEdit && (
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto">
              <Calculator size={15} /> Enter Inputs & Calculate
            </button>
          )}
        </div>
      )}

      {/* Materials result */}
      {materials.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-blue-500" />
              <h3 className="font-bold text-gray-900">Estimated Material Quantities</h3>
              {isUnsaved && (
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Preview — not saved yet</span>
              )}
            </div>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{materials.length} items</span>
          </div>

          {prevRevision && activeRev?.revision > 0 && (
            <div className="flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 text-sm text-orange-800 mb-4">
              <TrendingUp size={15} className="mt-0.5 flex-shrink-0" />
              <div>
                <strong>Comparing Rev {activeRev.revision} vs {prevRevision.revision === 0 ? 'Initial' : `Rev ${prevRevision.revision}`}</strong>
                <p className="text-xs mt-0.5 opacity-80">Arrows show quantity changes from the previous revision.</p>
              </div>
            </div>
          )}

          <MaterialTable materials={materials} prevMaterials={prevMaterials} />

          {/* Save to Requirements */}
          {canEdit && (
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Save to Project Requirements?</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  This will update the material procurement list for <strong>{drawing.project?.name}</strong>.
                  {isUnsaved ? ' Review the quantities above before saving.' : ' Requirements are already saved from a previous calculation.'}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link to="/materials/requirements" className="btn-secondary text-sm">
                  View Requirements
                </Link>
                <button onClick={handleSaveToRequirements} disabled={saving} className="btn-primary text-sm">
                  {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                  {saving ? 'Saving…' : 'Save to Requirements'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Revision modal */}
      {showModal && (
        <RevisionModal
          drawing={drawing}
          onClose={() => setShowModal(false)}
          onUploaded={handleRevisionUploaded}
        />
      )}
    </div>
  );
}
