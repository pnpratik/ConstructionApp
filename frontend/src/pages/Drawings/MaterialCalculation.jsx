import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, RefreshCw, Upload, Save,
  TrendingUp, TrendingDown, Minus, FileImage,
  Clock, User, ChevronDown, ChevronUp, GitBranch,
  Calculator, AlertCircle, Package, X, Sparkles,
  AlertTriangle, RotateCcw, HelpCircle,
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
  tiles:                  'bg-green-50 text-green-700',
  pipe:                   'bg-teal-50 text-teal-700',
  fitting:                'bg-cyan-50 text-cyan-700',
  bath_fittings:          'bg-pink-50 text-pink-700',
  cable:                  'bg-purple-50 text-purple-700',
  switch:                 'bg-indigo-50 text-indigo-700',
  electrical_accessories: 'bg-violet-50 text-violet-700',
  other:                  'bg-gray-50 text-gray-600',
};

const TYPE_ICONS  = { architectural: '🏛️', structural: '🏗️', plumbing: '🔧', electrical: '⚡', other: '📄' };
const TYPE_LABELS = { architectural: 'Architectural', structural: 'Structural', plumbing: 'Plumbing', electrical: 'Electrical', other: 'Other' };

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  : '—';

const CONFIDENCE_BADGE = {
  high:   { cls: 'bg-green-100 text-green-700',  label: 'High confidence' },
  medium: { cls: 'bg-yellow-100 text-yellow-700', label: 'Medium confidence' },
  low:    { cls: 'bg-red-100 text-red-700',       label: 'Low confidence — verify values' },
};

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

// ─── AI Extracted field display ────────────────────────────────────────────────
function ExtractedRow({ label, value }) {
  if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return null;
  const display = Array.isArray(value) ? value.map(v => `${v}mm`).join(', ') : String(value);
  return (
    <div className="flex items-start gap-2">
      <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{display}</p>
      </div>
    </div>
  );
}

