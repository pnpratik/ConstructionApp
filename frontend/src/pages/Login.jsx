import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Director', email: 'director@demo.com', password: 'demo1234' },
    { role: 'Site Engineer', email: 'engineer@demo.com', password: 'demo1234' },
    { role: 'Civil Contractor', email: 'civil@demo.com', password: 'demo1234' },
    { role: 'Vendor', email: 'vendor@demo.com', password: 'demo1234' },
    { role: 'Delivery Op.', email: 'delivery@demo.com', password: 'demo1234' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-construction-700 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur">
              <Building2 size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Nirmaan</h1>
              <p className="text-blue-200">Complete Project Management</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { icon: '📐', title: 'Drawing Analysis', desc: 'Upload architectural, structural, plumbing & electrical drawings for auto material estimation' },
              { icon: '📦', title: 'Material Management', desc: 'Track all materials — total required vs. ordered vs. delivered, supplier-wise & material-wise' },
              { icon: '🔄', title: 'Order Workflow', desc: 'End-to-end order lifecycle: Request → Approval → Vendor → Dispatch → Delivery with Challan' },
              { icon: '👷', title: '9 Contractor Types', desc: 'Civil, Plumbing, Color, Lift, Electric, Tile, ACP, Aluminium, Door & Lock' },
            ].map(f => (
              <div key={f.title} className="flex gap-4 bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <p className="font-semibold">{f.title}</p>
                  <p className="text-blue-200 text-sm">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel – Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <Building2 size={28} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Nirmaan</h1>
          </div>

          <div className="card">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign In</h2>
            <p className="text-gray-500 mb-6">Access your construction management dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" className="input pl-10" placeholder="you@company.com"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPwd ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="••••••••"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Demo accounts */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-3 font-medium">DEMO ACCOUNTS (password: demo1234)</p>
              <div className="grid grid-cols-1 gap-2">
                {demoAccounts.map(acc => (
                  <button key={acc.email} type="button"
                    onClick={() => setForm({ email: acc.email, password: acc.password })}
                    className="text-left px-3 py-2 rounded-lg bg-gray-50 hover:bg-blue-50 text-xs text-gray-600 hover:text-blue-700 transition-colors border border-gray-100">
                    <span className="font-semibold">{acc.role}:</span> {acc.email}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
