import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, DollarSign, Users, FileImage, ShoppingCart, Package, ArrowLeft } from 'lucide-react';
import api from '../../api/axios';
import StatusBadge from '../../components/common/StatusBadge';

const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
    {children}
  </button>
);

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [drawings, setDrawings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/drawings?project=${id}`),
      api.get(`/orders?project=${id}`)
    ]).then(([p, d, o]) => {
      setProject(p.data.project);
      setDrawings(d.data.drawings || []);
      setOrders(o.data.orders || []);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!project) return <div className="card text-center py-16"><p className="text-gray-500">Project not found</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/projects" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
            <StatusBadge status={project.status} size="lg" />
          </div>
          <p className="text-gray-500 flex items-center gap-1 mt-1"><MapPin size={14} />{project.location}</p>
        </div>
        <div className="flex gap-3">
          <Link to={`/drawings/upload?project=${id}`} className="btn-secondary"><FileImage size={16} /> Upload Drawing</Link>
          <Link to={`/orders/new?project=${id}`} className="btn-primary"><ShoppingCart size={16} /> New Order</Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 flex gap-2">
        <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')}>Overview</TabBtn>
        <TabBtn active={tab === 'drawings'} onClick={() => setTab('drawings')}>Drawings ({drawings.length})</TabBtn>
        <TabBtn active={tab === 'orders'} onClick={() => setTab('orders')}>Orders ({orders.length})</TabBtn>
        <TabBtn active={tab === 'team'} onClick={() => setTab('team')}>Team</TabBtn>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Project Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Status', value: <StatusBadge status={project.status} /> },
                  { label: 'Budget', value: project.budget ? `₹${project.budget.toLocaleString('en-IN')}` : 'Not set' },
                  { label: 'Start Date', value: project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set' },
                  { label: 'End Date', value: project.expectedEndDate ? new Date(project.expectedEndDate).toLocaleDateString() : 'Not set' },
                  { label: 'Created By', value: project.createdBy?.name || '-' },
                  { label: 'Location', value: project.location },
                ].map(item => (
                  <div key={item.label}><p className="text-gray-400 text-xs">{item.label}</p><p className="font-medium text-gray-800 mt-1">{item.value}</p></div>
                ))}
              </div>
              {project.description && <p className="text-gray-600 text-sm mt-4 pt-4 border-t border-gray-100">{project.description}</p>}
            </div>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Drawings', value: drawings.length, icon: FileImage, to: '#', color: 'bg-blue-50 text-blue-600' },
              { label: 'Orders', value: orders.length, icon: ShoppingCart, to: '#', color: 'bg-green-50 text-green-600' },
              { label: 'Pending Orders', value: orders.filter(o => o.status === 'pending_approval').length, icon: Package, to: '#', color: 'bg-yellow-50 text-yellow-600' },
            ].map(s => (
              <div key={s.label} className="card flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={20} /></div>
                <div><p className="text-gray-500 text-sm">{s.label}</p><p className="text-2xl font-bold text-gray-800">{s.value}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'drawings' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Drawings</h3>
            <Link to={`/drawings/upload?project=${id}`} className="btn-primary text-sm"><FileImage size={14} /> Upload</Link>
          </div>
          {drawings.length === 0 ? <p className="text-gray-400 text-center py-12">No drawings uploaded yet</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {drawings.map(d => (
                <Link key={d._id} to={`/drawings/${d._id}/calculate`}
                  className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <FileImage size={16} className="text-blue-500" />
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="font-medium text-gray-800 text-sm truncate">{d.fileName}</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{d.type} Drawing</p>
                  <p className="text-xs text-gray-400 mt-1">By {d.uploadedBy?.name}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Orders</h3>
            <Link to={`/orders/new?project=${id}`} className="btn-primary text-sm"><ShoppingCart size={14} /> New Order</Link>
          </div>
          {orders.length === 0 ? <p className="text-gray-400 text-center py-12">No orders yet</p> : (
            <table className="w-full"><thead><tr className="border-b border-gray-100">
              <th className="table-header">Order #</th><th className="table-header">Items</th>
              <th className="table-header">Status</th><th className="table-header">Date</th>
            </tr></thead>
            <tbody>{orders.map(o => (
              <tr key={o._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="table-cell"><Link to={`/orders/${o._id}`} className="text-blue-600 hover:underline">{o.orderNumber}</Link></td>
                <td className="table-cell">{o.items?.length || 0} items</td>
                <td className="table-cell"><StatusBadge status={o.status} /></td>
                <td className="table-cell">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}</tbody></table>
          )}
        </div>
      )}

      {tab === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Site Engineers</h3>
            {(project.assignedEngineers || []).length === 0 ? <p className="text-gray-400 text-sm">No engineers assigned</p> :
              project.assignedEngineers.map(e => (
                <div key={e._id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">{e.name?.[0]}</div>
                  <div><p className="font-medium text-gray-800 text-sm">{e.name}</p><p className="text-xs text-gray-400">{e.email}</p></div>
                </div>
              ))}
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Contractors</h3>
            {(project.assignedContractors || []).length === 0 ? <p className="text-gray-400 text-sm">No contractors assigned</p> :
              project.assignedContractors.map(c => (
                <div key={c._id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">{c.name?.[0]}</div>
                  <div><p className="font-medium text-gray-800 text-sm">{c.name}</p><p className="text-xs text-gray-400 capitalize">{c.role?.replace(/_/g, ' ')}</p></div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
