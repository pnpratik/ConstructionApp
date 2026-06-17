import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, ShoppingCart, CheckCircle, XCircle,
  Truck, PackageCheck, AlertCircle, Info,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

// Per-type config: icon, border color, icon bg, icon color
const TYPE_CONFIG = {
  order_approved:   { Icon: CheckCircle,  border: 'border-l-green-500',  iconBg: 'bg-green-100',  iconColor: 'text-green-600',  badge: 'bg-green-100 text-green-700' },
  order_rejected:   { Icon: XCircle,      border: 'border-l-red-500',    iconBg: 'bg-red-100',    iconColor: 'text-red-600',    badge: 'bg-red-100 text-red-700' },
  order_dispatched: { Icon: Truck,        border: 'border-l-purple-500', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', badge: 'bg-purple-100 text-purple-700' },
  order_delivered:  { Icon: PackageCheck, border: 'border-l-blue-500',   iconBg: 'bg-blue-100',   iconColor: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700' },
  order_created:    { Icon: ShoppingCart, border: 'border-l-yellow-400', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600', badge: 'bg-yellow-100 text-yellow-700' },
  default:          { Icon: Info,         border: 'border-l-gray-300',   iconBg: 'bg-gray-100',   iconColor: 'text-gray-500',   badge: 'bg-gray-100 text-gray-600' },
};

export default function NotificationList() {
  const { notifications, markRead, markAllRead, fetchNotifications } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchNotifications(); }, []);

  const timeAgo = (date) => {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handleClick = async (notif) => {
    await markRead(notif._id);
    if (notif.link) navigate(notif.link);
  };

  const unreadCount = notifications.filter(n => !n.readBy?.includes(user?._id)).length;

  return (
    <div className="space-y-4 md:space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-sm text-gray-500">
            {notifications.length} total
            {unreadCount > 0 && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">{unreadCount} unread</span>}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm">
            <CheckCheck size={15} /> Mark All Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-16">
          <Bell size={48} className="text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">You're all caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No notifications yet</p>
        </div>
      ) : (
        /* Timeline list */
        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-100 hidden sm:block" />

          <div className="space-y-2">
            {notifications.map(notif => {
              const isRead = notif.readBy?.includes(user?._id);
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.default;
              const { Icon } = cfg;

              return (
                <div
                  key={notif._id}
                  onClick={() => handleClick(notif)}
                  className={`
                    relative flex gap-3 sm:gap-4 p-3 md:p-4 rounded-xl border-l-4 border border-gray-100
                    cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5
                    ${cfg.border}
                    ${!isRead ? 'bg-white shadow-sm' : 'bg-gray-50/60 opacity-75'}
                  `}
                >
                  {/* Icon circle — offset to sit on timeline */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${cfg.iconBg}`}>
                    <Icon size={16} className={cfg.iconColor} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`badge text-xs font-medium ${cfg.badge}`}>
                        {notif.type?.replace(/_/g, ' ')}
                      </span>
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" title="Unread" />
                      )}
                      <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{timeAgo(notif.createdAt)}</span>
                    </div>

                    <p className={`text-sm font-semibold ${isRead ? 'text-gray-600' : 'text-gray-800'}`}>
                      {notif.title}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{notif.message}</p>

                    {notif.relatedOrder && (
                      <p className="text-xs text-blue-600 font-medium mt-1">
                        Order: {notif.relatedOrder?.orderNumber}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
