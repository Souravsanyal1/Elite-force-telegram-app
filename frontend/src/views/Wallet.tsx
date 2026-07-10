import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck, Lock, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WalletProps {
  efcBalance: number;
  setEfcBalance: React.Dispatch<React.SetStateAction<number>>;
  usdtBalance: number;
  setUsdtBalance: React.Dispatch<React.SetStateAction<number>>;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  hasUnlockedWithdrawal: boolean;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'reward';
  amount: string;
  asset: 'EForce' | 'USDT';
  status: 'completed' | 'pending';
  date: string;
}

export const Wallet: React.FC<WalletProps> = ({
  efcBalance,
  setEfcBalance,
  usdtBalance,
  setUsdtBalance,
  showToast,
  hasUnlockedWithdrawal,
}) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('10.0');

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', type: 'reward', amount: '250', asset: 'EForce', status: 'completed', date: 'Today, 14:23' },
    { id: '2', type: 'reward', amount: '1,000', asset: 'EForce', status: 'completed', date: 'Yesterday, 18:05' },
    { id: '3', type: 'deposit', amount: '25.0', asset: 'USDT', status: 'completed', date: '08 Jul, 11:40' },
    { id: '4', type: 'reward', amount: '5,000', asset: 'EForce', status: 'completed', date: '05 Jul, 09:12' },
  ]);

  const handleWithdrawClick = () => {
    if (!hasUnlockedWithdrawal) {
      setShowWarningModal(true);
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

    // Auto-submit when length reaches 4
    if (nextPin.length === 4) {
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        setIsSuccess(true);
        setUsdtBalance(prev => prev - parseFloat(withdrawAmount));
        setEfcBalance(prev => prev - (parseFloat(withdrawAmount) * 600)); // convert EForce
        
        // Add transaction
        setTransactions(prev => [
          {
            id: Date.now().toString(),
            type: 'withdraw',
            amount: withdrawAmount,
            asset: 'USDT',
            status: 'completed',
            date: 'Just Now',
          },
          ...prev,
        ]);

        showToast(`Withdrawal of $${withdrawAmount} USDT successful!`, 'success');

        // Confetti explosion
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00FF88', '#00E5FF', '#ffffff'],
        });

        // Close modal after success display
        setTimeout(() => {
          setShowWithdrawModal(false);
        }, 2200);

      }, 2000);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="flex flex-col gap-5 pb-28">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Cryptoport</h1>
        <p className="text-xs text-slate-400 mt-1">Manage deposits, pending assets, and luxury withdrawals.</p>
      </div>

      {/* Hero Wallet Card */}
      <div className="glass-panel p-6 rounded-[24px] border-white/6 relative overflow-hidden flex flex-col justify-between shadow-[0_20px_50px_rgba(0,229,255,0.04)]">
        {/* Lights */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/5 rounded-full filter blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-purple/5 rounded-full filter blur-xl"></div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-slate-300">
              <WalletIcon size={16} />
            </div>
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Elite Web3 Custody</span>
          </div>
          <span className="text-[9px] font-black text-accent-cyan tracking-widest uppercase bg-accent-cyan/10 px-2 py-1 rounded border border-accent-cyan/20">
            Secure Node
          </span>
        </div>

        <div className="flex flex-col gap-1 mb-6">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">Total USDT Assets</span>
          <span className="text-3xl font-extrabold tracking-tight text-white font-display">
            ${usdtBalance.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
          <div>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-semibold mb-0.5">EForce Balance</span>
            <span className="text-sm font-extrabold text-white font-display">{efcBalance.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-semibold mb-0.5">Pending Claim</span>
            <span className="text-sm font-semibold text-accent-purple flex items-center gap-1 font-display">
              <Clock size={11} /> 1,250 EForce
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => showToast('USDT Deposit address: 0x8a9C...92Fb (TON network)', 'info')}
          className="h-12 glass-btn rounded-[18px] text-xs font-bold text-white flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(0,0,0,0.15)]"
        >
          <ArrowDownLeft size={14} className="text-accent-cyan" />
          <span>Deposit Crypto</span>
        </button>

        <button
          onClick={handleWithdrawClick}
          className={`h-12 rounded-[18px] font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            hasUnlockedWithdrawal
              ? 'bg-gradient-to-r from-accent-cyan to-accent-blue text-white shadow-[0_0_20px_rgba(0,229,255,0.2)] hover:shadow-[0_0_25px_rgba(0,229,255,0.35)] cursor-pointer'
              : 'bg-white/5 border border-white/8 text-slate-500 hover:text-slate-400 active:scale-98 cursor-pointer'
          }`}
        >
          {hasUnlockedWithdrawal ? (
            <>
              <ArrowUpRight size={14} className="text-white" />
              <span>Withdraw Fund</span>
            </>
          ) : (
            <>
              <Lock size={13} className="text-slate-500" />
              <span>Withdraw (Locked)</span>
            </>
          )}
        </button>
      </div>

      {/* Transaction History */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-bold text-accent-cyan tracking-wider uppercase">Ledger History</span>
        
        <div className="flex flex-col gap-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="glass-panel p-4 rounded-[20px] border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border flex items-center justify-center ${
                  tx.type === 'deposit' 
                    ? 'bg-accent-success/10 border-accent-success/20 text-accent-success' 
                    : tx.type === 'withdraw'
                      ? 'bg-accent-danger/10 border-accent-danger/20 text-accent-danger'
                      : 'bg-accent-purple/10 border-accent-purple/20 text-accent-purple'
                }`}>
                  {tx.type === 'deposit' && <ArrowDownLeft size={15} />}
                  {tx.type === 'withdraw' && <ArrowUpRight size={15} />}
                  {tx.type === 'reward' && <Sparkles size={15} />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white capitalize">{tx.type} Asset</h4>
                  <span className="text-[10px] text-slate-500">{tx.date}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-xs font-extrabold font-display ${
                  tx.type === 'deposit' || tx.type === 'reward' ? 'text-accent-success' : 'text-accent-danger'
                }`}>
                  {tx.type === 'deposit' || tx.type === 'reward' ? '+' : '-'}{tx.amount} {tx.asset}
                </span>
                <span className="text-[9px] text-slate-500 block">Verified</span>
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
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="glass-panel p-6 rounded-[28px] border-white/8 w-full max-w-[340px] text-center shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            >
              <div className="w-12 h-12 rounded-full bg-accent-danger/15 border border-accent-danger/25 text-accent-danger flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(255,77,109,0.15)] animate-bounce">
                <ShieldAlert size={22} />
              </div>

              <h3 className="text-base font-bold text-white mb-2">Milestone Required</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-5">
                To prevent Sybil attacks and unlock general cryptocurrency withdrawals, you must recruit at least <span className="text-accent-purple font-bold">10 affiliates</span> to EForce.
              </p>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="h-10 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Return to Affiliates
                </button>
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="h-10 glass-btn rounded-xl text-slate-400 text-xs font-semibold hover:text-white cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Luxury PIN Withdrawal Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <div className="absolute inset-0 z-50 flex items-end bg-black/65 backdrop-blur-md">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-full glass-panel border-t border-white/10 rounded-t-[28px] p-6 pb-8 shadow-[0_-15px_50px_rgba(0,0,0,0.5)] max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              {/* Header */}
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

              {/* Amount Settings */}
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
                    <span className="text-xs font-bold text-accent-usdt shrink-0">USDT</span>
                  </div>
                  <div className="flex flex-col text-[10px] text-slate-500 leading-none gap-1 pr-1">
                    <span>Max: ${usdtBalance.toFixed(1)}</span>
                    <span className="text-accent-cyan cursor-pointer" onClick={() => setWithdrawAmount(usdtBalance.toFixed(1))}>Set Max</span>
                  </div>
                </div>
              </div>

              {/* Safe & PIN Verification UI */}
              <div className="flex flex-col items-center gap-6 my-2">
                {/* 3D Safe Vault Box Animation */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  {/* Outer circle glow */}
                  <div className={`absolute inset-0 rounded-full filter blur-xl opacity-30 transition-colors duration-500 ${
                    isSuccess ? 'bg-accent-success' : isVerifying ? 'bg-accent-cyan animate-pulse' : 'bg-accent-purple'
                  }`}></div>

                  <svg width="84" height="84" viewBox="0 0 100 100" className="relative z-10">
                    <defs>
                      <linearGradient id="safeMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#43495F" />
                        <stop offset="50%" stopColor="#1E2230" />
                        <stop offset="100%" stopColor="#0B0D14" />
                      </linearGradient>
                      <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00E5FF" />
                        <stop offset="100%" stopColor="#4D8CFF" />
                      </linearGradient>
                    </defs>
                    {/* Safe body */}
                    <rect x="15" y="15" width="70" height="70" rx="14" fill="url(#safeMetal)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                    {/* Inner door */}
                    <rect x="23" y="23" width="54" height="54" rx="8" fill="#121522" stroke="rgba(255,255,255,0.05)" />
                    {/* Safe Lock Dial */}
                    <circle cx="50" cy="50" r="18" fill="url(#safeMetal)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    
                    {/* Spinning dial indicator */}
                    <motion.g
                      animate={isVerifying ? { rotate: 360 } : isSuccess ? { rotate: 90 } : { rotate: 0 }}
                      transition={isVerifying ? { repeat: Infinity, duration: 1.5, ease: 'linear' } : { duration: 0.5 }}
                      style={{ originX: '50px', originY: '50px' }}
                    >
                      <circle cx="50" cy="50" r="10" fill="none" stroke="url(#accentGlow)" strokeWidth="2.5" strokeDasharray="10 4" />
                      <line x1="50" y1="36" x2="50" y2="40" stroke="#00E5FF" strokeWidth="2.5" strokeLinecap="round" />
                    </motion.g>

                    {/* Small vault lights */}
                    <circle cx="30" cy="30" r="2" fill={isSuccess ? '#00FF88' : isVerifying ? '#00E5FF' : '#FF4D6D'} className="shadow-lg" />
                  </svg>
                  
                  {/* Verification Overlays */}
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

                {/* PIN Code Dots indicator */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold tracking-wider">
                    {isSuccess ? 'Withdrawal Confirmed' : isVerifying ? 'Verifying Node Signature...' : 'Enter 4-Digit Secure PIN'}
                  </span>
                  
                  <div className="flex gap-4.5 my-2">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div 
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                          idx < pin.length 
                            ? isSuccess 
                              ? 'bg-accent-success border-accent-success glow-green shadow-[0_0_10px_rgba(0,255,136,0.5)]' 
                              : isVerifying 
                                ? 'bg-accent-cyan border-accent-cyan glow-cyan' 
                                : 'bg-accent-purple border-accent-purple'
                            : 'bg-white/5 border-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* PIN Numeric Pad */}
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
