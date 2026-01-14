
import React, { useState, useRef, useEffect } from 'react';
import { User, UserRole, Notification } from '../types';
import { LogOut, User as UserIcon, Bell, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  notifications: Notification[];
  onMarkRead: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, notifications, onMarkRead }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const myNotifications = notifications.filter(n => n.toUserId === user.id || n.toRole === user.role);
  const unreadCount = myNotifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'ALERT': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-slate-900 rounded-xl shadow-lg">
            <img 
              src="https://raw.githubusercontent.com/fonserbc/demo-assets/main/ep-logo.png" 
              alt="EP Logo" 
              className="w-7 h-7 object-contain invert"
              onError={(e) => {
                // Fallback text if logo fails
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = '<span class="text-white font-black text-xl">EP</span>';
              }}
            />
          </div>
          <span className="font-black text-xl tracking-tighter text-slate-900 uppercase">
            Sales<span className="text-blue-600">Flow</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Notifications Bell */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) onMarkRead();
              }}
              className={`p-2 rounded-xl transition-all relative ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-slate-400" /></button>
                </div>
                <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50">
                  {myNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-10 h-10 text-slate-100 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-400">No notifications yet</p>
                    </div>
                  ) : (
                    myNotifications.map(notif => (
                      <div key={notif.id} className={`p-4 flex gap-3 transition-colors ${notif.isRead ? 'opacity-60' : 'bg-blue-50/30'}`}>
                        <div className="mt-0.5">{getNotifIcon(notif.type)}</div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-800 leading-tight">{notif.title}</p>
                          <p className="text-[11px] text-slate-500 leading-normal">{notif.message}</p>
                          <p className="text-[9px] font-bold text-slate-300 uppercase mt-1">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {myNotifications.length > 0 && (
                  <div className="p-3 bg-slate-50 text-center">
                    <button onClick={onMarkRead} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700">Clear All Alerts</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          <div className="hidden sm:flex flex-col items-end mr-2">
            <span className="text-sm font-semibold text-slate-700">{user.name}</span>
            <span className="text-xs text-slate-500 uppercase font-medium">{user.role}</span>
          </div>
          <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
            <UserIcon className="w-5 h-5 text-slate-600" />
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
