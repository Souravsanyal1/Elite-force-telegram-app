import React from 'react';
import { Bell, Menu, RefreshCw } from 'lucide-react';
import type { AdminTab } from './AdminSidebar';

interface AdminHeaderProps {
  activeTab: AdminTab;
  onMenuClick: () => void;
  pendingCount: number;
  flaggedCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const tabTitles: Record<AdminTab, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: "Welcome back, Admin! Here's what's happening today." },
  users: { title: 'User Management', sub: 'View, edit, ban, and manage all registered users.' },
  tasks: { title: 'Tasks', sub: 'Create and manage EForce earning tasks.' },
  withdrawals: { title: 'Withdrawals', sub: 'Review and process withdrawal requests.' },
  security: { title: 'Security', sub: 'Monitor flagged users and suspicious activity.' },
  settings: { title: 'System Settings', sub: 'Configure global app economy and parameters.' },
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  activeTab, onMenuClick, pendingCount, flaggedCount, onRefresh, isRefreshing
}) => {
  const { title, sub } = tabTitles[activeTab];
  const notifCount = pendingCount + flaggedCount;

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3.5 border-b shrink-0"
      style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(10,14,24,0.8)', backdropFilter: 'blur(12px)' }}
    >
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-all"
        >
          <Menu size={15} />
        </button>
        <div>
          <h1 className="text-sm md:text-base font-black text-white tracking-tight">{title}</h1>
          <p className="text-[9px] text-slate-500 hidden md:block">{sub}</p>
        </div>
      </div>

      {/* Right: refresh + notifications + profile */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-accent-cyan transition-all"
        >
          <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
        </button>

        <div className="relative">
          <button className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Bell size={13} />
          </button>
          {notifCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF8A00] rounded-full text-[8px] font-black text-white flex items-center justify-center shadow-[0_0_8px_rgba(255,138,0,0.6)]">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 pl-2 border-l border-white/8">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FFB347] flex items-center justify-center text-[9px] font-black text-white shadow-[0_0_10px_rgba(255,138,0,0.3)]">
            A
          </div>
          <div className="hidden md:block">
            <div className="text-[10px] font-bold text-white leading-none">Admin</div>
            <div className="text-[8px] text-slate-500">Super Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
};
