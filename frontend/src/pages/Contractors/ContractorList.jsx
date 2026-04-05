import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, HardHat, Phone, Mail, Search } from 'lucide-react';
import api from '../../api/axios';

const TYPE_CONFIG = {
  civil: { label: 'Civil', icon: '🏗️', color: 'bg-gray-100 text-gray-700' },
  plumbing: { label: 'Plumbing', icon: '🔧', color: 'bg-blue-100 text-blue-700' },
  color: { label: 'Color / Paint', icon: '🎨', color: 'bg-pink-100 text-pink-700' },
  lift: { label: 'Lift', icon: '🛗', color: 'bg-orange-100 text-orange-700' },
  electrical: { label: 'Electrical', icon: '⚡', color: 'bg-yellow-100 text-yellow-700' },
  tile: { label: 'Tile', icon: '🟦', color: 'bg-teal-100 text-teal-700' },
  acp: { label: 'ACP', icon: '🏢', color: 'bg-purple-100 text-purple-700' },
  aluminium: { label: 'Aluminium', icon: '🪟', color: 'bg-indigo-100 text-indigo-700' },
  door_lock: { label: 'Door & Lock', icon: '🚪', color: 'bg-amber-100 text-amber-700' },
};

export default function ContractorList() {
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/contractors').then(r => setContractors(r.data.contractors || [])).finally(() => setLoading(false));
  }, []);

  const filtered = contractors
    .filter(c => filter === 'all' || c.type === filter)
    .filter(c =>
      c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.company?.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Contractors</h1><p className="text-gray-500">{contractors.length} contractors registered</p></div>
        <Link to="/contractors/new" className="btn-primary"><Plus size={16} /> Add Contractor</Link>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search contractors..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>All</button>
          {Object.entries(TYPE_CONFIG).map(([type, cfg]) => (
            <button key={type} onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === type ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {cfg.icon} {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16"><HardHat size={48} className="text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No contractors found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const cfg = TYPE_CONFIG[c.type] || { label: c.type, icon: '👷', color: 'bg-gray-100 text-gray-700' };
            return (
              <div key={c._id} className="card hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span className={`badge ${cfg.color} text-sm`}>{cfg.icon} {cfg.label}</span>
                  <span className={`badge ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <h3 className="font-semibold text-gray-800">{c.user?.name}</h3>
                {c.company && <p className="text-sm text-gray-500 mt-1">{c.company}</p>}
                <div className="mt-3 space-y-1.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><Phone size={12} className="text-gray-400" />{c.user?.phone || '-'}</div>
                  <div className="flex items-center gap-2"><Mail size={12} className="text-gray-400" />{c.user?.email}</div>
                  {c.license && <p className="text-xs text-gray-400">License: {c.license}</p>}
                  {c.experience > 0 && <p className="text-xs text-gray-400">Experience: {c.experience} years</p>}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs text-gray-400">{c.projects?.length || 0} projects</p>
                  <Link to={`/contractors/${c._id}/edit`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
