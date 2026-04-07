import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileImage, Eye, GitBranch, Clock, User } from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';
import { useAuth } from '../../context/AuthContext';

const TYPE_ICONS   = { architectural: '🏛️', structural: '🏗️', plumbing: '🔧', electrical: '⚡', other: '📄' };
const TYPE_LABELS  = { architectural: 'Architectural', structural: 'Structural', plumbing: 'Plumbing', electrical: 'Electrical', other: 'Other' };

function RevBadge({ rev }) {
  if (rev === 0) return <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Initial</span>;
  return <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full font-medium">Rev {rev}</span>;
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export default function DrawingList() {
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const { user }                = useAuth();

  const canUpload = ['director', 'site_engineer', 'builder', 'chairperson'].includes(user?.role);

  useEffect(() => {
    api.get('/drawings')
      .then(r => setDrawings(r.data.drawings || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? drawings : drawings.filter(d => d.type === filter);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Drawings</h1>
          <p className="text-gray-500">{filtered.length} drawing{filtered.length !== 1 ? 's' : ''} · latest revisions shown</p>
        </div>
        {canUpload && (
          <Link to="/drawings/upload" className="btn-primary">
            <Plus size={16} /> Upload Drawing
          </Link>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'architectural', 'structural', 'plumbing', 'electrical', 'other'].map(type => (
          <button key={type} onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
            }`}>
            {type === 'all' ? 'All' : `${TYPE_ICONS[type]} ${TYPE_LABELS[type]}`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-16">
          <FileImage size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No drawings found. Upload your first drawing!</p>
          {canUpload && (
            <Link to="/drawings/upload" className="btn-primary inline-flex">
              <Plus size={16} /> Upload Drawing
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(drawing => (
            <div key={drawing._id} className="card hover:shadow-md transition-all flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{TYPE_ICONS[drawing.type] || '📄'}</span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm capitalize">
                      {TYPE_LABELS[drawing.type]} Drawing
                    </p>
                    <p className="text-xs text-gray-400">{drawing.project?.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <RevBadge rev={drawing.revision || 0} />
                  <StatusBadge status={drawing.status} />
                </div>
              </div>

              {/* File name */}
              <p className="text-sm text-gray-600 truncate font-medium">{drawing.fileName}</p>
              {drawing.description && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-1">{drawing.description}</p>
              )}
              {drawing.revisionNote && (
                <p className="text-xs text-orange-500 mt-1 italic line-clamp-1">📝 {drawing.revisionNote}</p>
              )}

              {/* Stats */}
              {drawing.materialCalculations?.length > 0 && (
                <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  {drawing.materialCalculations.length} materials calculated
                </div>
              )}

              {/* Footer */}
              <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><User size={10} />{drawing.uploadedBy?.name}</span>
                  <span className="flex items-center gap-1"><Clock size={10} />{formatDate(drawing.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Revision history hint */}
                  {drawing.revision > 0 && (
                    <span className="flex items-center gap-0.5 text-xs text-orange-500">
                      <GitBranch size={10} />{drawing.revision + 1} versions
                    </span>
                  )}
                  <Link
                    to={`/drawings/${drawing._id}/calculate`}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                  >
                    <Eye size={12} />
                    {drawing.status === 'analyzed' || drawing.status === 'approved' ? 'View' : 'Analyze'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
