import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen, ShoppingCart, Truck, Users, Clock,
  CheckCircle, Package, AlertCircle, HardHat
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/axios';
import StatusBadge from '../components/common/StatusBadge';
import WeatherWidget from '../components/WeatherWidget';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const PIE_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#6366f1', '#ec4899'];

const TYPE_LABELS = {
  civil: 'Civil', plumbing: 'Plumbing', color: 'Painting',
  lift: 'Lift', electrical: 'Electrical', tile: 'Tile',
  acp: 'ACP', aluminium: 'Aluminium', door_lock: 'Door & Lock',
};
const TYPE_COLORS = {
  civil:      'bg-orange-100 text-orange-700 border-orange-200',
  plumbing:   'bg-teal-100 text-teal-700 border-teal-200',
  color:      'bg-pink-100 text-pink-700 border-pink-200',
  lift:       'bg-yellow-100 text-yellow-700 border-yellow-200',
  electrical: 'bg-purple-100 text-purple-700 border-purple-200',
  tile:       'bg-blue-100 text-blue-700 border-blue-200',
  acp:        'bg-gray-100 text-gray-700 border-gray-200',
  aluminium:  'bg-indigo-100 text-indigo-700 border-indigo-200',
  door_lock:  'bg-green-100 text-green-700 border-green-200',
};

const StatCard = ({ icon: Icon, label, value, color, to }) => (
  <Link to={to} className="card hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </Link>
);

// ─── Today's Workforce Widget ──────────────────────────────────────────────────
function WorkforceWidget({ attendance, total }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <HardHat size={18} className="text-orange-500" />
          <h3 className="font-semibold text-gray-800">Today's Workforce at Site</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-800">{total}</span>
          <span className="text-sm text-gray-400">total workers</span>
          <Link
            to="/attendance"
            className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
          >
            Mark Attendance
          </Link>
        </div>
      </div>

      {attendance.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-gray-400">
          <HardHat size={36} className="opacity-20 mb-2" />
          <p className="text-sm">No attendance marked yet today</p>
          <Link to="/attendance" className="text-xs text-blue-500 mt-1 hover:underline">
            Mark now →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {attendance.map((r, i) => (
            <div key={i} className={`rounded-xl border p-3 ${TYPE_COLORS[r.contractorType] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase tracking-wide">
                  {TYPE_LABELS[r.contractorType] || r.contractorType}
                </span>
                <Users size={13} className="opacity-60" />
              </div>
              <p className="text-2xl font-bold">{r.presentCount}</p>
              <p className="text-xs opacity-70 truncate mt-0.5">{r.contractorName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats         = data?.stats || {};
  const attendance    = data?.attendance || [];
  const ordersByStatus = (data?.ordersByStatus || []).map(s => ({ name: s._id?.replace(/_/g, ' '), value: s.count }));
  const monthlyData   = (data?.monthlyOrders || []).map(m => ({ name: MONTHS[m._id.month - 1], orders: m.count }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">Welcome to Nirmaan – Construction Management</p>
      </div>

      {/* Stats row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderOpen}   label="Total Projects"   value={stats.totalProjects  || 0} color="bg-blue-500"   to="/projects" />
        <StatCard icon={ShoppingCart} label="Pending Orders"   value={stats.pendingOrders  || 0} color="bg-yellow-500" to="/orders?status=pending_approval" />
        <StatCard icon={Truck}        label="Total Vendors"    value={stats.totalVendors   || 0} color="bg-green-500"  to="/vendors" />
        <StatCard icon={HardHat}      label="Workers on Site"  value={stats.totalWorkersPresent || 0} color="bg-orange-500" to="/attendance" />
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={AlertCircle} label="Active Projects" value={stats.activeProjects   || 0} color="bg-orange-400" to="/projects" />
        <StatCard icon={Clock}       label="Total Orders"    value={stats.totalOrders      || 0} color="bg-indigo-500" to="/orders" />
        <StatCard icon={CheckCircle} label="Delivered"       value={stats.deliveredOrders  || 0} color="bg-teal-500"   to="/orders?status=delivered" />
        <StatCard icon={Users}       label="Contractors"     value={stats.totalContractors || 0} color="bg-purple-500" to="/contractors" />
      </div>

      {/* Today's Workforce + Weather side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkforceWidget attendance={attendance} total={stats.totalWorkersPresent || 0} />
        <WeatherWidget city="Ahmedabad" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Orders (Last 6 Months)</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-12">No data yet</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Orders by Status</h3>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}>
                  {ordersByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-12">No data yet</p>}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Recent Orders</h3>
          <Link to="/orders" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        {(data?.recentOrders || []).length === 0 ? (
          <p className="text-gray-400 text-center py-8">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Order #</th>
                  <th className="table-header">Project</th>
                  <th className="table-header">Requested By</th>
                  <th className="table-header">Vendor</th>
                  <th className="table-header">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentOrders || []).map(order => (
                  <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="table-cell">
                      <Link to={`/orders/${order._id}`} className="text-blue-600 hover:underline font-medium">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="table-cell">{order.project?.name || '-'}</td>
                    <td className="table-cell">{order.requestedBy?.name || '-'}</td>
                    <td className="table-cell">{order.vendor?.name || '-'}</td>
                    <td className="table-cell"><StatusBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
