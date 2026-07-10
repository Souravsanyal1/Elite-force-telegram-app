import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Flame, ChevronRight, Zap, X, Bolt } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getShortName, getDisplayName, type TelegramUser } from '../lib/telegramUser';
import { recordTap } from '../lib/antiCheat';
import { getLeaderboardUsers, type FirestoreUser } from '../lib/userService';

interface HomeProps {
  efcBalance: number;
  setEfcBalance: React.Dispatch<React.SetStateAction<number>>;
  usdtBalance: number;
  energy: number;
  setEnergy: React.Dispatch<React.SetStateAction<number>>;
  maxEnergy: number;
  referralsCount: number;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  telegramUser: TelegramUser | null;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  value: number;
}

export const Home: React.FC<HomeProps> = ({ 
  efcBalance, 
  setEfcBalance, 
  usdtBalance, 
  energy, 
  setEnergy, 
  maxEnergy,
  referralsCount,
  showToast,
  telegramUser
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [clicks, setClicks] = useState<FloatingText[]>([]);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(4); // 4 days streak

  // Combo system
  const [combo, setCombo] = useState(0);
  const [lastTapTime, setLastTapTime] = useState(0);

  // Auto-tap booster state
  const [autoTapActive, setAutoTapActive] = useState(false);

  // Leaderboard Modal State
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'tap' | 'referral'>('tap');
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<'today' | 'weekly' | 'monthly' | 'alltime'>('weekly');

  // Auto Tap logic (+5 points per second when active)
  useEffect(() => {
    if (!autoTapActive) return;
    const interval = setInterval(() => {
      setEfcBalance(prev => prev + 5);
    }, 1000);
    return () => clearInterval(interval);
  }, [autoTapActive, setEfcBalance]);

  // Firestore Leaderboard State
  const [dbUsers, setDbUsers] = useState<FirestoreUser[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const topUsers = await getLeaderboardUsers(15);
      setDbUsers(topUsers);
    };
    fetchLeaderboard();
  }, [efcBalance]); // re-fetch when local points change to keep it real-time


  // Click handler with anti-cheat
  const handleCoinClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (energy <= 0) {
      showToast('No energy remaining! Wait for regeneration or use a Boost.', 'warning');
      return;
    }

    const now = Date.now();
    let nextCombo = 1;
    if (now - lastTapTime < 800) {
      nextCombo = combo + 1;
    }
    setCombo(nextCombo);
    setLastTapTime(now);

    // Multiplier threshold
    let tapMultiplier = 1;
    if (nextCombo > 25) tapMultiplier = 5;
    else if (nextCombo > 10) tapMultiplier = 2;

    // Anti-cheat check
    const { allowed, riskLevel, reason } = recordTap(tapMultiplier);
    if (!allowed) {
      showToast(reason ?? 'Slow down! Anti-cheat triggered.', 'warning');
      return;
    }
    if (riskLevel === 'high') {
      showToast('⚠️ High tap rate detected. Your account is flagged for review.', 'error');
    }

    setIsSpinning(true);
    setEfcBalance(prev => prev + tapMultiplier);
    setEnergy(prev => Math.max(prev - 1, 0));

    // Get click coords relative to the coin card
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickId = Date.now();
    setClicks(prev => [...prev, { id: clickId, x, y, value: tapMultiplier }]);

    setTimeout(() => {
      setIsSpinning(false);
    }, 400);

    // Remove click after animation
    setTimeout(() => {
      setClicks(prev => prev.filter(c => c.id !== clickId));
    }, 1000);
  };

  const claimDailyReward = () => {
    if (dailyClaimed) {
      showToast('Daily reward already claimed today!', 'warning');
      return;
    }

    const reward = 250;
    setEfcBalance(prev => prev + reward);
    setDailyClaimed(true);
    setDailyStreak(prev => prev + 1);
    showToast(`Claimed daily check-in: +${reward} EForce!`, 'success');

    // Trigger premium confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#00E5FF', '#B388FF', '#FFD700'],
    });
  };

  const handleEnergyRefill = () => {
    setEnergy(maxEnergy);
    showToast('Energy fully recharged!', 'success');
    confetti({
      particleCount: 30,
      spread: 40,
      origin: { y: 0.8 },
      colors: ['#00E5FF', '#00FF88']
    });
  };

  // Dynamic leaderboard users mapping from Firestore
  const tapLeaderboardData = dbUsers.length > 0 
    ? dbUsers.map((u, idx) => ({
        rank: idx + 1,
        name: `${u.firstName} ${u.lastName}`.trim() || u.username || 'EForce Member',
        points: u.points ?? 0,
        referrals: u.referrals ?? 0,
        premium: u.isTelegramPremium ?? false
      }))
    : [
        { rank: 1, name: `${getDisplayName(telegramUser)} (You)`, points: efcBalance, referrals: referralsCount, premium: telegramUser?.isPremium ?? false }
      ];

  const referralLeaderboardData = dbUsers.length > 0 
    ? dbUsers.map((u, idx) => ({
        rank: idx + 1,
        name: `${u.firstName} ${u.lastName}`.trim() || u.username || 'EForce Member',
        points: u.points ?? 0,
        referrals: u.referrals ?? 0,
        premium: u.isTelegramPremium ?? false
      }))
    : [
        { rank: 1, name: `${getDisplayName(telegramUser)} (You)`, points: efcBalance, referrals: referralsCount, premium: telegramUser?.isPremium ?? false }
      ];

  // Append current user to local leaderboard array if they aren't already listed in top query results
  const isCurrentUserInLeaderboard = dbUsers.some(u => u.telegramId === telegramUser?.id);
  if (dbUsers.length > 0 && !isCurrentUserInLeaderboard && telegramUser) {
    const userItem = {
      rank: dbUsers.length + 1,
      name: `${getDisplayName(telegramUser)} (You)`,
      points: efcBalance,
      referrals: referralsCount,
      premium: telegramUser.isPremium
    };
    tapLeaderboardData.push(userItem);
    referralLeaderboardData.push(userItem);
  }

  const activeLeaderboard = leaderboardTab === 'tap' 
    ? [...tapLeaderboardData].sort((a, b) => b.points - a.points).map((item, idx) => ({ ...item, rank: idx + 1 }))
    : [...referralLeaderboardData].sort((a, b) => b.referrals - a.referrals).map((item, idx) => ({ ...item, rank: idx + 1 }));


  return (
    <div className="flex flex-col gap-6 pb-28">
      {/* Hero Greeting Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold text-accent-cyan tracking-widest uppercase mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>
            Elite Member
          </h2>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
            Hello {getShortName(telegramUser)} <span className="animate-bounce origin-bottom">👋</span>
            {telegramUser?.isPremium && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-gradient-to-r from-accent-purple via-accent-cyan to-accent-blue text-white shadow-[0_0_15px_rgba(0,229,255,0.4)] relative overflow-hidden group">
                <span className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                👑 Premium
              </span>
            )}
          </h1>
        </div>

        <button 
          onClick={() => setShowLeaderboard(true)}
          className="flex items-center gap-1.5 bg-accent-purple/10 border border-accent-purple/20 px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(179,136,255,0.06)] hover:bg-accent-purple/20 transition-all cursor-pointer"
        >
          <Trophy size={14} className="text-accent-gold" />
          <span className="text-xs font-bold text-accent-purple tracking-wide uppercase">Leaderboard</span>
        </button>
      </div>

      {/* Primary Balance Display */}
      <div className="glass-panel p-6 rounded-[24px] relative overflow-hidden flex flex-col items-center">
        {/* Subtle decorative lights */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-accent-cyan/5 rounded-full filter blur-xl"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-accent-purple/5 rounded-full filter blur-xl"></div>

        <span className="text-xs text-slate-400 font-medium tracking-wider uppercase mb-1">Total Available Balance</span>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-extrabold tracking-tight text-white font-display">
            {efcBalance.toLocaleString()}
          </span>
          <span className="text-sm font-bold text-accent-cyan tracking-wider">EForce</span>
        </div>

        <div className="w-full h-[1px] bg-white/5 mb-4"></div>

        <div className="flex justify-between w-full text-center">
          <div className="flex-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-0.5">Crypto Asset</span>
            <span className="text-sm font-bold text-accent-usdt flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-usdt"></span>
              ${usdtBalance.toFixed(2)} USDT
            </span>
          </div>
          <div className="w-[1px] bg-white/5"></div>
          <div className="flex-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-0.5">Est. EForce Value</span>
            <span className="text-xs font-semibold text-slate-300">
              ${(efcBalance * 0.0015).toFixed(2)} USD
            </span>
          </div>
        </div>
      </div>

      {/* Hero 3D Coin Section */}
      <div className="flex flex-col items-center my-2 select-none relative">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-slate-400 tracking-widest uppercase font-medium">Tap to Mine EForce</span>
          {combo > 1 && (
            <span className="text-xs font-black text-accent-purple bg-accent-purple/10 border border-accent-purple/20 px-2 py-0.5 rounded-full animate-bounce">
              {combo}x Combo
            </span>
          )}
        </div>
        
        <div
          onClick={handleCoinClick}
          className="relative w-52 h-52 flex items-center justify-center cursor-pointer active:scale-95 transition-transform duration-100"
        >
          {/* Outer glowing aura */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-accent-cyan/10 to-accent-purple/10 filter blur-2xl animate-pulse"></div>
          
          {/* Cinematic Coin design */}
          <motion.div
            animate={isSpinning ? { rotateY: 180 } : { rotateY: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-44 h-44 rounded-full relative z-10 p-1.5 select-none shadow-[0_15px_45px_rgba(0,0,0,0.6)]"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front Coin Face */}
            <div className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src="/coin-logo.jpg" 
                alt="Elite Force Coin" 
                className="w-full h-full object-cover rounded-full select-none pointer-events-none"
                draggable={false}
              />
              {/* Gloss Reflection overlay */}
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/8 to-transparent rotate-45 pointer-events-none"></div>
            </div>

            {/* Back Coin Face (visible during spin) */}
            <div 
              className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden"
              style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
            >
              <img 
                src="/coin-logo.jpg" 
                alt="Elite Force Coin" 
                className="w-full h-full object-cover rounded-full select-none pointer-events-none"
                draggable={false}
              />
              <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/8 to-transparent rotate-45 pointer-events-none"></div>
            </div>
          </motion.div>

          {/* Render click particle numbers */}
          <AnimatePresence>
            {clicks.map(click => (
              <motion.span
                key={click.id}
                initial={{ opacity: 1, y: click.y - 20, x: click.x, scale: 0.8 }}
                animate={{ opacity: 0, y: click.y - 120, scale: 1.3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute text-xl font-black text-accent-cyan drop-shadow-[0_2px_8px_rgba(0,229,255,0.5)] z-20 pointer-events-none select-none font-display"
              >
                +{click.value} EForce
              </motion.span>
            ))}
          </AnimatePresence>
        </div>

        {/* Energy system stats & progress bar */}
        <div className="w-full max-w-[240px] mt-4 flex flex-col gap-1.5 items-center">
          <div className="flex justify-between w-full text-xs font-bold text-slate-300 px-1">
            <span className="flex items-center gap-1">
              <Bolt size={13} className="text-accent-gold" />
              <span>Energy</span>
            </span>
            <span>{energy} / {maxEnergy}</span>
          </div>
          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
            <div 
              className="h-full bg-gradient-to-r from-accent-cyan via-accent-blue to-accent-purple rounded-full transition-all duration-300"
              style={{ width: `${(energy / maxEnergy) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Boosters Panel */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-3">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">EForce Upgrades & Boosters</span>
        <div className="grid grid-cols-2 gap-3">
          {/* Booster 1: Auto Tap */}
          <button
            onClick={() => {
              setAutoTapActive(!autoTapActive);
              showToast(autoTapActive ? 'Auto-Tap Booster Deactivated' : 'Auto-Tap Booster Activated (+5/sec)', 'info');
            }}
            className={`p-3.5 rounded-[18px] border text-left flex flex-col gap-1 transition-all ${
              autoTapActive 
                ? 'bg-accent-cyan/10 border-accent-cyan/35 text-white' 
                : 'bg-white/5 border-white/8 text-slate-400 hover:bg-white/10'
            }`}
          >
            <span className="text-xs font-extrabold text-white flex items-center gap-1">
              <Bolt size={12} className={autoTapActive ? 'text-accent-cyan' : 'text-slate-400'} />
              Auto Miner
            </span>
            <span className="text-[9px] text-slate-400">
              {autoTapActive ? 'Mining active...' : 'Idle - Tap to turn ON'}
            </span>
          </button>

          {/* Booster 2: Instant Refill */}
          <button
            onClick={handleEnergyRefill}
            className="p-3.5 rounded-[18px] bg-white/5 border border-white/8 hover:bg-white/10 text-left flex flex-col gap-1 transition-all"
          >
            <span className="text-xs font-extrabold text-white flex items-center gap-1">
              <Zap size={12} className="text-accent-gold" />
              Full Recharge
            </span>
            <span className="text-[9px] text-slate-400">Instant energy restore</span>
          </button>
        </div>
      </div>

      {/* Interactive Daily Reward & Streak */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent-gold/10 text-accent-gold border border-accent-gold/15">
              <Flame size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Daily Check-In</h3>
              <p className="text-[10px] text-slate-400">Current Streak: <span className="text-accent-gold font-bold">{dailyStreak} Days</span></p>
            </div>
          </div>

          <button
            onClick={claimDailyReward}
            disabled={dailyClaimed}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${
              dailyClaimed 
                ? 'bg-accent-success/10 border border-accent-success/20 text-accent-success pointer-events-none'
                : 'bg-accent-gold text-bg-primary hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] font-semibold'
            }`}
          >
            {dailyClaimed ? 'Claimed ✓' : 'Claim Reward'}
          </button>
        </div>

        {/* Streak Grid indicators */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, idx) => {
            const dayNum = idx + 1;
            const isCompleted = dayNum <= dailyStreak || (dayNum === 5 && dailyClaimed);
            const isCurrent = dayNum === dailyStreak + (dailyClaimed ? 0 : 1);
            
            return (
              <div 
                key={idx}
                className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                  isCompleted 
                    ? 'bg-accent-gold/10 border-accent-gold/30 text-accent-gold' 
                    : isCurrent 
                      ? 'bg-white/5 border-accent-cyan/40 text-accent-cyan shadow-[0_0_10px_rgba(0,229,255,0.05)]' 
                      : 'bg-white/[0.02] border-white/5 text-slate-500'
                }`}
              >
                <span className="text-[9px] uppercase font-bold tracking-wider mb-1">D{dayNum}</span>
                {isCompleted ? (
                  <Sparkles size={11} className="text-accent-gold" />
                ) : (
                  <span className="text-[10px] font-bold">+{dayNum * 50}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Card */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Rank Up Quest</span>
          <span className="text-accent-purple font-semibold">80% Completed</span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '80%' }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-accent-cyan to-accent-purple rounded-full"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
          <span>Earn 10k EForce points</span>
          <span className="flex items-center text-accent-cyan gap-0.5 cursor-pointer">
            View Tasks <ChevronRight size={12} />
          </span>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel p-3.5 rounded-[20px] text-center border-white/5 flex flex-col justify-center items-center">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Referrals</span>
          <span className="text-base font-bold text-white">{referralsCount} / 10</span>
          <span className="text-[8px] text-slate-400 mt-0.5">Active</span>
        </div>
        <div className="glass-panel p-3.5 rounded-[20px] text-center border-white/5 flex flex-col justify-center items-center">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Global Users</span>
          <span className="text-base font-bold text-accent-cyan flex items-center gap-1 justify-center">
            <Zap size={12} className="text-accent-cyan animate-pulse" />
            4.2M
          </span>
          <span className="text-[8px] text-slate-400 mt-0.5">Total Registered</span>
        </div>
        <div className="glass-panel p-3.5 rounded-[20px] text-center border-white/5 flex flex-col justify-center items-center">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Daily Mining</span>
          <span className="text-base font-bold text-accent-purple">+1.8K</span>
          <span className="text-[8px] text-slate-400 mt-0.5">EForce / hr</span>
        </div>
      </div>

      {/* 6. Beautiful Premium Leaderboard Modal Overlay */}
      <AnimatePresence>
        {showLeaderboard && (
          <div className="absolute inset-0 z-50 flex flex-col bg-[#050816] p-5 pt-12 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Trophy className="text-accent-gold" size={20} />
                <span>EForce Hall of Fame</span>
              </h2>
              <button 
                onClick={() => setShowLeaderboard(false)}
                className="p-2 rounded-xl bg-white/5 border border-white/8 text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Leaderboard Tabs: Tap vs Referral */}
            <div className="grid grid-cols-2 gap-2 bg-[#12182D] p-1 rounded-2xl border border-white/5 mb-4">
              <button 
                onClick={() => setLeaderboardTab('tap')}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  leaderboardTab === 'tap' 
                    ? 'bg-accent-cyan/15 border border-accent-cyan/25 text-accent-cyan shadow' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Tap Rank
              </button>
              <button 
                onClick={() => setLeaderboardTab('referral')}
                className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  leaderboardTab === 'referral' 
                    ? 'bg-accent-purple/15 border border-accent-purple/25 text-accent-purple shadow' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Referral Rank
              </button>
            </div>

            {/* Period selector */}
            <div className="flex gap-2 mb-4 justify-between">
              {['today', 'weekly', 'monthly', 'alltime'].map((p) => (
                <button
                  key={p}
                  onClick={() => setLeaderboardPeriod(p as any)}
                  className={`flex-1 py-1 rounded-lg text-[10px] uppercase font-bold border transition-all cursor-pointer ${
                    leaderboardPeriod === p 
                      ? 'bg-white/5 border-white/10 text-white font-black' 
                      : 'bg-transparent border-transparent text-slate-500 hover:text-slate-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="flex flex-col gap-2">
              {activeLeaderboard.map((user, idx) => {
                const rankColor = user.rank === 1 ? 'text-accent-gold border-accent-gold/25 bg-accent-gold/5' :
                                  user.rank === 2 ? 'text-slate-300 border-white/10 bg-white/[0.02]' :
                                  user.rank === 3 ? 'text-[#CD7F32] border-[#CD7F32]/25 bg-[#CD7F32]/5' :
                                  'text-slate-400 border-white/5';
                
                return (
                  <div 
                    key={idx}
                    className={`glass-panel p-3.5 rounded-[20px] border flex items-center justify-between transition-all ${
                      user.name.includes('(You)') ? 'border-accent-cyan/30 bg-accent-cyan/[0.005]' : 'border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Rank circle */}
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-black shrink-0 ${rankColor}`}>
                        {user.rank}
                      </div>

                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center text-slate-300 text-xs font-bold relative shrink-0">
                        {user.name.substring(0, 2).toUpperCase()}
                        {user.premium && (
                          <div className="absolute top-[-3px] right-[-3px] w-3 h-3 rounded-full bg-accent-purple flex items-center justify-center text-[7px]" title="Premium Member">
                            ★
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1">
                          <span className="truncate">{user.name}</span>
                          {user.premium && (
                            <span className="text-[9px] bg-accent-purple/15 text-accent-purple border border-accent-purple/20 px-1 rounded font-bold uppercase tracking-wider shrink-0 scale-90">
                              Premium
                            </span>
                          )}
                        </h4>
                        <span className="text-[9px] text-slate-500 font-semibold block">
                          Level {7 - user.rank} Node
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-white font-display block">
                        {leaderboardTab === 'tap' 
                          ? `${user.points.toLocaleString()} EForce` 
                          : `${user.referrals} Affiliates`}
                      </span>
                      <span className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">
                        {leaderboardTab === 'tap' ? 'Mined' : 'Invites'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-[10px] text-slate-500 leading-normal">
              🏆 Leaderboard resets dynamically at 00:00 UTC. Top 100 players receive EForce Bonus Airdrop distributions weekly!
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
