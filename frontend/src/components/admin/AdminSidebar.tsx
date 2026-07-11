import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, CheckSquare, DollarSign, Shield,
  Settings, ChevronRight, Zap, ExternalLink, X
} from 'lucide-react';

export type AdminTab = 'dashboard' | 'users' | 'tasks' | 'withdrawals' | 'security' | 'settings';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  isOpen: boolean;
  onClose: () => void;
  eforceTokenValue?: number;
}

const navItems: { id: AdminTab; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { id: 'users', label: 'Users', icon: <Users size={16} /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare size={16} /> },
  { id: 'withdrawals', label: 'Withdrawals', icon: <DollarSign size={16} /> },
  { id: 'security', label: 'Security', icon: <Shield size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab, setActiveTab, isOpen, onClose, eforceTokenValue = 0.05
}) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full z-50 flex flex-col
        w-[220px] transition-transform duration-300
        lg:relative lg:translate-x-0 lg:z-auto
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
        style={{
          background: 'linear-gradient(180deg, #0D1117 0%, #0A0E18 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF8A00] to-[#FFB347] flex items-center justify-center shadow-[0_0_16px_rgba(255,138,0,0.4)]">
              <Zap size={16} className="text-white fill-current" />
            </div>
            <div>
              <span className="text-xs font-black text-white tracking-tight block leading-none">ELITE FORCE</span>
              <span className="text-[8px] text-slate-500 uppercase tracking-widest">Admin Panel</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => { setActiveTab(item.id); onClose(); }}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.97 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,138,0,0.18) 0%, rgba(255,138,0,0.06) 100%)',
                      border: '1px solid rgba(255,138,0,0.25)',
                    }}
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 ${isActive ? 'text-[#FF8A00]' : ''}`}>{item.icon}</span>
                <span className="relative z-10 flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight size={12} className="relative z-10 text-[#FF8A00] opacity-70" />}
              </motion.button>
            );
          })}
        </nav>

        {/* Bottom: EForce Token value */}
        <div className="mx-3 mb-4 p-3 rounded-xl shrink-0" style={{ background: 'rgba(255,138,0,0.06)', border: '1px solid rgba(255,138,0,0.15)' }}>
          <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold mb-2">ELITE FORCE TOKEN</span>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF8A00] to-[#FFB347] flex items-center justify-center shadow-[0_0_10px_rgba(255,138,0,0.35)] text-[10px] font-black text-white shrink-0">
              EF
            </div>
            <div>
              <div className="text-[10px] text-white font-bold">EForce (EF)</div>
              <div className="text-[10px] text-[#FF8A00] font-black">${eforceTokenValue.toFixed(4)}</div>
            </div>
          </div>
        </div>

        {/* View Website */}
        <div className="px-3 pb-4 shrink-0">
          <a
            href="https://mini-telegram-app-c0fb4.web.app"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] text-slate-400 hover:text-white bg-white/3 border border-white/6 hover:bg-white/8 transition-all"
          >
            <ExternalLink size={11} />
            View Mini App
          </a>
        </div>
      </aside>
    </>
  );
};
