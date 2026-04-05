import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Search, X, Check } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';

const notifTypeColor = {
  order_approved: 'text-green-600 bg-green-50',
  order_rejected: 'text-red-600 bg-red-50',
  order_dispatched: 'text-purple-600 bg-purple-50',
  order_delivered: 'text-blue-600 bg-blue-50',
  order_created: 'text-orange-600 bg-orange-50',
  default: 'text-gray-600 bg-gray-50'
};

export default function Navbar() {
  const { user } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = async (notif) => {
    await markRead(notif._id);
    setShowNotifs(false);
    if (notif.link) navigate(notif.link);
  };

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-gray-800">Construction Management System</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <Check size={12} /> Mark all read
                    </button>
                  )}
                  <button onClick={() => setShowNotifs(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Bell size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map(notif => {
                    const isRead = notif.readBy?.includes(user?._id);
                    const colorClass = notifTypeColor[notif.type] || notifTypeColor.default;
                    return (
                      <button
                        key={notif._id}
                        onClick={() => handleNotifClick(notif)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition-colors ${!isRead ? 'bg-blue-50/40' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
                            {notif.type?.replace(/_/g, ' ').toUpperCase()}
                          </span>
                          {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0"></span>}
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-1">{notif.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                      </button>
                    );
                  })
                )}
              </div>
              <div className="px-4 py-2 border-t border-gray-100">
                <Link to="/notifications" onClick={() => setShowNotifs(false)} className="text-sm text-blue-600 hover:underline">
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-800 leading-none">{user?.name}</p>
            <p className="text-xs text-gray-400">{user?.role?.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
