import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calculator, FileImage, CheckCircle, ArrowLeft, Save,
  Scan, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Info
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ─── Confidence badge ──────────────────────────────────────────────────────────
const ConfidenceBadge = ({ level }) => {
  const cfg = {
    high:    { label: 'High confidence',   cls: 'bg-green-100 text-green-700 border border-green-200' },
    medium:  { label: 'Medium confidence', cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
    low:     { label: 'Estimated',         cls: 'bg-orange-100 text-orange-700 border border-orange-200' },
  };
  const c = cfg[level] || cfg.low;
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.cls}`}>{c.label}</span>;
};

// ─── Input field with confidence indicator ─────────────────────────────────────
const InputField = ({ label, unit, value, onChange, help, confidence, autoFilled }) => (
  <div className="relative">
    <div className="flex items-center justify-between mb-1">
      <label className="label mb-0">
        {label} {unit && <span className="text-gray-400 font-normal">({unit})</span>}
      </label>
      {autoFilled && confidence && <ConfidenceBadge level={confidence} />}
    </div>
    <input
      type="number" min="0" step="0.01"
      className={`input ${autoFilled ? 'bg-blue-50 border-blue-200 focus:border-blue-400' : ''}`}
      value={value}
      onChange={onChange}
      placeholder="0"
    />
    {help && <p className="text-xs text-gray-400 mt-1">{help}</p>}
  </div>
);

// ─── Field definitions ─────────────────────────────────────────────────────────
// Structural numeric inputs (masonry type + wall thickness are separate selects)
const STRUCTURAL_INPUTS = [
  { key: 'floorArea',   label: 'Floor Area per Floor', unit: 'sqft',   help: 'Built-up area of one floor' },
  { key: 'floors',      label: 'Number of Floors',     unit: '',       help: 'Including ground floor' },
  { key: 'wallLength',  label: 'Total Wall Length',    unit: 'meters', help: 'Combined length of all walls per floor' },
  { key: 'wallHeight',  label: 'Wall Height',          unit: 'meters', help: 'Floor to ceiling height (default 3m)' },
];
const PLUMBING_INPUTS = [
  { key: 'coldWaterPipeRuns', label: 'Cold Water Pipe Run', unit: 'meters' },
  { key: 'hotWaterPipeRuns',  label: 'Hot Water Pipe Run',  unit: 'meters' },
  { key: 'drainPipeRuns',     label: 'Drainage Pipe Run',   unit: 'meters' },
  { key: 'bathrooms',         label: 'Number of Bathrooms', unit: 'nos' },
  { key: 'kitchens',          label: 'Number of Kitchens',  unit: 'nos' },
];
const ELECTRICAL_INPUTS = [
  { key: 'lightPoints',       label: 'Light Points',            unit: 'nos' },
  { key: 'fanPoints',         label: 'Fan Points',              unit: 'nos' },
  { key: 'socketPoints',      label: 'Socket (5A/15A) Points',  unit: 'nos' },
  { key: 'acPoints',          label: 'AC Points',               unit: 'nos' },
  { key: 'totalCircuitLength',label: 'Total Circuit Length',    unit: 'meters', help: 'Approximate wiring run' },
  { key: 'panels',            label: 'Distribution Panels',     unit: 'nos' },
];

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

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function MaterialCalculation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [drawing, setDrawing]           = useState(null);
  const [inputs, setInputs]             = useState({});
  const [results, setResults]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [analyzing, setAnalyzing]       = useState(false);
  const [calculating, setCalculating]   = useState(false);
  const [analysis, setAnalysis]         = useState(null);  // analysis metadata
  const [showDetails, setShowDetails]   = useState(false);
  const [autoFilled, setAutoFilled]     = useState(false);

  // ── Load drawing, then auto-analyze file ──────────────────────────────────
  useEffect(() => {
    api.get(`/drawings/${id}`)
      .then(r => {
        const d = r.data.drawing;
        setDrawing(d);
        // If previously calculated, restore those inputs/results
        if (d.inputs && Object.keys(d.inputs).length > 0) {
          setInputs(d.inputs);
        }
        setResults(d.materialCalculations || []);
        return d;
      })
      .then(d => {
        // Auto-trigger file analysis after loading drawing
        autoAnalyze(d);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const autoAnalyze = async (d) => {
    setAnalyzing(true);
    try {
      const res = await api.post(`/drawings/${id}/analyze`);
      const { analysis: a } = res.data;
      setAnalysis(a);

      if (a.inputs && Object.keys(a.inputs).length > 0) {
        setInputs(a.inputs);
        setAutoFilled(true);
        toast.success(
          a.confidence === 'high'
            ? '✅ Drawing analyzed – quantities extracted automatically!'
            : a.confidence === 'medium'
            ? '📐 Drawing analyzed – please verify the extracted values'
            : '⚠️ File analyzed with estimates – please review and adjust values',
          { duration: 4000 }
        );
      }
    } catch {
      // Silent fail – user can still enter manually
    } finally {
      setAnalyzing(false);
      setLoading(false);
    }
  };

  const handleReAnalyze = () => {
    setAnalysis(null);
    setAutoFilled(false);
    autoAnalyze(drawing);
  };

  const getInputFields = () => {
    if (!drawing) return [];
    if (['architectural', 'structural'].includes(drawing.type)) return STRUCTURAL_INPUTS;
    if (drawing.type === 'plumbing') return PLUMBING_INPUTS;
    if (drawing.type === 'electrical') return ELECTRICAL_INPUTS;
    return [];
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const res = await api.post(`/drawings/${id}/calculate`, { inputs });
      setResults(res.data.materials || []);
      setDrawing(res.data.drawing);
      toast.success('Materials calculated and saved to project requirements!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      {analyzing && (
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Scan size={16} className="text-blue-400" />
          Analyzing drawing file…
        </p>
      )}
    </div>
  );

  if (!drawing) return (
    <div className="card text-center py-16"><p className="text-gray-500">Drawing not found</p></div>
  );

  const inputFields = getInputFields();
  const typeIcons = { architectural: '🏛️', structural: '🏗️', plumbing: '🔧', electrical: '⚡', other: '📄' };

  const confidenceColor = {
    high:   'bg-green-50 border-green-200 text-green-800',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    low:    'bg-orange-50 border-orange-200 text-orange-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">Material Calculator</h1>
          <p className="text-gray-500">
            {typeIcons[drawing.type]} {drawing.type?.charAt(0).toUpperCase() + drawing.type?.slice(1)} Drawing — {drawing.project?.name}
          </p>
        </div>
        {analyzing && (
          <div className="flex items-center gap-2 text-blue-600 text-sm">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Analyzing file…
          </div>
        )}
      </div>

      {/* Analysis result banner */}
      {analysis && (
        <div className={`rounded-xl border p-4 ${confidenceColor[analysis.confidence] || confidenceColor.low}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {analysis.confidence === 'high' ? (
                <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p className="font-semibold text-sm">
                  {analysis.confidence === 'high' && 'Drawing analyzed successfully'}
                  {analysis.confidence === 'medium' && 'Drawing analyzed – please verify values'}
                  {analysis.confidence === 'low' && 'File analyzed with estimated values – adjust if needed'}
                </p>
                <p className="text-xs mt-0.5 opacity-80">
                  Format: <strong>{analysis.format?.toUpperCase().replace('_', ' ')}</strong>
                  {analysis.error && ` · Note: ${analysis.error}`}
                </p>
                {analysis.details?.length > 0 && (
                  <button
                    onClick={() => setShowDetails(v => !v)}
                    className="text-xs mt-1 underline opacity-70 flex items-center gap-1"
                  >
                    {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {showDetails ? 'Hide' : 'Show'} extraction details
                  </button>
                )}
                {showDetails && (
                  <ul className="mt-2 space-y-0.5">
                    {analysis.details.map((d, i) => (
                      <li key={i} className="text-xs opacity-70 flex items-start gap-1">
                        <Info size={10} className="mt-0.5 flex-shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <button
              onClick={handleReAnalyze}
              disabled={analyzing}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-white/60 hover:bg-white border border-current border-opacity-30 transition-colors"
            >
              <RefreshCw size={12} className={analyzing ? 'animate-spin' : ''} />
              Re-analyze
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs panel */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileImage size={18} className="text-blue-500" />
            <h3 className="font-semibold text-gray-800">Drawing Inputs</h3>
            {autoFilled && (
              <span className="ml-auto text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                Auto-extracted
              </span>
            )}
          </div>

          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium text-gray-700">{drawing.fileName}</p>
            {drawing.description && <p className="text-gray-400 text-xs mt-1">{drawing.description}</p>}
          </div>

          {autoFilled && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
              <Info size={13} className="text-blue-400 flex-shrink-0" />
              Fields highlighted in blue were extracted from the drawing file. You can edit them before calculating.
            </p>
          )}

          {inputFields.length === 0 ? (
            <p className="text-gray-400 text-sm">No calculation inputs for this drawing type.</p>
          ) : (
            <div className="space-y-3">
              {inputFields.map(field => (
                <InputField
                  key={field.key}
                  label={field.label}
                  unit={field.unit}
                  help={field.help}
                  value={inputs[field.key] ?? ''}
                  confidence={analysis?.confidence}
                  autoFilled={autoFilled && inputs[field.key] !== undefined}
                  onChange={e => setInputs({ ...inputs, [field.key]: parseFloat(e.target.value) || 0 })}
                />
              ))}

              {/* Masonry selects — only for structural / architectural drawings */}
              {drawing && ['structural', 'architectural'].includes(drawing.type) && (
                <>
                  {/* Masonry Type */}
                  <div>
                    <label className="label mb-1">Masonry Type</label>
                    <div className="flex gap-2">
                      {[
                        { val: 'brick', label: '🧱 Brick',  sub: 'Clay / Fly Ash' },
                        { val: 'block', label: '🟫 Block',  sub: 'AAC / Concrete' },
                      ].map(opt => (
                        <button key={opt.val} type="button"
                          onClick={() => setInputs(p => ({ ...p, masonryType: opt.val }))}
                          className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                            (inputs.masonryType || 'brick') === opt.val
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                          <span className="block text-xs font-normal mt-0.5 opacity-60">{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wall Thickness */}
                  <div>
                    <label className="label mb-1">Wall Thickness</label>
                    <div className="flex gap-2">
                      {[
                        { val: 3, label: '3"',  sub: 'Skin/Partition' },
                        { val: 4, label: '4"',  sub: 'Half Brick' },
                        { val: 9, label: '9"',  sub: 'Full Brick' },
                      ].map(opt => (
                        <button key={opt.val} type="button"
                          onClick={() => setInputs(p => ({ ...p, wallThickness: opt.val }))}
                          className={`flex-1 py-2.5 px-2 rounded-xl border-2 text-sm font-bold transition-all ${
                            (inputs.wallThickness ?? 9) === opt.val
                              ? 'border-orange-500 bg-orange-50 text-orange-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                          <span className="block text-xs font-normal mt-0.5 opacity-60">{opt.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            onClick={handleCalculate}
            disabled={calculating || inputFields.length === 0}
            className="btn-primary w-full justify-center"
          >
            {calculating
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Calculator size={16} />}
            {calculating ? 'Calculating…' : 'Calculate Materials'}
          </button>
        </div>

        {/* Results panel */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-green-500" />
            <h3 className="font-semibold text-gray-800">Estimated Materials</h3>
            {results.length > 0 && (
              <span className="badge bg-green-100 text-green-700 ml-auto">{results.length} items</span>
            )}
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calculator size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">
                {autoFilled
                  ? 'Values extracted from drawing. Click "Calculate Materials" to generate the list.'
                  : 'Adjust values if needed, then click "Calculate Materials"'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {results.map((mat, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{mat.materialName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${CAT_COLORS[mat.category] || 'bg-gray-100 text-gray-600'}`}>
                      {mat.category?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{mat.quantity?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{mat.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle size={14} />
                <p>Materials saved to project requirements</p>
              </div>
              <button
                onClick={() => navigate('/materials/requirements')}
                className="btn-success mt-3 text-sm w-full justify-center"
              >
                <Save size={14} /> View Material Requirements
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
