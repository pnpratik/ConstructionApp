import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, Download } from 'lucide-react';
import api from '../../api/axios';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export default function Reports() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/dashboard/stats'), api.get('/orders')]).then(([s, o]) => {
      setStats(s.data);
      setOrders(o.data.orders || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const ordersByStatus = (stats?.ordersByStatus || []).map(s => ({ name: s._id?.replace(/_/g, ' '), value: s.count }));
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = (stats?.monthlyOrders || []).map(m => ({ name: MONTHS[m._id.month - 1], orders: m.count }));

  // Vendor-wise order count
  const vendorOrders = orders.reduce((acc, o) => {
    const name = o.vendor?.name || 'Unassigned';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const vendorData = Object.entries(vendorOrders).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

  // Material category breakdown from orders
  const materialCatCount = {};
  orders.forEach(o => o.items?.forEach(item => {
    const cat = item.category || 'other';
    materialCatCount[cat] = (materialCatCount[cat] || 0) + 1;
  }));
  const matCatData = Object.entries(materialCatCount).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1><p className="text-gray-500">Comprehensive overview of construction activities</p></div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: stats?.stats?.totalProjects || 0, color: 'bg-blue-500' },
          { label: 'Total Orders', value: stats?.stats?.totalOrders || 0, color: 'bg-green-500' },
          { label: 'Delivered Orders', value: stats?.stats?.deliveredOrders || 0, color: 'bg-teal-500' },
          { label: 'Active Vendors', value: stats?.stats?.totalVendors || 0, color: 'bg-purple-500' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <div className={`w-12 h-12 ${s.color} rounded-xl mx-auto mb-3 flex items-center justify-center`}>
              <BarChart3 size={24} className="text-white" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{s.value}</p>
            <p className="text-gray-500 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Orders Trend</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData}><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-12">No data</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {ordersByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Top Vendors by Order Count</h3>
          {vendorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vendorData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip /><Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-center py-12">No data</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Material Categories Ordered</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={matCatData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {matCatData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
