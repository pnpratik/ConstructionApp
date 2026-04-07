import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, FileImage, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function DrawingUpload() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ project: searchParams.get('project') || '', type: '', description: '' });
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data.projects || []));
  }, []);

  const handleFile = (f) => {
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a drawing file');
    if (!form.project) return toast.error('Please select a project');
    if (!form.type) return toast.error('Please select drawing type');

    setLoading(true);
    const data = new FormData();
    data.append('file', file);
    data.append('project', form.project);
    data.append('type', form.type);
    data.append('description', form.description);

    try {
      const res = await api.post('/drawings', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      const conf = res.data.analysisConfidence;
      toast.success(
        res.data.isRevision
          ? `Rev ${res.data.revision} uploaded & analyzed!`
          : conf === 'high'
            ? '✅ Drawing analyzed — materials extracted!'
            : '📐 Drawing uploaded & analyzed — please review quantities',
        { duration: 4000 }
      );
      navigate(`/drawings/${res.data.drawing._id}/calculate`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={20} /></button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Upload Drawing</h1>
          <p className="text-gray-500">Upload once — materials are extracted and saved automatically</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="label">Project *</label>
          <select className="input" value={form.project} onChange={e => setForm({ ...form, project: e.target.value })} required>
            <option value="">Select project...</option>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Drawing Type *</label>
          <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
            <option value="">Select type...</option>
            <option value="architectural">🏛️ Architectural (Floor plans, elevation)</option>
            <option value="structural">🏗️ Structural (RCC, Steel framework)</option>
            <option value="plumbing">🔧 Plumbing (Pipes, drainage)</option>
            <option value="electrical">⚡ Electrical (Wiring, panels)</option>
            <option value="other">📄 Other</option>
          </select>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of this drawing..." />
        </div>

        {/* File drop zone */}
        <div>
          <label className="label">Drawing File * (PDF, DWG, PNG, JPG, DXF — max 20MB)</label>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
            onClick={() => document.getElementById('drawingFile').click()}
          >
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileImage size={24} className="text-blue-500" />
                <div className="text-left">
                  <p className="font-medium text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <>
                <Upload size={32} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Drop file here or click to browse</p>
                <p className="text-gray-400 text-sm mt-1">PDF, DWG, PNG, JPG, DXF up to 20MB</p>
              </>
            )}
          </div>
          <input id="drawingFile" type="file" className="hidden"
            accept=".pdf,.dwg,.png,.jpg,.jpeg,.dxf"
            onChange={e => handleFile(e.target.files[0])} />
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={16} />}
            {loading ? 'Uploading...' : 'Upload & Analyze'}
          </button>
        </div>
      </form>
    </div>
  );
}
