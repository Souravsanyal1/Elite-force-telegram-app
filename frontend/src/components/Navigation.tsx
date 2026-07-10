import React from 'react';
import { motion } from 'framer-motion';
import { Home, CheckSquare, Gift, Wallet, User, Settings } from 'lucide-react';

export type ActiveTab = 'home' | 'tasks' | 'referral' | 'wallet' | 'profile' | 'settings' | 'admin';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isAdmin: boolean;
}

const tabs = [
  { id: 'home' as ActiveTab,    label: 'Home',    icon: Home },
  { id: 'tasks' as ActiveTab,   label: 'Tasks',   icon: CheckSquare },
  { id: 'referral' as ActiveTab,label: 'Invite',  icon: Gift },
  { id: 'wallet' as ActiveTab,  label: 'Wallet',  icon: Wallet },
  { id: 'profile' as ActiveTab, label: 'Profile', icon: User },
  { id: 'settings' as ActiveTab,label: 'More',    icon: Settings },
];

export const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="absolute bottom-4 left-3 right-3 z-40">
      {/* Pill Container */}
      <div
        className="relative flex items-center justify-around px-2 py-2 rounded-[28px] overflow-hidden"
        style={{
          background: 'rgba(10,13,28,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Subtle inner shimmer line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 cursor-pointer transition-all duration-200 group focus:outline-none"
              style={{ minWidth: 44 }}
            >
              {/* Active pill glow background */}
              {isActive && (
                <motion.div
                  layoutId="nav-active-pill"
                  className="absolute inset-0 rounded-[18px]"
                  style={{
                    background: 'rgba(255,138,0,0.12)',
                    border: '1px solid rgba(255,138,0,0.22)',
                    boxShadow: '0 0 18px rgba(255,138,0,0.15)',
                  }}
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}

              {/* Icon */}
              <motion.div
                animate={{
                  scale: isActive ? 1.18 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                className="relative z-10"
              >
                <Icon
                  size={19}
                  className={
                    isActive
                      ? 'text-[#FF8A00] drop-shadow-[0_0_8px_rgba(255,138,0,0.55)]'
                      : 'text-slate-500 group-hover:text-slate-300 transition-colors'
                  }
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
              </motion.div>

              {/* Label */}
              <span
                className={`relative z-10 text-[9px] font-semibold tracking-wide transition-all duration-200 ${
                  isActive ? 'text-[#FF8A00]' : 'text-slate-600 group-hover:text-slate-400'
                }`}
              >
                {tab.label}
              </span>

              {/* Active dot indicator */}
              {isActive && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#FF8A00] shadow-[0_0_6px_rgba(255,138,0,0.8)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
