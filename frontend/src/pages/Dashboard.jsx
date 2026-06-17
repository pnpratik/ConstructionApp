import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen, ShoppingCart, Truck, Users, Clock,
  CheckCircle, Package, AlertCircle, HardHat, TrendingUp,
  ArrowRight, IndianRupee,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../api/axios';
import StatusBadge from '../components/common/StatusBadge';
import WeatherWidget from '../components/WeatherWidget';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444','#6366f1','#ec4899'];

const TYPE_LABELS = {
  civil:'Civil', plumbing:'Plumbing', color:'Painting', lift:'Lift',
  electrical:'Electrical', tile:'Tile', acp:'ACP', aluminium:'Aluminium', door_lock:'Door & Lock',
};

function StatCard({ icon: Icon, label, value, gradient, to, sub }) {
  return (
    <Link to={to} className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md hover:shadow-lg transition-all active:scale-95 block">
      <div className={`absolute inset-0 ${gradient}`} />
      <div className="absolute -right-4 -bottom-4 opacity-10">
        <Icon size={80} strokeWidth={1} />
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Icon size={20} className="text-white" />
          </div>
          <ArrowRight size={16} className="text-white/60" />
        </div>
        <p className="text-3xl font-bold leading-none">{value}</p>
        <p className="text-white/80 text-sm mt-1 font-medium">{label}</p>
        {sub && <p className="text-white/60 text-xs mt-0.5">{sub}</p>}
      </div>
    </Link>
  );
}

function WorkforceWidget({ attendance, total }) {
  const TYPE_COLORS = {
    civil:      'border-orange-200 bg-orange-50 text-orange-700',
    plumbing:   'border-teal-200 bg-teal-50 text-teal-700',
    color:      'border-pink-200 bg-pink-50 text-pink-700',
    lift:       'border-yellow-200 bg-yellow-50 text-yellow-700',
    electrical: 'border-purple-200 bg-purple-50 text-purple-700',
    tile:       'border-blue-200 bg-blue-50 text-blue-700',
    acp:        'border-gray-200 bg-gray-50 text-gray-700',
    aluminium:  'border-indigo-200 bg-indigo-50 text-indigo-700',
    door_lock:  'border-green-200 bg-green-50 text-green-700',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
            <HardHat size={16} className="text-orange-600" />
          </div>
          <h3 className="font-bold text-gray-900 text-sm md:text-base">Today's Workforce</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-gray-900">{total}</span>
          <Link to="/attendance"
            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Mark
          </Link>
        </div>
      </div>

      {attendance.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-gray-300">
          <HardHat size={40} className="opacity-30 mb-2" />
          <p className="text-sm text-gray-400 font-medium">No attendance marked today</p>
          <Link to="/attendance" className="text-xs text-blue-500 mt-1.5 font-semibold hover:underline">
            Mark now →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {attendance.map((r, i) => (
            <div key={i} className={`rounded-xl border p-3 ${TYPE_COLORS[r.contractorType] || 'border-gray-200 bg-gray-50 text-gray-700'}`}>
              <p className="text-xs font-bold uppercase tracking-wide opacity-70 mb-1">
                {TYPE_LABELS[r.contractorType] || r.contractorType}
              </p>
              <p className="text-2xl font-bold leading-none">{r.presentCount}</p>
              <p className="text-xs opacity-60 truncate mt-1">{r.contractorName}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats          = data?.stats || {};
  const attendance     = data?.attendance || [];
  const ordersByStatus = (data?.ordersByStatus || []).map(s => ({ name: s._id?.replace(/_/g,' '), value: s.count }));
  const monthlyData    = (data?.monthlyOrders || []).map(m => ({ name: MONTHS[m._id.month - 1], orders: m.count }));

  return (
    <div className="space-y-5 md:space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">Nirmaan Construction Management</p>
      </div>

      {/* Stat cards — 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={FolderOpen}   label="Projects"       value={stats.totalProjects  || 0} gradient="bg-gradient-to-br from-blue-600 to-blue-500"    to="/projects" />
        <StatCard icon={ShoppingCart} label="Pending"        value={stats.pendingOrders  || 0} gradient="bg-gradient-to-br from-amber-500 to-orange-400"  to="/orders" sub="orders need approval" />
        <StatCard icon={CheckCircle}  label="Delivered"      value={stats.deliveredOrders|| 0} gradient="bg-gradient-to-br from-emerald-600 to-emerald-500" to="/deliveries" />
        <StatCard icon={HardHat}      label="Workers Today"  value={stats.totalWorkersPresent || 0} gradient="bg-gradient-to-br from-orange-500 to-red-400"   to="/attendance" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={Clock}        label="Total Orders"   value={stats.totalOrders      || 0} gradient="bg-gradient-to-br from-indigo-600 to-indigo-500" to="/orders" />
        <StatCard icon={Truck}        label="Vendors"        value={stats.totalVendors     || 0} gradient="bg-gradient-to-br from-teal-600 to-teal-500"    to="/vendors" />
        <StatCard icon={Users}        label="Contractors"    value={stats.totalContractors || 0} gradient="bg-gradient-to-br from-purple-600 to-purple-500" to="/contractors" />
        <StatCard icon={AlertCircle}  label="Active Projects" value={stats.activeProjects  || 0} gradient="bg-gradient-to-br from-pink-600 to-rose-500"    to="/projects" />
      </div>

      {/* Workforce + Weather */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <WorkforceWidget attendance={attendance} total={stats.totalWorkersPresent || 0} />
        <WeatherWidget city="Ahmedabad" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-blue-600" />
            <h3 className="font-bold text-gray-900 text-sm md:text-base">Monthly Orders</h3>
          </div>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Bar dataKey="orders" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-300 text-center py-12 text-sm">No data yet</p>}
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Package size={16} className="text-purple-600" />
            <h3 className="font-bold text-gray-900 text-sm md:text-base">Orders by Status</h3>
          </div>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={35}
                  label={({ name, value }) => `${value}`} labelLine={false}>
                  {ordersByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-300 text-center py-12 text-sm">No data yet</p>}
        </div>
      </div>

      {/* Recent Orders — mobile card view + desktop table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-sm md:text-base">Recent Orders</h3>
          <Link to="/orders" className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {(data?.recentOrders || []).length === 0 ? (
          <p className="text-gray-300 text-center py-8 text-sm">No orders yet</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-2.5">
              {(data?.recentOrders || []).slice(0, 5).map(order => (
                <Link key={order._id} to={`/orders/${order._id}`}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors active:scale-98 border border-gray-100">
                  <div>
                    <p className="text-sm font-bold text-blue-600">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">{order.project?.name || '-'}</p>
                    <p className="text-xs text-gray-400">{order.requestedBy?.name || '-'}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </Link>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header rounded-l-xl">Order #</th>
                    <th className="table-header">Project</th>
                    <th className="table-header">Requested By</th>
                    <th className="table-header">Vendor</th>
                    <th className="table-header rounded-r-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(data?.recentOrders || []).map(order => (
                    <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <Link to={`/orders/${order._id}`} className="text-blue-600 hover:underline font-semibold">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="table-cell text-gray-600">{order.project?.name || '-'}</td>
                      <td className="table-cell text-gray-600">{order.requestedBy?.name || '-'}</td>
                      <td className="table-cell text-gray-600">{order.vendor?.name || '-'}</td>
                      <td className="table-cell"><StatusBadge status={order.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
