import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileImage, Calculator } from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';

const TYPE_ICONS = { architectural: '🏛️', structural: '🏗️', plumbing: '🔧', electrical: '⚡', other: '📄' };

export default function DrawingList() {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/drawings').then(r => setDrawings(r.data.drawings || [])).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? drawings : drawings.filter(d => d.type === filter);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Drawings</h1>
          <p className="text-gray-500">Upload and analyze construction drawings</p>
        </div>
        <Link to="/drawings/upload" className="btn-primary"><Plus size={16} /> Upload Drawing</Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'architectural', 'structural', 'plumbing', 'electrical', 'other'].map(type => (
          <button key={type} onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === type ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'}`}>
            {type === 'all' ? 'All' : `${TYPE_ICONS[type]} ${type.charAt(0).toUpperCase() + type.slice(1)}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <FileImage size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No drawings found. Upload your first drawing!</p>
          <Link to="/drawings/upload" className="btn-primary mt-4 inline-flex"><Plus size={16} /> Upload Drawing</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(drawing => (
            <div key={drawing._id} className="card hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{TYPE_ICONS[drawing.type] || '📄'}</span>
                  <div>
                    <p className="font-medium text-gray-800 text-sm capitalize">{drawing.type} Drawing</p>
                    <p className="text-xs text-gray-400">{drawing.project?.name}</p>
                  </div>
                </div>
                <StatusBadge status={drawing.status} />
              </div>
              <p className="text-sm text-gray-600 truncate">{drawing.fileName}</p>
              {drawing.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{drawing.description}</p>}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                <p className="text-xs text-gray-400">By {drawing.uploadedBy?.name}</p>
                <Link to={`/drawings/${drawing._id}/calculate`}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
                  <Calculator size={12} />
                  {drawing.status === 'analyzed' ? 'View Analysis' : 'Analyze Materials'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
