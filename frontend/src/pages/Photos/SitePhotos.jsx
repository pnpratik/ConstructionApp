import React, { useState, useEffect, useRef } from 'react';
import { Camera, Plus, Trash2, X, Filter, Upload, ZoomIn } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const FLOORS    = ['Ground', '1st', '2nd', '3rd', '4th', '5th', 'Terrace', 'Basement'];
const WORK_TYPES = ['Civil', 'Structural', 'Plumbing', 'Electrical', 'Tiles', 'Painting', 'ACP', 'Aluminium', 'Doors', 'Site Prep', 'Other'];

function LightBox({ photo, onClose }) {
  if (!photo) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/70 hover:text-white"><X size={24} /></button>
        <img src={photo.url} alt={photo.caption} className="w-full max-h-[80vh] object-contain rounded-xl" />
        <div className="text-white/70 text-sm mt-3 text-center">
          {photo.floor && <span className="mr-3">{photo.floor} Floor</span>}
          {photo.workType && <span className="mr-3">· {photo.workType}</span>}
          {photo.caption && <span>· {photo.caption}</span>}
          <span className="ml-3 text-white/40">· {new Date(photo.takenAt).toLocaleDateString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
}

function UploadModal({ open, onClose, projectId, onDone }) {
  const fileRef = useRef();
  const [files, setFiles]     = useState([]);
  const [previews, setPreviews] = useState([]);
  const [form, setForm]       = useState({ floor: '', workType: '', caption: '', takenAt: new Date().toISOString().slice(0,10) });
  const [uploading, setUploading] = useState(false);

  const handleFiles = (e) => {
    const fs = Array.from(e.target.files);
    setFiles(fs);
    setPreviews(fs.map(f => URL.createObjectURL(f)));
  };

  const submit = async () => {
    if (!files.length) return toast.error('Select at least one photo');
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('photos', f));
      fd.append('project', projectId);
      if (form.floor)    fd.append('floor', form.floor);
      if (form.workType) fd.append('workType', form.workType);
      if (form.caption)  fd.append('caption', form.caption);
      if (form.takenAt)  fd.append('takenAt', form.takenAt);
      await api.post('/site-photos', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded!`);
      setFiles([]);
      setPreviews([]);
      onClose();
      onDone();
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 text-lg">Upload Site Photos</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"><X size={18} /></button>
          </div>
          {/* File picker */}
          <div
            onClick={() => fileRef.current.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors mb-4"
          >
            {previews.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {previews.map((p, i) => <img key={i} src={p} className="w-full h-20 object-cover rounded-lg" alt="" />)}
              </div>
            ) : (
              <>
                <Upload size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">Click to select photos</p>
                <p className="text-xs text-gray-400">PNG, JPG up to 10MB each</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Floor</label>
                <select className="select" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })}>
                  <option value="">Select floor</option>
                  {FLOORS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Work Type</label>
                <select className="select" value={form.workType} onChange={e => setForm({ ...form, workType: e.target.value })}>
                  <option value="">Select type</option>
                  {WORK_TYPES.map(w => <option key={w}>{w}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Date Taken</label>
              <input type="date" className="input" value={form.takenAt} onChange={e => setForm({ ...form, takenAt: e.target.value })} />
            </div>
            <div>
              <label className="label">Caption (optional)</label>
              <input type="text" className="input" placeholder="e.g. Column casting completed" value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={submit} disabled={uploading} className="btn-primary flex-1 justify-center">
              {uploading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={15} />}
              {uploading ? 'Uploading…' : `Upload ${files.length || ''} Photo${files.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SitePhotos() {
  const { isAdmin } = useAuth();
  const [projects, setProjects]   = useState([]);
  const [projectId, setProjectId] = useState('');
  const [photos, setPhotos]       = useState([]);
  const [loading, setLoading]     = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [lightbox, setLightbox]   = useState(null);
  const [filter, setFilter]       = useState({ floor: '', workType: '' });

  useEffect(() => {
    api.get('/projects').then(r => {
      const list = r.data.projects || [];
      setProjects(list);
      if (list.length) setProjectId(list[0]._id);
    });
  }, []);

  const load = () => {
    if (!projectId) return;
    setLoading(true);
    const params = new URLSearchParams({ project: projectId });
    if (filter.floor)    params.set('floor', filter.floor);
    if (filter.workType) params.set('workType', filter.workType);
    api.get(`/site-photos?${params}`)
      .then(r => setPhotos(r.data.photos || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [projectId, filter]);

  const del = async (id) => {
    if (!window.confirm('Delete this photo?')) return;
    await api.delete(`/site-photos/${id}`);
    toast.success('Photo deleted');
    load();
  };

  // Group by date
  const grouped = photos.reduce((acc, p) => {
    const day = new Date(p.takenAt).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    if (!acc[day]) acc[day] = [];
    acc[day].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-5 animate-slide-up">
      <LightBox photo={lightbox} onClose={() => setLightbox(null)} />
      <UploadModal open={showUpload} onClose={() => setShowUpload(false)} projectId={projectId} onDone={load} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Site Photo Diary</h1>
          <p className="text-gray-400 text-sm mt-0.5">{photos.length} photos · visual progress log</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="select w-auto" value={projectId} onChange={e => setProjectId(e.target.value)}>
            {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <button onClick={() => setShowUpload(true)} className="btn-primary"><Plus size={16} /> Upload Photos</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select className="select w-auto" value={filter.floor} onChange={e => setFilter({ ...filter, floor: e.target.value })}>
          <option value="">All Floors</option>
          {FLOORS.map(f => <option key={f}>{f}</option>)}
        </select>
        <select className="select w-auto" value={filter.workType} onChange={e => setFilter({ ...filter, workType: e.target.value })}>
          <option value="">All Work Types</option>
          {WORK_TYPES.map(w => <option key={w}>{w}</option>)}
        </select>
        {(filter.floor || filter.workType) && (
          <button onClick={() => setFilter({ floor: '', workType: '' })} className="btn-secondary py-1.5 px-3 text-xs"><X size={12} /> Clear</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : photos.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Camera size={40} className="mx-auto opacity-20 mb-3" />
          <p className="text-sm">No photos yet</p>
          <button onClick={() => setShowUpload(true)} className="btn-primary mt-4 mx-auto"><Plus size={15} /> Upload First Photo</button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([day, dayPhotos]) => (
            <div key={day}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{day}</span>
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-300">{dayPhotos.length} photo{dayPhotos.length > 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {dayPhotos.map(photo => (
                  <div key={photo._id} className="group relative rounded-xl overflow-hidden bg-gray-100 aspect-square cursor-pointer" onClick={() => setLightbox(photo)}>
                    <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Tags */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {photo.floor    && <span className="text-[9px] font-bold bg-black/50 text-white px-1.5 py-0.5 rounded-full">{photo.floor}</span>}
                      {photo.workType && <span className="text-[9px] font-bold bg-blue-600/80 text-white px-1.5 py-0.5 rounded-full">{photo.workType}</span>}
                    </div>
                    {isAdmin() && (
                      <button
                        onClick={e => { e.stopPropagation(); del(photo._id); }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1 rounded-full transition-opacity"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                    {photo.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-[10px] text-white/90 line-clamp-1">{photo.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
