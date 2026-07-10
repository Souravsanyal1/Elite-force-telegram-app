import React from 'react';
import { motion } from 'framer-motion';
import { Home, CheckSquare, Gift, Wallet, User, Shield, BarChart2 } from 'lucide-react';

export type ActiveTab = 'home' | 'tasks' | 'referral' | 'wallet' | 'profile' | 'settings' | 'admin';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdmin: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab, isAdmin }) => {
  const tabs = [
    { id: 'home' as ActiveTab, label: 'Home', icon: Home },
    { id: 'tasks' as ActiveTab, label: 'Tasks', icon: CheckSquare },
    { id: 'referral' as ActiveTab, label: 'Invite', icon: Gift },
    { id: 'wallet' as ActiveTab, label: 'Wallet', icon: Wallet },
    { id: 'profile' as ActiveTab, label: 'Profile', icon: User },
  ];

  return (
    <div className="absolute bottom-6 left-4 right-4 z-40">
      <div className="glass-panel px-3 py-2.5 rounded-[22px] flex items-center justify-around relative shadow-[0_15px_40px_rgba(0,0,0,0.4)] border-white/7">
        
        {/* Helper icons on top right/left of nav if needed, but keeping it inside for simplicity */}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative py-2 px-3.5 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group"
            >
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className="absolute inset-0 rounded-[16px] bg-white/[0.06] border border-white/[0.09] shadow-[0_0_20px_rgba(0,229,255,0.06)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              <motion.div
                animate={{
                  scale: isActive ? 1.15 : 1,
                  y: isActive ? -2 : 0,
                }}
                className={`relative z-10 ${isActive ? 'text-accent-cyan' : 'text-slate-400 group-hover:text-slate-200'} transition-colors duration-200`}
              >
                <Icon size={20} className={isActive ? 'drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]' : ''} />
              </motion.div>

              <span className={`text-[10px] mt-1 font-medium relative z-10 tracking-wide transition-all ${
                isActive ? 'text-white scale-105 font-semibold' : 'text-slate-500 scale-100 group-hover:text-slate-400'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Small admin and settings shortcuts at the far right/left in a clean manner */}
        <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-xl transition-all ${
              activeTab === 'settings' 
                ? 'bg-white/[0.06] border border-white/[0.09] text-accent-cyan' 
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Settings"
          >
            <Shield size={16} />
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`p-2 rounded-xl transition-all ${
                activeTab === 'admin' 
                  ? 'bg-white/[0.06] border border-white/[0.09] text-accent-cyan' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Admin Panel"
            >
              <BarChart2 size={16} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
