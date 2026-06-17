import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

export default function Layout() {
  const [collapsed, setCollapsed]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── Mobile sidebar overlay ─────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop always visible, mobile as drawer) ── */}
      <div className={`
        fixed md:relative z-50 h-full transition-transform duration-300 overflow-hidden
        ${collapsed ? '' : 'min-w-[256px]'}
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Main content ───────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* ── Bottom nav (mobile only) ───────────────── */}
      <BottomNav />
    </div>
  );
}
