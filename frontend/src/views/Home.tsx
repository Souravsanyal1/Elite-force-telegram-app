import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Flame, ChevronRight, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

interface HomeProps {
  efcBalance: number;
  setEfcBalance: React.Dispatch<React.SetStateAction<number>>;
  usdtBalance: number;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
}

export const Home: React.FC<HomeProps> = ({ efcBalance, setEfcBalance, usdtBalance, showToast }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [clicks, setClicks] = useState<FloatingText[]>([]);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(4); // 4 days streak

  const handleCoinClick = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsSpinning(true);
    setEfcBalance(prev => prev + 1);

    // Get click coords relative to the coin card
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickId = Date.now();
    setClicks(prev => [...prev, { id: clickId, x, y }]);

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

  return (
    <div className="flex flex-col gap-6 pb-28">
      {/* Hero Greeting Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold text-accent-cyan tracking-widest uppercase mb-1 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>
            Elite Member
          </h2>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Hello Sourav <span className="animate-bounce origin-bottom">👋</span>
          </h1>
        </div>

        <div className="flex items-center gap-1.5 bg-accent-purple/10 border border-accent-purple/20 px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(179,136,255,0.06)]">
          <Trophy size={14} className="text-accent-gold" />
          <span className="text-xs font-bold text-accent-purple tracking-wide uppercase">Rank #42</span>
        </div>
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
        <span className="text-[11px] text-slate-400 mb-3 tracking-widest uppercase font-medium">Tap to Mine EForce</span>
        
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
                +1 EForce
              </motion.span>
            ))}
          </AnimatePresence>
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
          <span className="text-base font-bold text-white">8 / 10</span>
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

    </div>
  );
};
