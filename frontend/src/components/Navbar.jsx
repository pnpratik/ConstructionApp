import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, X, Check, Menu, Building2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const TYPE_COLORS = {
  order_approved:   'bg-emerald-100 text-emerald-700',
  order_rejected:   'bg-red-100 text-red-600',
  order_dispatched: 'bg-purple-100 text-purple-700',
  order_delivered:  'bg-blue-100 text-blue-700',
  order_created:    'bg-amber-100 text-amber-700',
  material_low_stock: 'bg-orange-100 text-orange-700',
  default:          'bg-gray-100 text-gray-600',
};

const ROLE_LABELS = {
  director: 'Director', chairperson: 'Chairperson', builder: 'Builder',
  site_engineer: 'Site Engineer', vendor: 'Vendor',
  delivery_operator: 'Delivery Operator', admin: 'Admin',
};

function timeAgo(date) {
  const diff = Date.now() - new Date(date);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = async (notif) => {
    await markRead(notif._id);
    setShowNotifs(false);
    if (notif.link) navigate(notif.link);
  };

  const roleLabel = ROLE_LABELS[user?.role] || user?.role?.replace(/_/g, ' ') || '';

  return (
    <header className="bg-white border-b border-gray-100 px-4 md:px-6 h-14 flex items-center justify-between flex-shrink-0 z-20">

      {/* Left: hamburger + brand */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Mobile brand name */}
        <div className="md:hidden flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 size={14} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-sm">Nirmaan</span>
        </div>

        {/* Desktop page context — just spacer */}
        <div className="hidden md:block" />
      </div>

      {/* Right: notifications + avatar */}
      <div className="flex items-center gap-2 md:gap-3">

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-all"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center leading-none px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-[90vw] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-slide-up">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{unreadCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {notifications.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Bell size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-medium">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 12).map(notif => {
                    const isUnread = !notif.readBy?.includes(user?._id);
                    const colorClass = TYPE_COLORS[notif.type] || TYPE_COLORS.default;
                    return (
                      <button key={notif._id} onClick={() => handleNotifClick(notif)}
                        className={`w-full text-left px-4 py-3 hover:bg-blue-50/30 transition-colors ${isUnread ? 'bg-blue-50/40' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${colorClass}`}>
                            {(notif.type || 'general').replace(/_/g, ' ').toUpperCase()}
                          </span>
                          {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />}
                          <span className="text-[11px] text-gray-400 ml-auto">{timeAgo(notif.createdAt)}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 leading-snug">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                <Link to="/notifications" onClick={() => setShowNotifs(false)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="hidden md:block leading-none">
            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-400 capitalize mt-0.5">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
