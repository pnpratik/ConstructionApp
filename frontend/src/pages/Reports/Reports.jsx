import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts';
import { TrendingUp, Users, Package, IndianRupee, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import api from '../../api/axios';

const TABS = ['Overview', 'Project Cost', 'Vendor Performance', 'Attendance', 'Materials'];
const fmt  = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const pct  = (n) => `${Math.round(n || 0)}%`;

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900 leading-none mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function OverviewTab() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/reports/overview').then(r => setData(r.data)).catch(console.error); }, []);
  if (!data) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  const STATUS_COLORS = { draft:'#94a3b8', pending_approval:'#f59e0b', approved:'#3b82f6', dispatched:'#8b5cf6', delivered:'#10b981', rejected:'#ef4444' };
  const pieData = (data.ordersByStatus || []).map(s => ({ name: s._id, value: s.count, color: STATUS_COLORS[s._id] || '#94a3b8' }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Package}     label="Total Orders"   value={data.totalOrders}  color="bg-blue-600" />
        <StatCard icon={IndianRupee} label="Total Payments" value={fmt(data.totalRevenue)} color="bg-emerald-500" />
        <StatCard icon={TrendingUp}  label="Projects"       value={data.totalProjects} color="bg-purple-500" />
        <StatCard icon={Users}       label="Active Users"   value={data.totalUsers}   color="bg-amber-500" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Legend formatter={v => v.replace(/_/g, ' ')} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Recent Payments</h3>
          <div className="space-y-2">
            {(data.recentPayments || []).map((p, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{p.order?.orderNumber || 'Payment'}</p>
                  <p className="text-xs text-gray-400">{p.paidBy?.name || 'Unknown'}</p>
                </div>
                <span className="text-sm font-bold text-emerald-600">{fmt(p.amount)}</span>
              </div>
            ))}
            {!data.recentPayments?.length && <p className="text-sm text-gray-400 text-center py-4">No payments yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCostTab() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/projects').then(r => {
      const list = r.data.projects || [];
      setProjects(list);
      if (list.length) setProjectId(list[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!projectId) return;
    api.get(`/reports/project-cost/${projectId}`).then(r => setData(r.data)).catch(console.error);
  }, [projectId]);

  const monthlyData = (data?.monthlyTrend || []).map(m => ({
    name: `${MONTH_NAMES[m._id.month - 1]} '${String(m._id.year).slice(-2)}`,
    spent: m.total,
  }));

  return (
    <div className="space-y-5">
      <select className="select w-64" value={projectId} onChange={e => setProjectId(e.target.value)}>
        {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
      </select>
      {data && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={IndianRupee} label="Total Order Value" value={fmt(data.totalOrderValue)} color="bg-blue-600" />
            <StatCard icon={CheckCircle} label="Total Paid"        value={fmt(data.totalPaid)}       color="bg-emerald-500" />
            <StatCard icon={Clock}       label="Pending Payment"   value={fmt(data.pendingPayment)}  color="bg-amber-500" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Monthly Spend Trend</h3>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                    <Line type="monotone" dataKey="spent" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill: '#3b82f6', r: 4 }} name="Spent" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-400 text-center py-8">No payment data</p>}
            </div>
            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Cost by Vendor</h3>
              {data.costByVendor?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.costByVendor.slice(0, 6)} layout="vertical" margin={{ left: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="_id" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                    <Tooltip formatter={v => fmt(v)} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                    <Bar dataKey="total" fill="#6366f1" radius={[0,4,4,0]} name="Amount" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-gray-400 text-center py-8">No vendor data</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function VendorTab() {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/reports/vendor-performance').then(r => setData(r.data)).catch(console.error); }, []);
  if (!data) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs text-gray-500 font-semibold px-5 py-3">Vendor</th>
              <th className="text-center text-xs text-gray-500 font-semibold px-3 py-3">Orders</th>
              <th className="text-center text-xs text-gray-500 font-semibold px-3 py-3">Delivered</th>
              <th className="text-center text-xs text-gray-500 font-semibold px-3 py-3 hidden sm:table-cell">On-Time</th>
              <th className="text-right text-xs text-gray-500 font-semibold px-5 py-3">Total Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(data.vendors || []).map((v, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="text-sm font-semibold text-gray-800">{v.vendor}</p>
                  <p className="text-xs text-gray-400">{v.email}</p>
                </td>
                <td className="text-center px-3 py-3 text-sm text-gray-700">{v.totalOrders}</td>
                <td className="text-center px-3 py-3">
                  <div className="inline-flex flex-col items-center">
                    <span className="text-sm font-bold text-emerald-600">{pct(v.deliveryRate)}</span>
                    <span className="text-[10px] text-gray-400">{v.delivered}/{v.totalOrders}</span>
                  </div>
                </td>
                <td className="text-center px-3 py-3 hidden sm:table-cell">
                  <span className={`text-sm font-bold ${v.onTimeRate >= 80 ? 'text-emerald-600' : v.onTimeRate >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {pct(v.onTimeRate)}
                  </span>
                </td>
                <td className="text-right px-5 py-3 text-sm font-semibold text-gray-800">{fmt(v.totalValue)}</td>
              </tr>
            ))}
            {!data.vendors?.length && (
              <tr><td colSpan={5} className="text-center py-8 text-sm text-gray-400">No vendor data</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AttendanceTab() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  useEffect(() => {
    setData(null);
    api.get(`/reports/attendance-summary?days=${days}`).then(r => setData(r.data)).catch(console.error);
  }, [days]);
  if (!data) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <StatCard icon={Users} label="Overall Attendance Rate" value={pct(data.overallRate)} color={data.overallRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'} />
        <select className="select w-auto" value={days} onChange={e => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 3 months</option>
        </select>
      </div>
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-4 text-sm">Daily Attendance (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.byDay || []}>
            <XAxis dataKey="_id" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={d => d?.slice(5)} />
            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
            <Bar dataKey="present" stackId="a" fill="#10b981" radius={[4,4,0,0]} name="Present" />
            <Bar dataKey="absent"  stackId="a" fill="#ef4444" name="Absent" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm">Staff Attendance Summary</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {(data.summary || []).sort((a, b) => b.present - a.present).map((u, i) => {
            const rate = u.total > 0 ? Math.round((u.present / u.total) * 100) : 0;
            return (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold flex-shrink-0">
                  {u.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-800">{u.name}</p>
                    <span className={`text-xs font-bold ${rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{rate}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
                  </div>
                  <div className="flex gap-3 mt-0.5 text-[10px] text-gray-400">
                    <span>Present: {u.present}</span>
                    <span>Absent: {u.absent}</span>
                    {u.halfDay > 0 && <span>Half: {u.halfDay}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MaterialsTab() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data.projects || []));
  }, []);

  useEffect(() => {
    const params = projectId ? `?project=${projectId}` : '';
    api.get(`/reports/material-consumption${params}`).then(r => setData(r.data)).catch(console.error);
  }, [projectId]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select className="select w-auto" value={projectId} onChange={e => setProjectId(e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
      </div>
      {data && (
        <>
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4 text-sm">Top Materials by Value (Delivered Orders)</h3>
            {data.materials?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.materials.slice(0, 10)} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="_id" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip formatter={(v, n) => [n === 'totalValue' ? fmt(v) : v, n === 'totalValue' ? 'Value' : 'Qty']} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                  <Bar dataKey="totalValue" fill="#f97316" radius={[0,4,4,0]} name="totalValue" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-gray-400 text-center py-8">No delivered material data</p>}
          </div>
          <div className="card p-0 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs text-gray-500 font-semibold px-5 py-3">Material</th>
                  <th className="text-center text-xs text-gray-500 font-semibold px-3 py-3">Total Qty</th>
                  <th className="text-center text-xs text-gray-500 font-semibold px-3 py-3">Orders</th>
                  <th className="text-right text-xs text-gray-500 font-semibold px-5 py-3">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(data.materials || []).map((m, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5 text-sm font-medium text-gray-800">{m._id}</td>
                    <td className="text-center px-3 py-2.5 text-sm text-gray-700">{m.totalQty}</td>
                    <td className="text-center px-3 py-2.5 text-sm text-gray-700">{m.orders}</td>
                    <td className="text-right px-5 py-2.5 text-sm font-semibold text-gray-800">{fmt(m.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function Reports() {
  const [tab, setTab] = useState(0);

  return (
    <div className="space-y-5 animate-slide-up">
      <div>
        <h1 className="page-title">Advanced Reports</h1>
        <p className="text-gray-400 text-sm mt-0.5">Analytics, trends, and performance insights</p>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto gap-1 pb-1 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === i ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && <OverviewTab />}
      {tab === 1 && <ProjectCostTab />}
      {tab === 2 && <VendorTab />}
      {tab === 3 && <AttendanceTab />}
      {tab === 4 && <MaterialsTab />}
    </div>
  );
}
