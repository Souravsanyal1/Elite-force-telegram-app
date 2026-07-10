import { useState, useEffect, ComponentType } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Check, Loader2, Sparkles, Send, Twitter, ShieldAlert, Globe, Compass } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Task {
  id: string;
  title: string;
  reward: number;
  icon: ComponentType<{ className?: string; size?: number }>;
  status: 'idle' | 'verifying' | 'completed';
  actionLabel: string;
}

interface TasksProps {
  efcBalance: number;
  setEfcBalance: (val: number | ((prev: number) => number)) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const Tasks = ({ setEfcBalance, showToast }: TasksProps) => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', title: 'Join Telegram Channel', reward: 500, icon: Send, status: 'idle', actionLabel: 'Join' },
    { id: '2', title: 'Join Official Discussion Group', reward: 500, icon: Send, status: 'idle', actionLabel: 'Join' },
    { id: '3', title: 'Follow Elite Force on X', reward: 800, icon: Twitter, status: 'idle', actionLabel: 'Follow' },
    { id: '4', title: 'Register on Partner Site', reward: 1500, icon: Globe, status: 'idle', actionLabel: 'Visit' },
    { id: '5', title: 'Claim Premium Telegram Bonus', reward: 2000, icon: Sparkles, status: 'idle', actionLabel: 'Claim' },
    { id: '6', title: 'Daily Wheel Spin', reward: 300, icon: Compass, status: 'idle', actionLabel: 'Spin' },
  ]);

  const handleTaskClick = (taskId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask || targetTask.status !== 'idle') return;

    // Set status to verifying
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'verifying' } : t));

    // Simulate verification check (2 seconds)
    setTimeout(() => {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          setEfcBalance(bal => bal + t.reward);
          showToast(`Verified! Reward claimed: +${t.reward} EForce`, 'success');
          return { ...t, status: 'completed' };
        }
        return t;
      }));
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-5 pb-28">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Missions</h1>
        <p className="text-xs text-slate-400 mt-1">Complete tasks to verify eligibility & earn bonus EForce.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-[20px] border-white/5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-0.5">Tasks Completed</span>
          <span className="text-lg font-bold text-white">
            {tasks.filter(t => t.status === 'completed').length} <span className="text-xs text-slate-500 font-normal">/ {tasks.length}</span>
          </span>
        </div>
        <div className="glass-panel p-4 rounded-[20px] border-white/5">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-0.5">Total Claimable</span>
          <span className="text-lg font-bold text-accent-cyan">
            {tasks.filter(t => t.status === 'idle').reduce((acc, t) => acc + t.reward, 0).toLocaleString()} <span className="text-xs font-normal text-slate-500">EForce</span>
          </span>
        </div>
      </div>

      {/* Task List container */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold text-accent-cyan tracking-wider uppercase mb-1">Missions Guild</h3>

        <div className="flex flex-col gap-2.5">
          {tasks.map((task) => {
            const Icon = task.icon;

            return (
              <div 
                key={task.id}
                className={`glass-panel p-4 rounded-[20px] border-white/6 flex items-center justify-between transition-all duration-300 ${
                  task.status === 'completed' ? 'border-accent-success/20 bg-accent-success/[0.01]' : ''
                }`}
              >
                {/* Left Side: Icon & Details */}
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl border flex items-center justify-center ${
                    task.status === 'completed' 
                      ? 'bg-accent-success/10 border-accent-success/20 text-accent-success' 
                      : 'bg-white/5 border-white/8 text-slate-300'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white tracking-wide">{task.title}</h4>
                    <span className="text-[11px] font-bold text-accent-purple mt-0.5 block">
                      +{task.reward} EForce
                    </span>
                  </div>
                </div>

                {/* Right Side: Action Button / Status */}
                <div>
                  <button
                    onClick={() => handleTaskClick(task.id)}
                    disabled={task.status !== 'idle'}
                    className={`h-9 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-300 ${
                      task.status === 'idle'
                        ? 'glass-btn hover:text-accent-cyan hover:border-accent-cyan/30'
                        : task.status === 'verifying'
                          ? 'bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan font-medium cursor-not-allowed'
                          : 'bg-accent-success/10 border border-accent-success/20 text-accent-success font-medium cursor-default'
                    }`}
                  >
                    {task.status === 'idle' && (
                      <span>{task.actionLabel}</span>
                    )}

                    {task.status === 'verifying' && (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        <span>Verifying</span>
                      </>
                    )}

                    {task.status === 'completed' && (
                      <>
                        <Check size={12} className="stroke-[3]" />
                        <span>Done</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Rewarded Ads System */}
      <RewardedAds setEfcBalance={setEfcBalance} showToast={showToast} />

      {/* Verification Policy Disclaimer */}
      <div className="glass-panel p-4 rounded-[20px] border-white/5 flex items-start gap-3 bg-accent-warning/[0.01]">
        <ShieldAlert size={16} className="text-accent-warning shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <h5 className="text-xs font-bold text-slate-300">Fraud Prevention System</h5>
          <p className="text-[10px] text-slate-400 leading-normal">
            Our automated security node cross-checks channels. If you leave a group or undo social follows after claiming, EForce credits will be rolled back automatically.
          </p>
        </div>
      </div>

    </div>
  );
};

interface RewardedAdsProps {
  setEfcBalance: (val: number | ((prev: number) => number)) => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const RewardedAds: React.FC<RewardedAdsProps> = ({ setEfcBalance, showToast }) => {
  const [adWatching, setAdWatching] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3);

  const startAd = () => {
    setAdWatching(true);
    setTimeLeft(3);
    showToast("Launching sponsored video stream...", "info");
  };

  useEffect(() => {
    if (!adWatching) return;
    if (timeLeft <= 0) {
      setAdWatching(false);
      setEfcBalance(prev => prev + 500);
      showToast("Ad completed! Earned +500 EForce Points!", "success");
      
      confetti({
        particleCount: 40,
        spread: 50,
        colors: ['#00E5FF', '#FFD700']
      });
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [adWatching, timeLeft, setEfcBalance]);

  return (
    <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-3.5 relative overflow-hidden">
      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Rewarded Nodes</span>
      
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-0.5">
          <h4 className="text-xs font-bold text-white">Watch Sponsored Ad Broadcast</h4>
          <span className="text-[10px] text-accent-purple font-semibold">+500 EForce Points</span>
        </div>

        <button
          onClick={startAd}
          disabled={adWatching}
          className="h-9 px-4 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white text-xs font-bold shadow hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Watch ad
        </button>
      </div>

      {/* Ad Watch Simulator Modal Overlay */}
      <AnimatePresence>
        {adWatching && (
          <div className="absolute inset-0 z-50 bg-[#050816] flex flex-col items-center justify-center text-center p-4">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-black block mb-2">Streaming Broadcast</span>
            <div className="w-16 h-16 rounded-full border-4 border-t-accent-cyan border-white/10 animate-spin flex items-center justify-center mb-4">
              <span className="text-xs font-black text-white">{timeLeft}s</span>
            </div>
            <p className="text-xs text-slate-300 font-bold">Verify node network connection to award credits...</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
