import React, { useState, useEffect } from 'react';
import { Package, TrendingUp } from 'lucide-react';
import api from '../../api/axios';

const ProgressBar = ({ required, ordered, delivered }) => {
  const orderedPct = required > 0 ? Math.min(100, (ordered / required) * 100) : 0;
  const deliveredPct = required > 0 ? Math.min(100, (delivered / required) * 100) : 0;
  return (
    <div className="w-full">
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-200 rounded-full" style={{ width: `${orderedPct}%` }} />
        <div className="h-full bg-green-500 rounded-full -mt-3" style={{ width: `${deliveredPct}%` }} />
      </div>
      <div className="flex gap-4 mt-1 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-200 inline-block" />Ordered {orderedPct.toFixed(0)}%</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Delivered {deliveredPct.toFixed(0)}%</span>
      </div>
    </div>
  );
};

export default function MaterialRequirements() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/projects').then(r => {
      const projs = r.data.projects || [];
      setProjects(projs);
      if (projs.length > 0) setSelectedProject(projs[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    setLoading(true);
    api.get(`/materials/requirements/${selectedProject}`)
      .then(r => setRequirements(r.data.requirements || []))
      .finally(() => setLoading(false));
  }, [selectedProject]);

  const grouped = requirements.reduce((acc, r) => {
    const cat = r.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  const totalRequired = requirements.reduce((s, r) => s + r.totalRequired, 0);
  const totalOrdered = requirements.reduce((s, r) => s + r.totalOrdered, 0);
  const totalDelivered = requirements.reduce((s, r) => s + r.totalDelivered, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Material Requirements</h1>
          <p className="text-gray-500">Total required vs. ordered vs. delivered per project</p>
        </div>
        <select className="input w-auto" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
          <option value="">Select project...</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>

      {/* Summary cards */}
      {requirements.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Items', value: requirements.length, color: 'bg-blue-50 text-blue-700' },
            { label: 'Total Ordered', value: `${((totalOrdered / totalRequired) * 100).toFixed(0)}%`, color: 'bg-green-50 text-green-700' },
            { label: 'Total Delivered', value: `${((totalDelivered / totalRequired) * 100).toFixed(0)}%`, color: 'bg-teal-50 text-teal-700' },
          ].map(s => (
            <div key={s.label} className={`card text-center ${s.color}`}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-sm mt-1 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : !selectedProject ? (
        <div className="card text-center py-16"><Package size={48} className="text-gray-300 mx-auto mb-4" /><p className="text-gray-500">Select a project to view material requirements</p></div>
      ) : requirements.length === 0 ? (
        <div className="card text-center py-16"><TrendingUp size={48} className="text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No material requirements yet. Upload and analyze drawings first.</p></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="card">
              <h3 className="font-semibold text-gray-800 mb-4 capitalize flex items-center gap-2">
                <span className="w-2 h-5 bg-blue-500 rounded-full" />
                {category.replace(/_/g, ' ')} ({items.length} items)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-100">
                    <th className="table-header">Material</th>
                    <th className="table-header text-right">Total Required</th>
                    <th className="table-header text-right">Ordered</th>
                    <th className="table-header text-right">Delivered</th>
                    <th className="table-header text-right">Remaining</th>
                    <th className="table-header w-48">Progress</th>
                  </tr></thead>
                  <tbody>
                    {items.map(req => (
                      <tr key={req._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="table-cell font-medium">{req.materialName}</td>
                        <td className="table-cell text-right">{req.totalRequired?.toLocaleString()} <span className="text-gray-400 text-xs">{req.unit}</span></td>
                        <td className="table-cell text-right text-blue-600">{req.totalOrdered?.toLocaleString()} <span className="text-gray-400 text-xs">{req.unit}</span></td>
                        <td className="table-cell text-right text-green-600">{req.totalDelivered?.toLocaleString()} <span className="text-gray-400 text-xs">{req.unit}</span></td>
                        <td className={`table-cell text-right font-medium ${req.remaining > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                          {req.remaining?.toLocaleString() || 0} <span className="text-gray-400 text-xs">{req.unit}</span>
                        </td>
                        <td className="table-cell">
                          <ProgressBar required={req.totalRequired} ordered={req.totalOrdered} delivered={req.totalDelivered} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
