import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calculator, FileImage, CheckCircle, ArrowLeft, Save } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const InputField = ({ label, unit, value, onChange, help }) => (
  <div>
    <label className="label">{label} {unit && <span className="text-gray-400 font-normal">({unit})</span>}</label>
    <input type="number" min="0" step="0.01" className="input" value={value} onChange={onChange} placeholder="0" />
    {help && <p className="text-xs text-gray-400 mt-1">{help}</p>}
  </div>
);

const STRUCTURAL_INPUTS = [
  { key: 'floorArea', label: 'Floor Area per Floor', unit: 'sqft', help: 'Built-up area of one floor' },
  { key: 'floors', label: 'Number of Floors', unit: '', help: 'Including ground floor' },
  { key: 'wallLength', label: 'Total Wall Length', unit: 'meters', help: 'Combined length of all walls' },
  { key: 'wallHeight', label: 'Wall Height', unit: 'meters', help: 'Floor to ceiling height (default 3m)' },
  { key: 'wallThickness', label: 'Wall Thickness', unit: 'inches', help: '4.5" (half brick) or 9" (full brick)' },
];
const PLUMBING_INPUTS = [
  { key: 'coldWaterPipeRuns', label: 'Cold Water Pipe Run', unit: 'meters' },
  { key: 'hotWaterPipeRuns', label: 'Hot Water Pipe Run', unit: 'meters' },
  { key: 'drainPipeRuns', label: 'Drainage Pipe Run', unit: 'meters' },
  { key: 'bathrooms', label: 'Number of Bathrooms', unit: 'nos' },
  { key: 'kitchens', label: 'Number of Kitchens', unit: 'nos' },
];
const ELECTRICAL_INPUTS = [
  { key: 'lightPoints', label: 'Light Points', unit: 'nos' },
  { key: 'fanPoints', label: 'Fan Points', unit: 'nos' },
  { key: 'socketPoints', label: 'Socket (5A/15A) Points', unit: 'nos' },
  { key: 'acPoints', label: 'AC Points', unit: 'nos' },
  { key: 'totalCircuitLength', label: 'Total Circuit Length', unit: 'meters', help: 'Approximate wiring run from panel to all points' },
  { key: 'panels', label: 'Distribution Panels', unit: 'nos' },
];

const CAT_COLORS = {
  steel: 'bg-gray-100 text-gray-700', cement: 'bg-yellow-50 text-yellow-700',
  brick: 'bg-orange-50 text-orange-700', block: 'bg-amber-50 text-amber-700',
  concrete: 'bg-blue-50 text-blue-700', other: 'bg-gray-50 text-gray-600',
  pipe: 'bg-teal-50 text-teal-700', fitting: 'bg-cyan-50 text-cyan-700',
  bath_fittings: 'bg-pink-50 text-pink-700', cable: 'bg-purple-50 text-purple-700',
  switch: 'bg-indigo-50 text-indigo-700', electrical_accessories: 'bg-violet-50 text-violet-700'
};

export default function MaterialCalculation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drawing, setDrawing] = useState(null);
  const [inputs, setInputs] = useState({});
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    api.get(`/drawings/${id}`).then(r => {
      const d = r.data.drawing;
      setDrawing(d);
      setInputs(d.inputs || {});
      setResults(d.materialCalculations || []);
    }).finally(() => setLoading(false));
  }, [id]);

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

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!drawing) return <div className="card text-center py-16"><p className="text-gray-500">Drawing not found</p></div>;

  const inputFields = getInputFields();
  const typeIcons = { architectural: '🏛️', structural: '🏗️', plumbing: '🔧', electrical: '⚡', other: '📄' };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Material Calculator</h1>
          <p className="text-gray-500">{typeIcons[drawing.type]} {drawing.type?.charAt(0).toUpperCase() + drawing.type?.slice(1)} Drawing — {drawing.project?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs panel */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <FileImage size={18} className="text-blue-500" />
            <h3 className="font-semibold text-gray-800">Drawing Inputs</h3>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium text-gray-700">{drawing.fileName}</p>
            <p className="text-gray-400 text-xs mt-1">{drawing.description}</p>
          </div>

          {inputFields.length === 0 ? (
            <p className="text-gray-400 text-sm">No calculation inputs available for this drawing type.</p>
          ) : (
            <div className="space-y-3">
              {inputFields.map(field => (
                <InputField key={field.key} label={field.label} unit={field.unit} help={field.help}
                  value={inputs[field.key] || ''}
                  onChange={e => setInputs({ ...inputs, [field.key]: parseFloat(e.target.value) || 0 })} />
              ))}
            </div>
          )}

          <button onClick={handleCalculate} disabled={calculating || inputFields.length === 0}
            className="btn-primary w-full justify-center">
            {calculating ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Calculator size={16} />}
            {calculating ? 'Calculating...' : 'Calculate Materials'}
          </button>
        </div>

        {/* Results panel */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-green-500" />
            <h3 className="font-semibold text-gray-800">Estimated Materials</h3>
            {results.length > 0 && <span className="badge bg-green-100 text-green-700 ml-auto">{results.length} items</span>}
          </div>

          {results.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calculator size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Enter drawing measurements and click Calculate</p>
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
              <button onClick={() => navigate('/materials/requirements')} className="btn-success mt-3 text-sm w-full justify-center">
                <Save size={14} /> View Material Requirements
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
