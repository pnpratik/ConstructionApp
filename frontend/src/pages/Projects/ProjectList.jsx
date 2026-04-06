import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Calendar, Users, ImagePlus, X } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const statusColors = {
  planning:  'border-blue-200',
  active:    'border-green-200',
  completed: 'border-gray-200',
  on_hold:   'border-orange-200',
};

const statusBg = {
  planning:  'bg-blue-50',
  active:    'bg-green-50',
  completed: 'bg-gray-50',
  on_hold:   'bg-orange-50',
};

// ─── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project }) {
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  return (
    <Link
      to={`/projects/${project._id}`}
      className={`card hover:shadow-md transition-all border-2 overflow-hidden p-0 ${statusColors[project.status] || 'border-gray-100'}`}
    >
      {/* Project image / placeholder */}
      <div className={`relative h-36 w-full overflow-hidden ${project.imageUrl ? '' : statusBg[project.status] || 'bg-gray-50'}`}>
        {project.imageUrl ? (
          <img
            src={`${API_BASE}${project.imageUrl}`}
            alt={project.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-30">🏗️</span>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <StatusBadge status={project.status} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-lg mb-1 line-clamp-1">{project.name}</h3>
        {project.description && (
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">{project.description}</p>
        )}
        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin size={13} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{project.location}</span>
          </div>
          {project.budget > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs">₹</span>
              <span>₹{project.budget?.toLocaleString('en-IN')}</span>
            </div>
          )}
          {project.startDate && (
            <div className="flex items-center gap-2">
              <Calendar size={13} className="text-gray-400 flex-shrink-0" />
              <span>{new Date(project.startDate).toLocaleDateString('en-IN')}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users size={13} className="text-gray-400 flex-shrink-0" />
            <span>{project.assignedEngineers?.length || 0} engineers</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Image Upload Preview ──────────────────────────────────────────────────────
function ImageUploader({ onFileSelect }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onFileSelect(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleClear = () => {
    setPreview(null);
    onFileSelect(null);
    fileRef.current.value = '';
  };

  return (
    <div>
      <label className="label">Project Photo (optional)</label>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden h-40 bg-gray-100">
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          className="w-full h-28 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors"
        >
          <ImagePlus size={22} />
          <span className="text-sm">Click to upload site photo</span>
          <span className="text-xs">PNG, JPG up to 5MB</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectList() {
  const [projects, setProjects]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', location: '',
    budget: '', startDate: '', expectedEndDate: '', status: 'planning',
  });
  const { isAdmin } = useAuth();

  const load = () => {
    api.get('/projects')
      .then(r => setProjects(r.data.projects || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ name: '', description: '', location: '', budget: '', startDate: '', expectedEndDate: '', status: 'planning' });
    setImageFile(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Use FormData so we can send the image file alongside text fields
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      if (imageFile) fd.append('image', imageFile);

      await api.post('/projects', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Project created!');
      setShowModal(false);
      resetForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating project');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
          <p className="text-gray-500">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {isAdmin() && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🏗️</div>
          <p className="text-gray-500">No projects yet. Create your first project!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title="Create New Project" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image uploader at top */}
          <ImageUploader onFileSelect={setImageFile} />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Project Name *</label>
              <input
                className="input" required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Sunrise Residency – Block A"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Location *</label>
              <input
                className="input" required
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Sector 12, Gandhinagar"
              />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea
                className="input" rows={2}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Project overview..."
              />
            </div>
            <div>
              <label className="label">Budget (₹)</label>
              <input
                className="input" type="number"
                value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="label">Start Date</label>
              <input className="input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Expected End Date</label>
              <input className="input" type="date" value={form.expectedEndDate} onChange={e => setForm({ ...form, expectedEndDate: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={14} />}
              {saving ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
