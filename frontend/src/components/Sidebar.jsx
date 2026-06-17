import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, FileImage, Package, ShoppingCart, IndianRupee,
  Users, Truck, Bell, BarChart3, Building2, HardHat, Layers,
  LogOut, ChevronLeft, ChevronRight, Settings, X,
  Wallet, CalendarDays, Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const ROLE_LABELS = {
  chairperson: 'Chairperson', director: 'Director', builder: 'Builder',
  site_engineer: 'Site Engineer', civil_contractor: 'Civil Contractor',
  plumbing_contractor: 'Plumbing Contractor', color_contractor: 'Color Contractor',
  lift_contractor: 'Lift Contractor', electric_contractor: 'Electric Contractor',
  tile_contractor: 'Tile Contractor', acp_contractor: 'ACP Contractor',
  aluminium_contractor: 'Aluminium Contractor', door_lock_contractor: 'Door & Lock',
  vendor: 'Vendor', delivery_operator: 'Delivery Operator', admin: 'Admin',
};

const ROLE_COLORS = {
  chairperson: 'bg-purple-100 text-purple-700',
  director: 'bg-blue-100 text-blue-700',
  builder: 'bg-indigo-100 text-indigo-700',
  site_engineer: 'bg-emerald-100 text-emerald-700',
  vendor: 'bg-orange-100 text-orange-700',
  delivery_operator: 'bg-amber-100 text-amber-700',
};

function NavItem({ to, icon: Icon, label, badge, collapsed, end }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) =>
        `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-2' : ''}`
      }
      title={collapsed ? label : undefined}
    >
      <Icon size={18} strokeWidth={2} />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {badge > 0 && !collapsed && (
        <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {badge > 0 && collapsed && (
        <span className="absolute top-1 right-1 bg-red-500 w-2 h-2 rounded-full" />
      )}
    </NavLink>
  );
}

function SectionLabel({ label, collapsed }) {
  if (collapsed) return <hr className="border-gray-100 my-2" />;
  return <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-4 pb-1">{label}</p>;
}

export default function Sidebar({ collapsed, setCollapsed, onClose }) {
  const { user, logout, isAdmin } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const isVendor    = user?.role === 'vendor';
  const isDelivery  = user?.role === 'delivery_operator';
  const isAdmin_    = isAdmin?.();
  const isManagement = ['director','chairperson','builder','admin'].includes(user?.role);
  const isContractor = user?.role?.includes('contractor');
  const isSiteUser   = ['site_engineer','builder','director','chairperson'].includes(user?.role) || isContractor;

  const handleLogout = () => { logout(); navigate('/login'); };

  const avatarColor = ROLE_COLORS[user?.role] || 'bg-gray-100 text-gray-600';

  return (
    <aside className={`
      ${collapsed ? 'w-16' : 'w-64'}
      transition-all duration-300 bg-white border-r border-gray-100
      flex flex-col h-full shadow-sm
    `}>

      {/* ── Header ───────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">Nirmaan</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Construction ERP</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <Building2 size={16} className="text-white" />
          </div>
        )}

        {/* Close button (mobile) / collapse (desktop) */}
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={onClose}
            className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={16} />
          </button>
          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
      </div>

      {/* ── User info ────────────────────────────────── */}
      {!collapsed && (
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${avatarColor}`}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-800 truncate leading-none">{user?.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Navigation ───────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} end />
        <NavItem to="/projects" icon={FolderOpen} label="Projects" collapsed={collapsed} />

        {!isVendor && !isDelivery && (
          <>
            <SectionLabel label="Materials" collapsed={collapsed} />
            <NavItem to="/drawings" icon={FileImage} label="Drawings" collapsed={collapsed} />
            <NavItem to="/materials" icon={Package} label="Inventory" collapsed={collapsed} />
            <NavItem to="/materials/requirements" icon={Layers} label="Requirements" collapsed={collapsed} />
          </>
        )}

        <SectionLabel label="Operations" collapsed={collapsed} />
        <NavItem to="/orders" icon={ShoppingCart} label="Orders" collapsed={collapsed} />
        <NavItem to="/deliveries" icon={Truck} label="Deliveries" collapsed={collapsed} />

        {isSiteUser && (
          <NavItem to="/attendance" icon={HardHat} label="Attendance" collapsed={collapsed} />
        )}

        {isManagement && (
          <NavItem to="/payments" icon={IndianRupee} label="Payments" collapsed={collapsed} />
        )}

        {isManagement && (
          <>
            <SectionLabel label="Planning" collapsed={collapsed} />
            <NavItem to="/budget"      icon={Wallet}       label="Budget Tracker"  collapsed={collapsed} />
            <NavItem to="/schedule"    icon={CalendarDays} label="Work Schedule"   collapsed={collapsed} />
            <NavItem to="/site-photos" icon={Camera}       label="Site Photo Diary" collapsed={collapsed} />
          </>
        )}

        <SectionLabel label="Management" collapsed={collapsed} />
        {isAdmin_ && <NavItem to="/vendors" icon={Users} label="Vendors" collapsed={collapsed} />}
        {isAdmin_ && <NavItem to="/contractors" icon={HardHat} label="Contractors" collapsed={collapsed} />}
        {isAdmin_ && <NavItem to="/reports" icon={BarChart3} label="Reports" collapsed={collapsed} />}
        {isManagement && <NavItem to="/settings/stores" icon={Settings} label="Store & Cameras" collapsed={collapsed} />}

        <SectionLabel label="" collapsed={collapsed} />
        <NavItem to="/notifications" icon={Bell} label="Notifications" badge={unreadCount} collapsed={collapsed} />
      </nav>

      {/* ── Logout ───────────────────────────────────── */}
      <div className="px-2 py-3 border-t border-gray-100">
        <button onClick={handleLogout}
          className={`sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600 ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
