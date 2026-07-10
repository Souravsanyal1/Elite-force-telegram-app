import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Share2, Users, Gift, Check, Lock, Unlock, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReferralProps {
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  setEfcBalance: React.Dispatch<React.SetStateAction<number>>;
  hasUnlockedWithdrawal: boolean;
  setHasUnlockedWithdrawal: (unlocked: boolean) => void;
  referralsCount: number;
  setReferralsCount: React.Dispatch<React.SetStateAction<number>>;
}

export const Referral: React.FC<ReferralProps> = ({ 
  showToast, 
  setEfcBalance, 
  hasUnlockedWithdrawal, 
  setHasUnlockedWithdrawal,
  referralsCount,
  setReferralsCount
}) => {
  const [copied, setCopied] = useState(false);
  const referralLink = "https://t.me/EliteForceBot?start=efc_r_sourav";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showToast("Referral link copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Elite Force (EForce)',
        text: 'Join Elite Force Web3 platform and mine EForce coins!',
        url: referralLink,
      }).catch(err => console.log(err));
    } else {
      handleCopy();
    }
  };

  const simulateNewReferral = () => {
    if (referralsCount >= 10) {
      showToast("Already reached the max milestone!", "info");
      return;
    }

    const nextCount = referralsCount + 1;
    setReferralsCount(nextCount);
    
    // Add point rewards for new referral
    setEfcBalance(bal => bal + 1000);
    showToast("New friend joined! Received +1000 EForce!", "success");

    if (nextCount === 10) {
      setHasUnlockedWithdrawal(true);
      showToast("Milestone achieved! EForce Withdrawal feature UNLOCKED!", "success");
      
      // Luxury confetti explosion
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      (function frame() {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#B388FF', '#00E5FF', '#FFD700']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#B388FF', '#00E5FF', '#FFD700']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      }());
    }
  };

  // SVG circular progress maths
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(referralsCount, 10) / 10) * circumference;

  return (
    <div className="flex flex-col gap-5 pb-28">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Affiliates</h1>
        <p className="text-xs text-slate-400 mt-1">Invite friends and unlock elite financial services.</p>
      </div>

      {/* Hero 3D Gift Box Card */}
      <div className="glass-panel p-6 rounded-[24px] border-white/6 relative overflow-hidden flex items-center justify-between">
        {/* Lights */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent-purple/10 rounded-full filter blur-xl"></div>

        <div className="flex-1 pr-4">
          <h2 className="text-base font-bold text-white flex items-center gap-1.5 mb-1.5">
            <Gift size={16} className="text-accent-purple" />
            Double Reward
          </h2>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Get <span className="text-accent-cyan font-semibold">1,000 EForce</span> for every registered user. Premium Telegram contacts grant you <span className="text-accent-purple font-semibold">5,000 EForce</span>.
          </p>
        </div>

        {/* 3D Gift Box SVG illustration */}
        <div className="relative shrink-0 w-24 h-24 flex items-center justify-center animate-float">
          <svg width="80" height="80" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4A1E96" />
                <stop offset="100%" stopColor="#8A46FF" />
              </linearGradient>
              <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00E5FF" />
                <stop offset="100%" stopColor="#00FF88" />
              </linearGradient>
            </defs>
            {/* Box Back reflection */}
            <circle cx="50" cy="50" r="35" fill="rgba(179,136,255,0.06)" />
            {/* Box Body */}
            <rect x="25" y="40" width="50" height="40" rx="8" fill="url(#boxGrad)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            {/* Lid */}
            <rect x="20" y="32" width="60" height="12" rx="4" fill="#B388FF" />
            {/* Vertical Ribbon */}
            <rect x="46" y="32" width="8" height="48" fill="url(#ribbonGrad)" />
            {/* Horizontal Ribbon */}
            <rect x="25" y="56" width="50" height="8" fill="url(#ribbonGrad)" />
            {/* Bow (Left Loop) */}
            <path d="M48 32 C38 20, 32 30, 48 32 Z" fill="url(#ribbonGrad)" />
            {/* Bow (Right Loop) */}
            <path d="M52 32 C62 20, 68 30, 52 32 Z" fill="url(#ribbonGrad)" />
            {/* Soft Glow core */}
            <circle cx="50" cy="32" r="6" fill="#00E5FF" opacity="0.5" filter="blur(2px)" />
          </svg>
        </div>
      </div>

      {/* Progress Ring Card */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Milestone Objective</span>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            Unlock Withdrawal Feature
          </h3>
          <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            {hasUnlockedWithdrawal ? (
              <span className="text-accent-success font-bold flex items-center gap-1">
                <Unlock size={12} /> Unlocked
              </span>
            ) : (
              <span className="text-accent-warning font-semibold flex items-center gap-1">
                <Lock size={12} /> Locked (Need 10 referrals)
              </span>
            )}
          </span>
        </div>

        {/* Neon Circular Ring */}
        <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
          <svg className="transform -rotate-90 w-full h-full">
            {/* Track */}
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-white/5 fill-none"
              strokeWidth="5"
            />
            {/* Fill */}
            <motion.circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-accent-purple fill-none drop-shadow-[0_0_6px_rgba(179,136,255,0.4)]"
              strokeWidth="5"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-black text-white">{referralsCount}</span>
            <span className="text-[8px] text-slate-500 font-bold uppercase">/ 10</span>
          </div>
        </div>
      </div>

      {/* Referral Link Manager */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-3">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Your Unique Invite Link</span>
        
        {/* Link Input area */}
        <div className="flex items-center gap-2 bg-[#12182D]/80 border border-white/8 rounded-[16px] p-2 pl-3.5 relative overflow-hidden">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="bg-transparent border-none outline-none text-xs text-slate-300 w-full select-all"
          />
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-white/5 border border-white/8 text-slate-300 hover:text-accent-cyan active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            {copied ? <Check size={14} className="text-accent-success" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Buttons: Invite Friends & Native Share */}
        <div className="grid grid-cols-2 gap-3 mt-1">
          <button
            onClick={handleShare}
            className="h-11 glass-btn rounded-[18px] text-xs font-bold text-white flex items-center justify-center gap-2"
          >
            <Share2 size={13} />
            <span>Share Link</span>
          </button>
          
          <button
            onClick={simulateNewReferral}
            className="h-11 rounded-[18px] bg-gradient-to-r from-accent-purple to-accent-blue text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(179,136,255,0.25)] hover:shadow-[0_0_25px_rgba(179,136,255,0.4)] active:scale-98 transition-all cursor-pointer"
          >
            <Users size={13} />
            <span>Simulate Invite</span>
          </button>
        </div>
      </div>

      {/* Referral leaderboard info */}
      <div className="glass-panel p-4 rounded-[20px] border-white/5 flex flex-col gap-2">
        <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <HelpCircle size={13} className="text-accent-cyan" />
          Milestone Rules & Rewards
        </h4>
        <ul className="text-[10px] text-slate-400 list-disc list-inside leading-relaxed flex flex-col gap-1">
          <li>10 registered affiliates required to unlock general cryptocurrency withdrawals.</li>
          <li>Top 100 referrers receive a share of the 1,000,000 EForce weekly bonus pool.</li>
          <li>Invites are verified using automated anti-bot Telegram checks.</li>
        </ul>
      </div>

    </div>
  );
};
