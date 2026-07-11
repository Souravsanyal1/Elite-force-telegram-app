import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Globe2, Laptop, ShieldCheck, CheckCircle, ShieldAlert, Save, Loader2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { getDisplayName, type TelegramUser } from '../lib/telegramUser';
import { type FirestoreUser, updateWalletAddress, submitWithdrawRequest } from '../lib/userService';
import { VerifiedBadge } from '../components/VerifiedBadge';

import { type AdminSettings } from '../lib/adminSettingsService';

interface ProfileProps {
  efcBalance: number;
  dbUser: FirestoreUser | null;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  telegramUser: TelegramUser | null;
  adminSettings: AdminSettings;
  setUsdtBalance: React.Dispatch<React.SetStateAction<number>>;
}

export const Profile = ({ efcBalance, dbUser, showToast, telegramUser, adminSettings, setUsdtBalance }: ProfileProps) => {
  const connectedAddress = dbUser?.walletAddress || null;
  
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [walletInput, setWalletInput] = useState(dbUser?.walletAddress || '');
  const [savingAddress, setSavingAddress] = useState(false);

  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('0.20');

  useEffect(() => {
    if (dbUser?.walletAddress) {
      setWalletInput(dbUser.walletAddress);
    }
  }, [dbUser]);

  const validateBep20 = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleSaveAddress = async () => {
    if (!telegramUser) return;
    if (!validateBep20(walletInput)) {
      showToast('Invalid BEP-20 address. Must start with 0x followed by 40 hex characters.', 'error');
      return;
    }
    setSavingAddress(true);
    const success = await updateWalletAddress(telegramUser.id, walletInput);
    setSavingAddress(false);
    if (success) {
      showToast('BEP-20 wallet address saved successfully!', 'success');
    } else {
      showToast('Failed to save wallet address.', 'error');
    }
  };

  const handleWithdrawClick = () => {
    if (!adminSettings.withdrawOpen) {
      showToast('USDT Withdrawals are currently closed by administrators.', 'error');
      return;
    }
    const minRefs = adminSettings.withdrawMinReferrals;
    const currentRefs = dbUser?.referrals || 0;
    
    if (currentRefs < minRefs) {
      setShowWarningModal(true);
      return;
    }

    if (!dbUser?.walletAddress) {
      showToast('Please save your BEP-20 wallet address first!', 'warning');
      return;
    }

    setShowWithdrawModal(true);
    setPin('');
    setIsVerifying(false);
    setIsSuccess(false);
  };

  const handlePinPress = (num: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + num;
    setPin(nextPin);

    if (nextPin.length === 4) {
      setIsVerifying(true);
      setTimeout(async () => {
        const amountNum = parseFloat(withdrawAmount);
        const minWithdraw = adminSettings.withdrawMinAmount;
        const usdtBalance = dbUser?.wallet || 0;

        if (isNaN(amountNum) || amountNum < minWithdraw) {
          setIsVerifying(false);
          setPin('');
          showToast(`Minimum withdrawal is $${minWithdraw} USDT.`, 'error');
          return;
        }

        if (usdtBalance < amountNum) {
          setIsVerifying(false);
          setPin('');
          showToast('Insufficient USDT balance.', 'error');
          return;
        }

        if (!telegramUser || !dbUser) {
          setIsVerifying(false);
          setPin('');
          showToast('User state not verified.', 'error');
          return;
        }

        const res = await submitWithdrawRequest(
          telegramUser.id,
          telegramUser.username || `user_${telegramUser.id}`,
          dbUser.walletAddress,
          amountNum
        );

        setIsVerifying(false);

        if (res.success) {
          setIsSuccess(true);
          setUsdtBalance(prev => Math.max(0, prev - amountNum));
          showToast(`Withdrawal request of $${amountNum} USDT submitted!`, 'success');
          
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00FF88', '#00E5FF', '#ffffff'],
          });

          setTimeout(() => {
            setShowWithdrawModal(false);
          }, 2200);
        } else {
          setPin('');
          showToast(res.reason || 'Failed to submit withdrawal.', 'error');
        }
      }, 1500);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return 'Not Available';
    try {
      const date = typeof ts.toDate === 'function' 
        ? ts.toDate() 
        : (ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts));
      
      if (isNaN(date.getTime())) return 'Not Available';
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return 'Not Available';
    }
  };

  const joinDateStr = formatTimestamp(dbUser?.joinDate || dbUser?.createdAt);
  
  const latestIp = dbUser?.ipHistory && dbUser.ipHistory.length > 0
    ? dbUser.ipHistory[dbUser.ipHistory.length - 1]
    : 'Unknown';

  const country = dbUser?.country && dbUser.country !== 'Unknown' ? dbUser.country : 'BD';
  const flag = country === 'BD' || country.toLowerCase().includes('bangladesh') ? '🇧🇩' : '🌍';

  const achievements = [
    { name: "First Mine", desc: "Mined EForce coin for the first time", completed: true, badgeColor: "text-accent-cyan" },
    { name: "Affiliate Recruit", desc: "Invited 5 active members to the force", completed: (dbUser?.referrals || 0) >= 5, badgeColor: (dbUser?.referrals || 0) >= 5 ? "text-accent-purple" : "text-slate-500" },
    { name: "Node Authorizer", desc: "Saved custody wallet destination address", completed: connectedAddress !== null, badgeColor: connectedAddress !== null ? "text-accent-gold" : "text-slate-500" },
    { name: "Grandmaster Miner", desc: "Accumulated more than 10,000 EForce", completed: efcBalance >= 10000, badgeColor: efcBalance >= 10000 ? "text-accent-gold" : "text-slate-500" },
  ];

  return (
    <div className="flex flex-col gap-5 pb-28">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Identity</h1>
        <p className="text-xs text-slate-400 mt-1">Review your node details, verification status, and achievements.</p>
      </div>

      {/* User Card */}
      <div className="glass-panel p-6 rounded-[24px] border-white/6 flex items-center gap-4 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent-purple/10 rounded-full filter blur-xl"></div>
        
        {/* Avatar with Telegram Premium Outer Ring */}
        <div className={`relative shrink-0 w-16 h-16 rounded-full p-[3px] drop-shadow-[0_0_10px_rgba(179,136,255,0.3)] ${telegramUser?.isPremium ? 'animate-pulse bg-gradient-to-tr from-accent-purple via-accent-cyan to-accent-gold' : 'bg-gradient-to-tr from-slate-600 to-slate-400'}`}>
          <div className="w-full h-full rounded-full bg-[#12182D] flex items-center justify-center text-white font-bold text-xl relative overflow-hidden">
            {telegramUser?.photoUrl ? (
              <img
                src={telegramUser.photoUrl}
                alt={getDisplayName(telegramUser)}
                className="w-full h-full object-cover rounded-full"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <span className="text-lg font-bold">
                {(telegramUser?.firstName?.[0] ?? 'E').toUpperCase()}{(telegramUser?.lastName?.[0] ?? 'F').toUpperCase()}
              </span>
            )}
          </div>
          {/* Country flag indicator */}
          <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#12182D] border border-white/10 flex items-center justify-center text-[10px]" title={country}>
            {flag}
          </div>
        </div>

        {/* User profile tags */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <h2 className="text-base font-bold text-white tracking-tight truncate">{getDisplayName(telegramUser)}</h2>
            <VerifiedBadge size={14} className="shrink-0" />
            {telegramUser?.isPremium && (
              <span className="text-[8px] font-black uppercase text-accent-gold flex items-center gap-0.5 bg-accent-gold/10 border border-accent-gold/15 px-1.5 py-0.5 rounded">
                👑 Premium
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
            Member #{telegramUser?.id || '?' }
          </span>
        </div>
      </div>

      {/* Wallet Connection Node */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">BEP-20 Connected Node</span>
          {connectedAddress ? (
            <span className="text-accent-success font-semibold flex items-center gap-1 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-ping"></span>
              Connected
            </span>
          ) : (
            <span className="text-slate-500 font-semibold flex items-center gap-1 text-[10px]">
              Disconnected
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter BEP-20 Address (0x...)"
            value={walletInput}
            onChange={(e) => setWalletInput(e.target.value)}
            disabled={savingAddress}
            className="flex-1 h-9 rounded-xl bg-white/[0.03] border border-white/8 px-3 text-xs text-white outline-none focus:border-accent-cyan/40 transition-all font-mono"
          />
          <button
            onClick={handleSaveAddress}
            disabled={savingAddress || !walletInput}
            className="h-9 px-3 rounded-xl bg-[#00E5FF] hover:bg-[#00E5FF]/90 disabled:opacity-40 disabled:cursor-not-allowed text-[#050816] text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-[0_0_12px_rgba(0,229,255,0.2)]"
          >
            {savingAddress ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <><Save size={12} /> Save</>
            )}
          </button>
        </div>
      </div>

      {/* Withdrawal Card */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-3.5" style={{ background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.03) 0%, rgba(0, 229, 255, 0.01) 100%)' }}>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Secure Withdrawal</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-400">Balance:</span>
            <span className="text-[9px] font-black text-accent-success">${(dbUser?.wallet || 0).toFixed(2)} USDT</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {adminSettings.withdrawOpen ? (
            <>
              <p className="text-[11px] text-slate-400 leading-relaxed font-normal">
                Withdraw your referral commissions and rewards to your connected BEP-20 wallet. Minimum withdrawal amount is <span className="text-accent-success font-bold">${adminSettings.withdrawMinAmount} USDT</span>. Requires <span className="text-accent-cyan font-bold">{adminSettings.withdrawMinReferrals} verified referrals</span>.
              </p>

              <div className="flex items-center gap-3">
                <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl px-3 py-1.5 flex flex-col">
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider">Referral Target</span>
                  <span className="text-xs font-bold text-white">{(dbUser?.referrals || 0)} / {adminSettings.withdrawMinReferrals}</span>
                </div>
                <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-xl px-3 py-1.5 flex flex-col">
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider">Withdrawable Balance</span>
                  <span className="text-xs font-bold text-accent-success">${(dbUser?.wallet || 0).toFixed(2)} USDT</span>
                </div>
              </div>

              <button
                onClick={handleWithdrawClick}
                className="h-10 rounded-xl bg-gradient-to-r from-accent-success to-accent-cyan text-[#050816] text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer shadow-[0_0_12px_rgba(0,255,136,0.2)]"
              >
                Withdraw USDT
              </button>
            </>
          ) : (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center flex flex-col gap-1.5">
              <Lock className="text-slate-500 mx-auto" size={16} />
              <span className="text-xs font-bold text-slate-400">Withdrawals Locked</span>
              <p className="text-[10px] text-slate-500">USDT withdrawals are temporarily locked by administrators.</p>
            </div>
          )}
        </div>
      </div>

      {/* Verification details info */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="glass-panel p-4 rounded-[20px] border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Calendar size={13} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Join Date</span>
          </div>
          <span className="text-xs font-semibold text-white">{joinDateStr}</span>
        </div>
        <div className="glass-panel p-4 rounded-[20px] border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Globe2 size={13} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Origin IP</span>
          </div>
          <span className="text-xs font-semibold text-white truncate">{latestIp}</span>
        </div>
      </div>

      {/* Device info node */}
      <div className="glass-panel p-4 rounded-[20px] border-white/5 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-slate-500 mb-1">
          <Laptop size={13} />
          <span className="text-[10px] uppercase font-bold tracking-wider">Authorized Device</span>
        </div>
        <span className="text-xs font-semibold text-white">
          {dbUser?.device?.os || 'Unknown OS'} • {dbUser?.device?.browser || 'Unknown Browser'}
        </span>
      </div>

      {/* Achievements / Trophies */}
      <div className="flex flex-col gap-3.5">
        <span className="text-xs font-bold text-accent-cyan tracking-wider uppercase">Trophies & Milestones</span>
        
        <div className="flex flex-col gap-2.5">
          {achievements.map((item, idx) => (
            <div key={idx} className="glass-panel p-4 rounded-[20px] border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl bg-white/5 border border-white/8 ${item.badgeColor} flex items-center justify-center shrink-0`}>
                  <Trophy size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{item.name}</h4>
                  <p className="text-[9px] text-slate-500 leading-normal">{item.desc}</p>
                </div>
              </div>
              <div>
                <span className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider rounded-md border ${
                  item.completed 
                    ? 'bg-accent-success/10 border-accent-success/20 text-accent-success' 
                    : 'bg-white/5 border-white/8 text-slate-500'
                }`}>
                  {item.completed ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Withdrawal Blocked Warning Modal */}
      <AnimatePresence>
        {showWarningModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-6 rounded-[28px] border-white/8 w-full max-w-[340px] text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            >
              <div className="w-12 h-12 rounded-full bg-accent-danger/15 border border-accent-danger/25 text-accent-danger flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(255,77,109,0.15)]">
                <ShieldAlert size={22} />
              </div>

              <h3 className="text-base font-bold text-white mb-2">Milestone Required</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-5">
                To prevent Sybil attacks and unlock cryptocurrency withdrawals, you must recruit at least <span className="text-accent-purple font-bold">{adminSettings.withdrawMinReferrals} verified affiliates</span>. Current valid count: {dbUser?.referrals || 0}.
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="h-10 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Return
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PIN Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="absolute inset-0 z-50 flex items-end bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full glass-panel border-t border-white/10 rounded-t-[28px] p-6 pb-8 shadow-[0_-15px_50px_rgba(0,0,0,0.5)] max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="text-accent-success" size={16} />
                  Authorize Withdrawal
                </h3>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 bg-white/5 rounded-lg border border-white/6 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="mb-4">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-1.5">Configure Amount</span>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 flex items-center bg-white/5 border border-white/7 rounded-xl p-2.5">
                    <input
                      type="text"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-transparent border-none outline-none text-sm font-bold text-white w-full"
                    />
                    <span className="text-xs font-bold text-accent-success shrink-0">USDT</span>
                  </div>
                  <div className="flex flex-col text-[10px] text-slate-500 leading-none gap-1 pr-1">
                    <span>Max: ${(dbUser?.wallet || 0).toFixed(2)}</span>
                    <span className="text-accent-cyan cursor-pointer" onClick={() => setWithdrawAmount((dbUser?.wallet || 0).toFixed(2))}>Set Max</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-6 my-2">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className={`absolute inset-0 rounded-full filter blur-xl opacity-30 transition-colors duration-500 ${
                    isSuccess ? 'bg-accent-success' : isVerifying ? 'bg-accent-cyan animate-pulse' : 'bg-accent-purple'
                  }`}></div>

                  <svg width="84" height="84" viewBox="0 0 100 100" className="relative z-10">
                    <rect x="15" y="15" width="70" height="70" rx="14" fill="#1E2230" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                    <rect x="23" y="23" width="54" height="54" rx="8" fill="#121522" stroke="rgba(255,255,255,0.05)" />
                    <circle cx="50" cy="50" r="18" fill="#1E2230" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    
                    <motion.g
                      animate={isVerifying ? { rotate: 360 } : isSuccess ? { rotate: 90 } : { rotate: 0 }}
                      transition={isVerifying ? { repeat: Infinity, duration: 1.5, ease: 'linear' } : { duration: 0.5 }}
                      style={{ originX: '50px', originY: '50px' }}
                    >
                      <circle cx="50" cy="50" r="10" fill="none" stroke="#00E5FF" strokeWidth="2.5" strokeDasharray="10 4" />
                      <line x1="50" y1="36" x2="50" y2="40" stroke="#00E5FF" strokeWidth="2.5" strokeLinecap="round" />
                    </motion.g>

                    <circle cx="30" cy="30" r="2" fill={isSuccess ? '#00FF88' : isVerifying ? '#00E5FF' : '#FF4D6D'} />
                  </svg>
                  
                  <AnimatePresence>
                    {isSuccess && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-0 z-20 flex items-center justify-center bg-bg-primary/40 rounded-full"
                      >
                        <CheckCircle size={44} className="text-accent-success drop-shadow-[0_0_12px_rgba(0,255,136,0.6)]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold tracking-wider">
                    {isSuccess ? 'Confirmed' : isVerifying ? 'Verifying Signature...' : 'Enter 4-Digit Secure PIN'}
                  </span>
                  
                  <div className="flex gap-4.5 my-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div 
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                          idx < pin.length 
                            ? isSuccess 
                              ? 'bg-accent-success border-accent-success shadow-[0_0_10px_rgba(0,255,136,0.5)]' 
                              : isVerifying 
                                ? 'bg-accent-cyan border-accent-cyan glow-cyan' 
                                : 'bg-accent-purple border-accent-purple'
                            : 'bg-white/5 border-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 w-full max-w-[280px]">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      onClick={() => handlePinPress(num)}
                      disabled={isVerifying || isSuccess}
                      className="h-11 rounded-xl bg-white/[0.03] border border-white/5 text-sm font-bold text-white hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setPin('')}
                    disabled={isVerifying || isSuccess}
                    className="h-11 rounded-xl text-xs font-bold text-accent-danger hover:bg-accent-danger/5 active:scale-95 transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                  
                  <button
                    onClick={() => handlePinPress('0')}
                    disabled={isVerifying || isSuccess}
                    className="h-11 rounded-xl bg-white/[0.03] border border-white/5 text-sm font-bold text-white hover:bg-white/[0.08] active:scale-95 transition-all cursor-pointer"
                  >
                    0
                  </button>
                  
                  <button
                    onClick={handleBackspace}
                    disabled={isVerifying || isSuccess}
                    className="h-11 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
