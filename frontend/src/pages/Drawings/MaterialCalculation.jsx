import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, RefreshCw, Upload,
  TrendingUp, TrendingDown, Minus, FileImage,
  Clock, User, ChevronDown, ChevronUp, GitBranch
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

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function RevLabel({ rev }) {
  if (rev === 0) return <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">Initial</span>;
  return <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-semibold">Rev {rev}</span>;
}

// ─── Diff badge: compare qty between old and new revision ─────────────────────
function DiffBadge({ oldQty, newQty }) {
  if (oldQty == null) return <span className="text-xs text-green-600 font-medium flex items-center gap-0.5"><TrendingUp size={11} />New</span>;
  const delta = newQty - oldQty;
  if (Math.abs(delta) < 0.01) return <span className="text-xs text-gray-400 flex items-center gap-0.5"><Minus size={11} />No change</span>;
  const pct = oldQty !== 0 ? ((delta / oldQty) * 100).toFixed(1) : '∞';
  return delta > 0
    ? <span className="text-xs text-red-600 font-medium flex items-center gap-0.5"><TrendingUp size={11} />+{pct}%</span>
    : <span className="text-xs text-green-600 font-medium flex items-center gap-0.5"><TrendingDown size={11} />{pct}%</span>;
}

// ─── Materials read-only table ────────────────────────────────────────────────
function MaterialTable({ materials, prevMaterials }) {
  const prevMap = {};
  (prevMaterials || []).forEach(m => { prevMap[m.materialName] = m.quantity; });

  return (
    <div className="space-y-2">
      {materials.map((mat, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{mat.materialName}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full ${CAT_COLORS[mat.category] || 'bg-gray-100 text-gray-600'}`}>
              {mat.category?.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="text-right ml-3 flex-shrink-0">
            <p className="font-bold text-gray-800">{mat.quantity?.toLocaleString()}</p>
            <p className="text-xs text-gray-400">{mat.unit}</p>
            {prevMaterials && <DiffBadge oldQty={prevMap[mat.materialName]} newQty={mat.quantity} />}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Inputs summary (read-only) ───────────────────────────────────────────────
function InputsSummary({ inputs, type }) {
  if (!inputs || Object.keys(inputs).length === 0) return null;
  const rows = [];

  if (['architectural', 'structural'].includes(type)) {
    if (inputs.floorArea)     rows.push(['Floor Area / Floor', `${inputs.floorArea} sqft`]);
    if (inputs.floors)        rows.push(['Number of Floors',   inputs.floors]);
    if (inputs.wallLength)    rows.push(['Wall Length',         `${inputs.wallLength} m`]);
    if (inputs.wallHeight)    rows.push(['Wall Height',         `${inputs.wallHeight} m`]);
    if (inputs.wallThickness) rows.push(['Wall Thickness',      `${inputs.wallThickness}"`]);
    if (inputs.masonryType)   rows.push(['Masonry Type',        inputs.masonryType === 'block' ? '🟫 Block' : '🧱 Brick']);
  }
  if (type === 'plumbing') {
    if (inputs.coldWaterPipeRuns) rows.push(['Cold Water Pipe', `${inputs.coldWaterPipeRuns} m`]);
    if (inputs.hotWaterPipeRuns)  rows.push(['Hot Water Pipe',  `${inputs.hotWaterPipeRuns} m`]);
    if (inputs.drainPipeRuns)     rows.push(['Drain Pipe',      `${inputs.drainPipeRuns} m`]);
    if (inputs.bathrooms)         rows.push(['Bathrooms',       inputs.bathrooms]);
    if (inputs.kitchens)          rows.push(['Kitchens',        inputs.kitchens]);
  }
  if (type === 'electrical') {
    if (inputs.lightPoints)        rows.push(['Light Points',    inputs.lightPoints]);
    if (inputs.fanPoints)          rows.push(['Fan Points',      inputs.fanPoints]);
    if (inputs.socketPoints)       rows.push(['Socket Points',   inputs.socketPoints]);
    if (inputs.acPoints)           rows.push(['AC Points',       inputs.acPoints]);
    if (inputs.totalCircuitLength) rows.push(['Circuit Length',  `${inputs.totalCircuitLength} m`]);
    if (inputs.panels)             rows.push(['DB Panels',       inputs.panels]);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
      {rows.map(([label, val]) => (
        <div key={label}>
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-sm font-semibold text-gray-700">{val}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Upload Revision Modal ─────────────────────────────────────────────────────
function RevisionModal({ drawing, onClose, onUploaded }) {
  const [file, setFile]         = useState(null);
  const [note, setNote]         = useState('');
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleFile = (f) => { if (f) setFile(f); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a drawing file');
    setLoading(true);
    const fd = new FormData();
    fd.append('file',          file);
    fd.append('project',       drawing.project?._id || drawing.project);
    fd.append('type',          drawing.type);
    fd.append('description',   drawing.description || '');
    fd.append('revisionNote',  note);
    try {
      const res = await api.post('/drawings', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Rev ${res.data.revision} uploaded & analyzed!`);
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
            <p className="text-xs text-gray-400 mt-0.5">Will create <strong>Rev {(drawing.revision || 0) + 1}</strong> — old drawing stays for reference</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Revision Note *</label>
            <input className="input" placeholder="e.g. Revised as per structural consultant's comments"
              value={note} onChange={e => setNote(e.target.value)} required />
          </div>
          <div>
            <label className="label">Revised Drawing File *</label>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => document.getElementById('revFile').click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all
                ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
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
              onChange={e => handleFile(e.target.files[0])} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}
              {loading ? 'Uploading…' : 'Upload & Analyze'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function MaterialCalculation() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const [drawing, setDrawing]         = useState(null);
  const [revisions, setRevisions]     = useState([]);
  const [activeRev, setActiveRev]     = useState(null); // drawing object of selected revision tab
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [showInputs, setShowInputs]   = useState(false);

  const canUploadRevision = ['director', 'site_engineer', 'builder', 'chairperson'].includes(user?.role);

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

  // Get previous revision for diff
  const prevRevision = activeRev && revisions.length > 1
    ? revisions.find(r => r.revision === activeRev.revision - 1)
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

  const displayDrawing  = activeRev || drawing;
  const materials       = displayDrawing.materialCalculations || [];
  const prevMaterials   = prevRevision?.materialCalculations || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-800">Material Analysis</h1>
            <RevLabel rev={drawing.revision} />
            {drawing.status === 'approved' && (
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold flex items-center gap-1">
                <CheckCircle size={11} /> Approved
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">
            {TYPE_ICONS[drawing.type]} {drawing.type?.charAt(0).toUpperCase() + drawing.type?.slice(1)} · {drawing.project?.name}
          </p>
        </div>

        {canUploadRevision && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <RefreshCw size={14} /> Upload Revision
          </button>
        )}
      </div>

      {/* Revision tabs — only show if more than 1 revision */}
      {revisions.length > 1 && (
        <div className="card p-3">
          <div className="flex items-center gap-2 mb-3">
            <GitBranch size={15} className="text-gray-400" />
            <p className="text-xs font-semibold text-gray-500 uppercase">Revision History</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {revisions.map(rev => (
              <button
                key={rev._id}
                onClick={() => setActiveRev(rev)}
                className={`flex flex-col items-start px-4 py-2.5 rounded-xl border-2 text-left transition-all ${
                  activeRev?._id === rev._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <RevLabel rev={rev.revision} />
                  {rev.isLatest && <span className="text-xs text-green-600 font-medium">Latest</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">{rev.fileName}</p>
                {rev.revisionNote && <p className="text-xs text-gray-400 mt-0.5 italic">"{rev.revisionNote}"</p>}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={10} />{formatDate(rev.createdAt)}</span>
                  <span className="flex items-center gap-1"><User size={10} />{rev.uploadedBy?.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drawing info bar */}
      <div className="card p-4 flex items-center gap-4 flex-wrap">
        <FileImage size={18} className="text-blue-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-800 text-sm truncate">{displayDrawing.fileName}</p>
          {displayDrawing.description && <p className="text-xs text-gray-400">{displayDrawing.description}</p>}
          {displayDrawing.revisionNote && (
            <p className="text-xs text-orange-600 mt-0.5 italic">📝 {displayDrawing.revisionNote}</p>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
          <span className="flex items-center gap-1"><User size={11} />{displayDrawing.uploadedBy?.name}</span>
          <span className="flex items-center gap-1"><Clock size={11} />{formatDate(displayDrawing.createdAt)}</span>
        </div>

        {/* Inputs toggle */}
        {displayDrawing.inputs && Object.keys(displayDrawing.inputs).length > 0 && (
          <button onClick={() => setShowInputs(v => !v)}
            className="flex items-center gap-1 text-xs text-blue-600 border border-blue-200 px-2.5 py-1.5 rounded-lg hover:bg-blue-50">
            {showInputs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showInputs ? 'Hide' : 'View'} Inputs
          </button>
        )}
      </div>

      {/* Inputs summary — collapsible */}
      {showInputs && (
        <InputsSummary inputs={displayDrawing.inputs} type={displayDrawing.type} />
      )}

      {/* Diff notice — when showing a revision */}
      {prevRevision && activeRev?.revision > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800 flex items-start gap-2">
          <TrendingUp size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <strong>Comparing Rev {activeRev.revision} vs {prevRevision.revision === 0 ? 'Initial' : `Rev ${prevRevision.revision}`}</strong>
            <p className="text-xs mt-0.5 opacity-80">Arrows show how quantities changed from the previous revision.</p>
          </div>
        </div>
      )}

      {/* Materials list — READ ONLY */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" />
            <h3 className="font-semibold text-gray-800">Estimated Materials</h3>
          </div>
          {materials.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="badge bg-green-100 text-green-700">{materials.length} items</span>
              <Link to="/materials/requirements" className="text-xs text-blue-600 hover:underline">
                View Requirements →
              </Link>
            </div>
          )}
        </div>

        {materials.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-sm">No material calculations found for this drawing.</p>
          </div>
        ) : (
          <MaterialTable materials={materials} prevMaterials={prevMaterials} />
        )}
      </div>

      {/* Revision upload modal */}
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
