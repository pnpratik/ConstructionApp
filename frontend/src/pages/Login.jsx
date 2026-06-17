import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, Eye, EyeOff, ChevronRight, HardHat } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const QUICK_LOGINS = [
  { role: 'Director',  email: 'pratik@nirman.com',    color: 'bg-blue-600',    icon: '👔' },
  { role: 'Engineer',  email: 'rinko@nirman.com',     color: 'bg-emerald-600', icon: '🪖' },
  { role: 'Civil',     email: 'civil@nirman.com',     color: 'bg-orange-500',  icon: '🏗️' },
  { role: 'Vendor',    email: 'supplier1@nirman.com', color: 'bg-purple-600',  icon: '🏪' },
  { role: 'Delivery',  email: 'delivery@nirman.com',  color: 'bg-amber-500',   icon: '🚚' },
];

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success('Welcome, ' + user.name + '!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">

      {/* ── Left Hero (desktop) ───────────────────────── */}
      <div className="hidden md:flex md:w-[44%] bg-gradient-to-br from-blue-950 via-blue-800 to-blue-700 flex-col justify-between p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-blue-500 opacity-20 blur-3xl" />
          <div className="absolute bottom-10 right-0 w-60 h-60 rounded-full bg-blue-300 opacity-10 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border border-white/20">
            <Building2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Nirmaan</h1>
            <p className="text-blue-300 text-xs tracking-widest uppercase font-medium">Construction ERP</p>
          </div>
        </div>

        <div className="relative z-10 space-y-5">
          <h2 className="text-3xl font-bold leading-snug">Manage Your Site<br />From One Place</h2>
          <p className="text-blue-200 text-sm leading-relaxed">
            Complete construction management — material orders, deliveries, attendance tracking and payments.
          </p>
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            {['📦 Material Orders','🚚 Deliveries','👷 Attendance','📊 Reports','🏗️ Projects','💰 Payments'].map(f => (
              <div key={f} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5 border border-white/10 backdrop-blur-sm">
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-blue-300 text-xs">
          <HardHat size={13} />
          <span>Nirmaan Group · Ahmedabad, Gujarat</span>
        </div>
      </div>

      {/* ── Right Login Panel ─────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 md:p-12">
        {/* Mobile logo */}
        <div className="md:hidden flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Building2 size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nirmaan</h1>
            <p className="text-xs text-gray-500 tracking-widest uppercase">Construction ERP</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-7 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign In</h2>
            <p className="text-gray-400 text-sm mb-7">Enter your credentials to access the dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    className="input pl-10 h-12 text-sm md:text-base"
                    placeholder="you@nirman.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type={showPwd ? 'text' : 'password'}
                    className="input pl-10 pr-12 h-12 text-sm md:text-base"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold h-12 rounded-2xl transition-all shadow-md hover:shadow-lg text-base mt-1">
                {loading
                  ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Signing in...</span></>
                  : <><span>Sign In</span><ChevronRight size={18} /></>
                }
              </button>
            </form>

            {/* Quick demo login */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Demo Access</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_LOGINS.map(acc => (
                  <button key={acc.email} type="button"
                    onClick={() => setForm({ email: acc.email, password: 'demo1234' })}
                    className={`${acc.color} text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition-all shadow-sm`}>
                    <span>{acc.icon}</span>
                    {acc.role}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2.5">
                Password for all: <span className="font-mono font-bold text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">demo1234</span>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2025 Nirmaan Group · All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
}
