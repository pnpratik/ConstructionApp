import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const TYPE_STYLE = {
  order_approved: 'border-green-200 bg-green-50', order_rejected: 'border-red-200 bg-red-50',
  order_dispatched: 'border-purple-200 bg-purple-50', order_delivered: 'border-blue-200 bg-blue-50',
  order_created: 'border-yellow-200 bg-yellow-50', default: 'border-gray-100 bg-white'
};
const TYPE_BADGE = {
  order_approved: 'bg-green-100 text-green-700', order_rejected: 'bg-red-100 text-red-700',
  order_dispatched: 'bg-purple-100 text-purple-700', order_delivered: 'bg-blue-100 text-blue-700',
  order_created: 'bg-yellow-100 text-yellow-700', default: 'bg-gray-100 text-gray-600'
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
    if (mins < 60) return `${mins} minutes ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hours ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  const handleClick = async (notif) => {
    await markRead(notif._id);
    if (notif.link) navigate(notif.link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-800">Notifications</h1><p className="text-gray-500">{notifications.length} total</p></div>
        <button onClick={markAllRead} className="btn-secondary"><CheckCheck size={16} />Mark All Read</button>
      </div>

      {notifications.length === 0 ? (
        <div className="card text-center py-16">
          <Bell size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(notif => {
            const isRead = notif.readBy?.includes(user?._id);
            const style = TYPE_STYLE[notif.type] || TYPE_STYLE.default;
            const badge = TYPE_BADGE[notif.type] || TYPE_BADGE.default;
            return (
              <div key={notif._id} onClick={() => handleClick(notif)}
                className={`card border cursor-pointer hover:shadow-md transition-all ${style} ${!isRead ? 'shadow-sm' : 'opacity-70'}`}>
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${badge}`}>{notif.type?.replace(/_/g, ' ').toUpperCase()}</span>
                      {!isRead && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                    </div>
                    <p className="font-semibold text-gray-800">{notif.title}</p>
                    <p className="text-gray-600 text-sm mt-1">{notif.message}</p>
                    <p className="text-gray-400 text-xs mt-2">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {notif.relatedOrder && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Order</p>
                      <p className="text-sm font-medium text-blue-600">{notif.relatedOrder?.orderNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