// ─── AI Analysis panel (extracted data + clarifying questions) ─────────────────
function AIAnalysisPanel({ drawing, onCalculate, calculating }) {
  const extracted = drawing.aiExtracted || {};
  const questions = drawing.aiClarifyingQuestions || [];
  const conf      = CONFIDENCE_BADGE[drawing.aiConfidence] || CONFIDENCE_BADGE.low;

  // Build answer state from questions
  const [answers, setAnswers] = useState(() => {
    const init = {};
    questions.forEach(q => { init[q.id] = ''; });
    return init;
  });

  const setAns = (id, val) => setAnswers(p => ({ ...p, [id]: val }));

  // Human-readable labels for extracted fields
  const FIELD_LABELS = {
    barDiameters:      'Bar Diameters (from BBS)',
    totalSteelKg:      'Total Steel (BBS grand total)',
    slabThickness:     'Slab Thickness (mm)',
    floorArea:         'Floor Area per floor (sqft)',
    floors:            'Number of Floors',
    concreteSlab:      'Slab Concrete (cum)',
    concreteColumn:    'Column/Beam Concrete (cum)',
    wallLength:        'Total Wall Length (m)',
    wallHeight:        'Floor-to-Ceiling Height (m)',
    wallThickness:     'Wall Thickness (inches)',
    masonryType:       'Masonry Type',
    coldWaterPipeRuns: 'Cold Water Pipe Runs (m)',
    hotWaterPipeRuns:  'Hot Water Pipe Runs (m)',
    drainPipeRuns:     'Drain Pipe Runs (m)',
    bathrooms:         'Bathrooms / Toilets',
    kitchens:          'Kitchens / Utility',
    lightPoints:       'Light Points',
    fanPoints:         'Fan Points',
    socketPoints:      'Socket / Power Points',
    acPoints:          'AC Points',
    totalCircuitLength:'Total Circuit Length (m)',
    panels:            'Distribution Boards',
  };

  const hasExtracted = Object.values(extracted).some(v =>
    v !== null && v !== undefined && v !== false && !(Array.isArray(v) && v.length === 0)
  );

  const handleSubmit = () => {
    // Validate all questions are answered
    for (const q of questions) {
      if (!answers[q.id] && answers[q.id] !== 0) {
        toast.error(`Please answer: "${q.question}"`);
        return;
      }
    }
    // Build final inputs: AI extracted + user answers mapped to fieldName
    const finalAnswers = {};
    questions.forEach(q => {
      const val = answers[q.id];
      finalAnswers[q.fieldName] = q.type === 'number' ? (Number(val) || 0) : val;
    });
    onCalculate(finalAnswers);
  };

  return (
    <div className="space-y-4">
      {/* AI extracted data */}
      {hasExtracted && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-blue-500" />
              <h3 className="font-bold text-gray-900">Read from Drawing</h3>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${conf.cls}`}>
              {conf.label}
            </span>
          </div>

          {drawing.aiNotes && (
            <p className="text-xs text-gray-500 italic border-l-2 border-blue-200 pl-3">{drawing.aiNotes}</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(extracted)
              .filter(([k]) => !['isTypicalSlab', 'isTypicalFloor'].includes(k))
              .map(([k, v]) => (
                <ExtractedRow key={k} label={FIELD_LABELS[k] || k} value={v} />
              ))}
          </div>

          {(extracted.isTypicalSlab || extracted.isTypicalFloor) && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-amber-800">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
              <span>This drawing shows a <strong>Typical {extracted.isTypicalSlab ? 'Slab' : 'Floor'}</strong> — the questions below will ask how many times to multiply.</span>
            </div>
          )}
        </div>
      )}

      {/* Clarifying questions */}
      {questions.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <HelpCircle size={16} className="text-orange-500" />
            <h3 className="font-bold text-gray-900">Quick Questions</h3>
            <span className="text-xs text-gray-400">— AI needs these to complete the calculation</span>
          </div>

          <div className="space-y-4">
            {questions.map(q => (
              <div key={q.id}>
                <label className="label">{q.question}</label>
                {q.type === 'select' && q.options?.length > 0 ? (
                  <select className="select text-sm" value={answers[q.id]} onChange={e => setAns(q.id, e.target.value)}>
                    <option value="">Select…</option>
                    {q.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input
                    type="number" min={0}
                    className="input text-sm"
                    placeholder={q.hint || ''}
                    value={answers[q.id]}
                    onChange={e => setAns(q.id, e.target.value)}
                  />
                )}
                {q.hint && <p className="text-xs text-gray-400 mt-1">{q.hint}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calculate button */}
      <div className="flex justify-end">
        <button onClick={handleSubmit} disabled={calculating} className="btn-primary">
          {calculating
            ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Calculator size={16} />}
          {calculating ? 'Calculating…' : 'Calculate Material Quantities'}
        </button>
      </div>
    </div>
  );
}

// ─── AI failed — manual fallback form ─────────────────────────────────────────
// Shown only when AI cannot read the file (DWG, API key missing, etc.)
const BAR_DIAMETERS = [
  { mm: '6',  desc: 'Stirrups / Ties' },
  { mm: '8',  desc: 'Slab Distribution' },
  { mm: '10', desc: 'Light Beam / Slab' },
  { mm: '12', desc: 'Slab Main / Columns' },
  { mm: '16', desc: 'Beams / Columns' },
  { mm: '20', desc: 'Heavy Beams / Columns' },
  { mm: '25', desc: 'Main Column Bars' },
  { mm: '32', desc: 'Heavy Columns / Raft' },
];

function ManualFallbackForm({ type, initial, onCalculate, calculating, aiError }) {
  const [v, setV] = useState(() => {
    if (type === 'structural') return {
      floorArea: initial?.floorArea || '', floors: initial?.floors || '',
      totalSteelKg: initial?.totalSteelKg || '', concreteSlab: initial?.concreteSlab || '', concreteColumn: initial?.concreteColumn || '',
    };
    if (type === 'architectural') return {
      floorArea: initial?.floorArea || '', floors: initial?.floors || '',
      wallLength: initial?.wallLength || '', wallHeight: initial?.wallHeight || '3',
      wallThickness: initial?.wallThickness || '9', masonryType: initial?.masonryType || 'brick',
    };
    if (type === 'plumbing') return {
      coldWaterPipeRuns: initial?.coldWaterPipeRuns || '', hotWaterPipeRuns: initial?.hotWaterPipeRuns || '',
      drainPipeRuns: initial?.drainPipeRuns || '', bathrooms: initial?.bathrooms || '', kitchens: initial?.kitchens || '',
    };
    if (type === 'electrical') return {
      lightPoints: initial?.lightPoints || '', fanPoints: initial?.fanPoints || '',
      socketPoints: initial?.socketPoints || '', acPoints: initial?.acPoints || '',
      totalCircuitLength: initial?.totalCircuitLength || '', panels: initial?.panels || '1',
    };
    return {};
  });
  const [barDiameters, setBarDiameters] = useState(initial?.barDiameters?.map(String) || []);

  const F = (k) => (
    <input type="number" min={0} className="input text-sm"
      value={v[k] ?? ''}
      onChange={e => setV(p => ({ ...p, [k]: e.target.value }))} />
  );
  const toggleDia = (mm) => setBarDiameters(p => p.includes(mm) ? p.filter(d => d !== mm) : [...p, mm]);

  const submit = () => {
    const n = (k) => Number(v[k]) || 0;
    if (type === 'structural') {
      if (!v.floorArea) return toast.error('Floor area is required');
      if (!v.floors)    return toast.error('Number of floors is required');
      if (!barDiameters.length) return toast.error('Select at least one bar diameter from the drawing');
      onCalculate({ floorArea: n('floorArea'), floors: n('floors'), totalSteelKg: n('totalSteelKg'), concreteSlab: n('concreteSlab'), concreteColumn: n('concreteColumn'), barDiameters });
    } else if (type === 'architectural') {
      if (!v.floorArea)  return toast.error('Floor area is required');
      if (!v.floors)     return toast.error('Number of floors is required');
      if (!v.wallLength) return toast.error('Total wall length is required');
      onCalculate({ floorArea: n('floorArea'), floors: n('floors'), wallLength: n('wallLength'), wallHeight: n('wallHeight') || 3, wallThickness: n('wallThickness') || 9, masonryType: v.masonryType });
    } else if (type === 'plumbing') {
      const total = n('coldWaterPipeRuns') + n('hotWaterPipeRuns') + n('drainPipeRuns');
      if (!total) return toast.error('Enter at least one pipe run length');
      onCalculate(Object.fromEntries(Object.entries(v).map(([k, val]) => [k, Number(val) || 0])));
    } else if (type === 'electrical') {
      if (!v.totalCircuitLength) return toast.error('Total circuit length is required');
      onCalculate(Object.fromEntries(Object.entries(v).map(([k, val]) => [k, Number(val) || 0])));
    }
  };

  return (
    <div className="card space-y-5">
      {aiError && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-sm text-amber-800">
          <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">AI could not read this file automatically</p>
            <p className="text-xs mt-0.5 text-amber-600">{aiError}</p>
            <p className="text-xs mt-1">Please enter the values from the drawing manually below.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Calculator size={18} className="text-gray-500" />
        <h3 className="font-bold text-gray-900">Enter Drawing Data Manually</h3>
      </div>

      {type === 'structural' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className="label">Floor Area per Floor (sqft) *</label>{F('floorArea')}</div>
            <div><label className="label">Number of Floors *</label>{F('floors')}<p className="text-xs text-gray-400 mt-1">G+2 = 3 floors</p></div>
            <div><label className="label">Total Steel from BBS (kg)</label>{F('totalSteelKg')}<p className="text-xs text-gray-400 mt-1">Leave blank to estimate</p></div>
            <div><label className="label">Slab Concrete (cum)</label>{F('concreteSlab')}</div>
            <div><label className="label">Column/Beam Concrete (cum)</label>{F('concreteColumn')}</div>
          </div>
          <div>
            <label className="label">Bar Diameters in this Drawing * <span className="text-red-500 text-xs font-normal">Only tick what's in the BBS</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              {BAR_DIAMETERS.map(({ mm, desc }) => {
                const checked = barDiameters.includes(mm);
                return (
                  <button key={mm} type="button" onClick={() => toggleDia(mm)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all
                      ${checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border-2 ${checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                      {checked && <svg viewBox="0 0 10 8" className="w-2.5 h-2.5"><path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>}
                    </div>
                    <div>
                      <p className={`text-sm font-bold leading-none ${checked ? 'text-blue-700' : 'text-gray-700'}`}>{mm}mm</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {type === 'architectural' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div><label className="label">Floor Area (sqft) *</label>{F('floorArea')}</div>
          <div><label className="label">Number of Floors *</label>{F('floors')}</div>
          <div><label className="label">Total Wall Length (m) *</label>{F('wallLength')}</div>
          <div><label className="label">Floor-to-Ceiling Height (m)</label>{F('wallHeight')}</div>
          <div>
            <label className="label">Wall Thickness</label>
            <select className="select text-sm" value={v.wallThickness} onChange={e => setV(p => ({ ...p, wallThickness: e.target.value }))}>
              <option value="3">3" Partition</option><option value="4">4" Half Brick</option><option value="9">9" Full Brick</option>
            </select>
          </div>
          <div>
            <label className="label">Masonry Type</label>
            <select className="select text-sm" value={v.masonryType} onChange={e => setV(p => ({ ...p, masonryType: e.target.value }))}>
              <option value="brick">Brick</option><option value="block">AAC Block</option>
            </select>
          </div>
        </div>
      )}

      {type === 'plumbing' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div><label className="label">Cold Water Pipe Runs (m)</label>{F('coldWaterPipeRuns')}</div>
          <div><label className="label">Hot Water Pipe Runs (m)</label>{F('hotWaterPipeRuns')}</div>
          <div><label className="label">Drain/Soil Pipe Runs (m)</label>{F('drainPipeRuns')}</div>
          <div><label className="label">Bathrooms / Toilets</label>{F('bathrooms')}</div>
          <div><label className="label">Kitchens / Utility</label>{F('kitchens')}</div>
        </div>
      )}

      {type === 'electrical' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div><label className="label">Light Points</label>{F('lightPoints')}</div>
          <div><label className="label">Fan Points</label>{F('fanPoints')}</div>
          <div><label className="label">Socket / Power Points</label>{F('socketPoints')}</div>
          <div><label className="label">AC Points</label>{F('acPoints')}</div>
          <div><label className="label">Total Circuit Length (m) *</label>{F('totalCircuitLength')}</div>
          <div><label className="label">DB Panels</label>{F('panels')}</div>
        </div>
      )}

      <div className="flex justify-end">
        <button onClick={submit} disabled={calculating} className="btn-primary">
          {calculating ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Calculator size={16} />}
          {calculating ? 'Calculating…' : 'Calculate Materials'}
        </button>
      </div>
    </div>
  );
}

// ─── Materials table ───────────────────────────────────────────────────────────
function MaterialTable({ materials, prevMaterials }) {
  const prevMap = {};
  (prevMaterials || []).forEach(m => { prevMap[m.materialName] = m.quantity; });

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
      toast.success(`Rev ${res.data.revision} uploaded — AI is reading the drawing…`);
      onUploaded(res.data.drawing._id);
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
            <p className="text-xs text-gray-400 mt-0.5">Creates <strong>Rev {(drawing.revision || 0) + 1}</strong></p>
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
            <label className="label">Revised Drawing File * (PDF, PNG, JPG for AI analysis)</label>
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
                  <p className="text-xs text-gray-400 mt-1">PDF / PNG / JPG (AI reads these) · DWG stored but not analyzed</p>
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
              {loading ? 'Uploading & Analyzing…' : 'Upload Revision'}
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

  const [showForm, setShowForm]       = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [preview, setPreview]         = useState(null);
  const [saving, setSaving]           = useState(false);
  const [reAnalyzing, setReAnalyzing] = useState(false);

  const canEdit = ['director', 'site_engineer', 'builder', 'chairperson'].includes(user?.role);

  const loadDrawing = async (drawingId) => {
    setLoading(true);
    try {
      const [dRes, rRes] = await Promise.all([
        api.get(`/drawings/${drawingId}`),
        api.get(`/drawings/${drawingId}/revisions`),
      ]);
      const d = dRes.data.drawing;
      setDrawing(d);
      setRevisions(rRes.data.revisions || []);
      setActiveRev(d);
      setPreview(null);
      // Show form if AI is done (has questions or extracted data) or if manual mode needed
      if (['ai_done', 'uploaded'].includes(d.status) && d.materialCalculations?.length === 0) {
        setShowForm(true);
      }
    } catch {
      toast.error('Could not load drawing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDrawing(id); }, [id]);

  const handleRevisionUploaded = (newId) => {
    setShowModal(false);
    navigate(`/drawings/${newId}/calculate`);
  };

  const handleCalculate = async (answers) => {
    setCalculating(true);
    try {
      const res = await api.post(`/drawings/${activeRev._id}/calculate`, {
        answers,
        saveToRequirements: false,
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
        answers: activeRev.inputs || {},
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

  const handleReAnalyze = async () => {
    setReAnalyzing(true);
    try {
      const res = await api.post(`/drawings/${activeRev._id}/re-analyze`);
      if (res.data.aiSuccess) {
        toast.success('Drawing re-analyzed by AI');
        await loadDrawing(id);
      } else {
        toast.error(res.data.aiError || 'Re-analysis failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Re-analysis failed');
    } finally {
      setReAnalyzing(false);
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
  const isAiDone       = displayDrawing.status === 'ai_done';
  const hasAiData      = isAiDone && (
    (displayDrawing.aiExtracted && Object.values(displayDrawing.aiExtracted).some(v => v !== null && v !== undefined)) ||
    (displayDrawing.aiClarifyingQuestions?.length > 0)
  );
  const aiError        = displayDrawing.aiError;

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
          <div className="flex gap-2 flex-wrap">
            {materials.length > 0 && !showForm && (
              <button onClick={() => setShowForm(true)} className="btn-secondary text-sm">
                <RefreshCw size={14} /> Recalculate
              </button>
            )}
            {(isAiDone || aiError) && (
              <button onClick={handleReAnalyze} disabled={reAnalyzing} className="btn-secondary text-sm">
                {reAnalyzing ? <span className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" /> : <RotateCcw size={14} />}
                Re-analyze
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
              <button key={rev._id}
                onClick={() => { setActiveRev(rev); setPreview(null); setShowForm(['ai_done','uploaded'].includes(rev.status) && !rev.materialCalculations?.length); }}
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
            .filter(([, v]) => v !== undefined && v !== null && v !== 0 && v !== '' && !(Array.isArray(v) && v.length === 0))
            .map(([k, v]) => (
              <div key={k}>
                <p className="text-xs text-gray-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-sm font-semibold text-gray-700">
                  {Array.isArray(v) ? v.map(d => `${d}mm`).join(', ') : String(v)}
                </p>
              </div>
            ))}
        </div>
      )}

      {/* AI analysis + questions form */}
      {showForm && canEdit && (
        hasAiData
          ? <AIAnalysisPanel drawing={displayDrawing} onCalculate={handleCalculate} calculating={calculating} />
          : <ManualFallbackForm
              type={displayDrawing.type}
              initial={displayDrawing.inputs}
              onCalculate={handleCalculate}
              calculating={calculating}
              aiError={aiError}
            />
      )}

      {/* Status: nothing calculated yet */}
      {!showForm && materials.length === 0 && (
        <div className="card text-center py-12 text-gray-400">
          <Sparkles size={40} className="mx-auto opacity-20 mb-3" />
          <p className="text-sm font-medium">No material calculation yet</p>
          <p className="text-xs mt-1">
            {hasAiData
              ? 'Drawing has been analyzed — answer the questions above to calculate materials'
              : 'Upload a PDF or image drawing for AI-powered material extraction'}
          </p>
          {canEdit && (
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 mx-auto">
              <Calculator size={15} /> Calculate Materials
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

          {canEdit && (
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Save to Project Requirements?</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Updates the procurement list for <strong>{drawing.project?.name}</strong>.
                  {isUnsaved ? ' Review quantities above before saving.' : ' Already saved from a previous calculation.'}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link to="/materials/requirements" className="btn-secondary text-sm">View Requirements</Link>
                <button onClick={handleSaveToRequirements} disabled={saving} className="btn-primary text-sm">
                  {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
                  {saving ? 'Saving…' : 'Save to Requirements'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <RevisionModal drawing={drawing} onClose={() => setShowModal(false)} onUploaded={handleRevisionUploaded} />
      )}
    </div>
  );
}
