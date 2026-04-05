import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Calendar, Users } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const statusColors = { planning: 'bg-blue-50 border-blue-200', active: 'bg-green-50 border-green-200', completed: 'bg-gray-50 border-gray-200', on_hold: 'bg-orange-50 border-orange-200' };

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', location: '', budget: '', startDate: '', expectedEndDate: '', status: 'planning' });
  const { isAdmin } = useAuth();

  const load = () => {
    api.get('/projects').then(r => setProjects(r.data.projects || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', form);
      toast.success('Project created!');
      setShowModal(false);
      setForm({ name: '', description: '', location: '', budget: '', startDate: '', expectedEndDate: '', status: 'planning' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating project');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

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
            <Link key={project._id} to={`/projects/${project._id}`}
              className={`card hover:shadow-md transition-all border-2 ${statusColors[project.status] || 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-800 text-lg">{project.name}</h3>
                <StatusBadge status={project.status} />
              </div>
              {project.description && <p className="text-gray-500 text-sm mb-4 line-clamp-2">{project.description}</p>}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" />{project.location}</div>
                {project.budget > 0 && <div className="flex items-center gap-2"><span className="text-gray-400">₹</span>Budget: ₹{project.budget?.toLocaleString('en-IN')}</div>}
                {project.startDate && <div className="flex items-center gap-2"><Calendar size={14} className="text-gray-400" />{new Date(project.startDate).toLocaleDateString()}</div>}
                <div className="flex items-center gap-2"><Users size={14} className="text-gray-400" />{project.assignedEngineers?.length || 0} engineers</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Project" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Project Name *</label>
              <input className="input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sunrise Residency - Block A" />
            </div>
            <div className="col-span-2">
              <label className="label">Location *</label>
              <input className="input" required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Sector 12, Noida" />
            </div>
            <div className="col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Project overview..." />
            </div>
            <div>
              <label className="label">Budget (₹)</label>
              <input className="input" type="number" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} placeholder="0" />
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
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Project</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
