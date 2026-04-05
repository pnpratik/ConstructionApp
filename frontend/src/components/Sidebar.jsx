import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen, FileImage, Package, ShoppingCart,
  Users, Truck, Bell, BarChart3, Building2, ChevronDown,
  HardHat, Wrench, Zap, Layers, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const NavItem = ({ to, icon: Icon, label, badge }) => (
  <NavLink to={to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
    <Icon size={18} />
    <span className="flex-1">{label}</span>
    {badge > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{badge}</span>}
  </NavLink>
);

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout, isAdmin, canRequest } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleLabel = {
    chairperson: 'Chairperson', director: 'Director', builder: 'Builder',
    site_engineer: 'Site Engineer', civil_contractor: 'Civil Contractor',
    plumbing_contractor: 'Plumbing Contractor', color_contractor: 'Color Contractor',
    lift_contractor: 'Lift Contractor', electric_contractor: 'Electric Contractor',
    tile_contractor: 'Tile Contractor', acp_contractor: 'ACP Contractor',
    aluminium_contractor: 'Aluminium Contractor', door_lock_contractor: 'Door & Lock Contractor',
    vendor: 'Vendor', delivery_operator: 'Delivery Operator', admin: 'Admin'
  };

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-white border-r border-gray-100 flex flex-col h-full`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">ConstructApp</p>
              <p className="text-xs text-gray-400">Management System</p>
            </div>
          </div>
        )}
        {collapsed && <Building2 size={20} className="text-blue-600 mx-auto" />}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 ml-auto">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{roleLabel[user?.role] || user?.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
        <NavItem to="/projects" icon={FolderOpen} label="Projects" />

        {/* Drawings - only for non-vendor, non-delivery roles */}
        {!user?.role.includes('vendor') && !user?.role.includes('delivery') && (
          <>
            <NavItem to="/drawings" icon={FileImage} label="Drawings" />
            <NavItem to="/materials" icon={Package} label="Inventory" />
            <NavItem to="/materials/requirements" icon={Layers} label="Material Requirements" />
          </>
        )}

        {/* Orders */}
        <NavItem to="/orders" icon={ShoppingCart} label="Orders" />

        {/* Vendors */}
        {isAdmin() && <NavItem to="/vendors" icon={Truck} label="Vendors" />}

        {/* Contractors */}
        {isAdmin() && <NavItem to="/contractors" icon={HardHat} label="Contractors" />}

        {/* Deliveries */}
        <NavItem to="/deliveries" icon={Truck} label="Deliveries" />

        {/* Notifications */}
        <NavItem to="/notifications" icon={Bell} label="Notifications" badge={unreadCount} />

        {/* Reports */}
        {isAdmin() && <NavItem to="/reports" icon={BarChart3} label="Reports" />}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-100">
        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600">
          <LogOut size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
