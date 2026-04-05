import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Filter, Search } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';

const STATUS_OPTIONS = ['all', 'pending_approval', 'approved', 'sent_to_vendor', 'accepted_by_vendor', 'dispatched', 'delivered', 'rejected'];

export default function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const { canRequest } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status) setFilter(status);
  }, [searchParams]);

  useEffect(() => {
    const params = filter !== 'all' ? `?status=${filter}` : '';
    api.get(`/orders${params}`).then(r => setOrders(r.data.orders || [])).finally(() => setLoading(false));
  }, [filter]);

  const filtered = orders.filter(o =>
    o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
    o.project?.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.vendor?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const priorityBadge = { low: 'bg-gray-100 text-gray-500', medium: 'bg-blue-100 text-blue-600', high: 'bg-orange-100 text-orange-600', urgent: 'bg-red-100 text-red-600' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-gray-500">{filtered.length} orders</p>
        </div>
        {canRequest() && <Link to="/orders/new" className="btn-primary"><Plus size={16} /> New Order</Link>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search order, project, vendor..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'}`}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-gray-400 text-lg mb-2">No orders found</p>
          {canRequest() && <Link to="/orders/new" className="btn-primary inline-flex mt-4"><Plus size={16} />Create Order</Link>}
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gray-50 border-b border-gray-100">
                <th className="table-header">Order #</th>
                <th className="table-header">Project</th>
                <th className="table-header">Items</th>
                <th className="table-header">Vendor</th>
                <th className="table-header">Priority</th>
                <th className="table-header">Status</th>
                <th className="table-header">Date</th>
                <th className="table-header">Action</th>
              </tr></thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <Link to={`/orders/${order._id}`} className="text-blue-600 hover:underline font-bold">{order.orderNumber}</Link>
                    </td>
                    <td className="table-cell text-gray-600">{order.project?.name || '-'}</td>
                    <td className="table-cell">{order.items?.length || 0} items</td>
                    <td className="table-cell text-gray-600">{order.vendor?.name || <span className="text-gray-300">Not assigned</span>}</td>
                    <td className="table-cell">
                      <span className={`badge ${priorityBadge[order.priority] || 'bg-gray-100 text-gray-500'}`}>{order.priority}</span>
                    </td>
                    <td className="table-cell"><StatusBadge status={order.status} /></td>
                    <td className="table-cell text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <Link to={`/orders/${order._id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
