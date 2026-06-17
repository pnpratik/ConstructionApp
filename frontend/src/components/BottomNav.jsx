import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Truck, Bell, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function BottomNav() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const items = [
    { to: '/',             icon: LayoutDashboard, label: 'Home' },
    { to: '/orders',       icon: ShoppingCart,    label: 'Orders' },
    { to: '/deliveries',   icon: Truck,           label: 'Delivery' },
    { to: '/notifications',icon: Bell,            label: 'Alerts',  badge: unreadCount },
    { to: '/projects',     icon: MoreHorizontal,  label: 'More' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 safe-area-pb">
      <div className="flex items-stretch h-16">
        {items.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 relative transition-all duration-200
               ${isActive ? 'text-blue-600' : 'text-gray-400'}`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-blue-600 rounded-full" />
                )}
                <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-50' : ''}`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  {badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
