import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, ShieldAlert, Award } from 'lucide-react';
import { ActiveTab, Navigation } from './components/Navigation';
import { Home } from './views/Home';
import { Tasks } from './views/Tasks';
import { Referral } from './views/Referral';
import { Wallet } from './views/Wallet';
import { Profile } from './views/Profile';
import { Settings } from './views/Settings';
import { Admin } from './views/Admin';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  
  // Persisted state loading helper
  const getPersisted = <T,>(key: string, defaultValue: T): T => {
    const val = localStorage.getItem(key);
    if (val === null) return defaultValue;
    try {
      return JSON.parse(val) as T;
    } catch {
      return defaultValue;
    }
  };

  // State Declarations with Persisted Fallbacks
  const [efcBalance, setEfcBalance] = useState<number>(() => getPersisted('efcBalance', 4820));
  const [eforceTokens, setEforceTokens] = useState<number>(() => getPersisted('eforceTokens', 0));
  const [usdtBalance, setUsdtBalance] = useState<number>(() => getPersisted('usdtBalance', 38.50));
  const [referralsCount, setReferralsCount] = useState<number>(() => getPersisted('referralsCount', 8));
  const [hasUnlockedWithdrawal, setHasUnlockedWithdrawal] = useState<boolean>(() => getPersisted('hasUnlockedWithdrawal', false));
  const [energy, setEnergy] = useState<number>(() => getPersisted('energy', 1000));
  const [maxEnergy] = useState<number>(1000);
  
  // Admin-controlled settings
  const [swapOpen, setSwapOpen] = useState<boolean>(() => getPersisted('swapOpen', false));
  const [swapRate, setSwapRate] = useState<number>(() => getPersisted('swapRate', 1000));
  const [tokenSale, setTokenSale] = useState(() => getPersisted('tokenSale', {
    active: false,
    price: 0.05,
    totalSold: 0,
    totalSupply: 500000,
    minPurchase: 10,
    maxPurchase: 1000
  }));
  const [connectedWallet, setConnectedWallet] = useState<string | null>(() => getPersisted<string | null>('connectedWallet', null));
  const [connectedAddress, setConnectedAddress] = useState<string | null>(() => getPersisted<string | null>('connectedAddress', null));

  // Shared requests ledger
  const [withdrawRequests, setWithdrawRequests] = useState<{ id: string; user: string; amount: number; status: 'Pending' | 'Approved' | 'Rejected' | 'Banned'; date: string }[]>(() => getPersisted('withdrawRequests', [
    { id: '1092', user: 'ton_miner_88', amount: 45.0, status: 'Pending', date: 'Just Now' },
    { id: '1091', user: 'crypto_champ', amount: 15.0, status: 'Pending', date: '10 mins ago' },
    { id: '1090', user: 'bot_spammer_32', amount: 120.0, status: 'Pending', date: '1 hour ago' },
    { id: '1089', user: 'vip_holder_9', amount: 50.0, status: 'Approved', date: '3 hours ago' },
  ]));

  // Generate random background particles
  const [bgParticles] = useState(() => 
    Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${12 + Math.random() * 8}s`,
      size: `${2 + Math.random() * 4}px`,
    }))
  );

  const [toasts, setToasts] = useState<Toast[]>([]);

  // Auto-persist updates
  useEffect(() => {
    localStorage.setItem('efcBalance', JSON.stringify(efcBalance));
  }, [efcBalance]);
  useEffect(() => {
    localStorage.setItem('eforceTokens', JSON.stringify(eforceTokens));
  }, [eforceTokens]);
  useEffect(() => {
    localStorage.setItem('usdtBalance', JSON.stringify(usdtBalance));
  }, [usdtBalance]);
  useEffect(() => {
    localStorage.setItem('referralsCount', JSON.stringify(referralsCount));
  }, [referralsCount]);
  useEffect(() => {
    localStorage.setItem('hasUnlockedWithdrawal', JSON.stringify(hasUnlockedWithdrawal));
  }, [hasUnlockedWithdrawal]);
  useEffect(() => {
    localStorage.setItem('energy', JSON.stringify(energy));
  }, [energy]);
  useEffect(() => {
    localStorage.setItem('swapOpen', JSON.stringify(swapOpen));
  }, [swapOpen]);
  useEffect(() => {
    localStorage.setItem('swapRate', JSON.stringify(swapRate));
  }, [swapRate]);
  useEffect(() => {
    localStorage.setItem('tokenSale', JSON.stringify(tokenSale));
  }, [tokenSale]);
  useEffect(() => {
    localStorage.setItem('connectedWallet', JSON.stringify(connectedWallet));
  }, [connectedWallet]);
  useEffect(() => {
    localStorage.setItem('connectedAddress', JSON.stringify(connectedAddress));
  }, [connectedAddress]);
  useEffect(() => {
    localStorage.setItem('withdrawRequests', JSON.stringify(withdrawRequests));
  }, [withdrawRequests]);

  // Energy Regeneration Loop (+3 energy per second)
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(prev => {
        if (prev >= maxEnergy) return maxEnergy;
        return Math.min(prev + 3, maxEnergy);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [maxEnergy]);

  // Preloader
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Home 
            efcBalance={efcBalance} 
            setEfcBalance={setEfcBalance} 
            usdtBalance={usdtBalance} 
            energy={energy}
            setEnergy={setEnergy}
            maxEnergy={maxEnergy}
            referralsCount={referralsCount}
            showToast={showToast} 
          />
        );
      case 'tasks':
        return (
          <Tasks 
            efcBalance={efcBalance}
            setEfcBalance={setEfcBalance} 
            showToast={showToast} 
          />
        );
      case 'referral':
        return (
          <Referral 
            showToast={showToast} 
            setEfcBalance={setEfcBalance} 
            hasUnlockedWithdrawal={hasUnlockedWithdrawal} 
            setHasUnlockedWithdrawal={setHasUnlockedWithdrawal} 
            referralsCount={referralsCount}
            setReferralsCount={setReferralsCount}
          />
        );
      case 'wallet':
        return (
          <Wallet 
            efcBalance={efcBalance} 
            setEfcBalance={setEfcBalance} 
            eforceTokens={eforceTokens}
            setEforceTokens={setEforceTokens}
            usdtBalance={usdtBalance} 
            setUsdtBalance={setUsdtBalance} 
            swapOpen={swapOpen}
            swapRate={swapRate}
            tokenSale={tokenSale}
            setTokenSale={setTokenSale}
            connectedWallet={connectedWallet}
            setConnectedWallet={setConnectedWallet}
            connectedAddress={connectedAddress}
            setConnectedAddress={setConnectedAddress}
            withdrawRequests={withdrawRequests}
            setWithdrawRequests={setWithdrawRequests}
            showToast={showToast} 
            hasUnlockedWithdrawal={hasUnlockedWithdrawal} 
          />
        );
      case 'profile':
        return (
          <Profile 
            efcBalance={efcBalance} 
            connectedAddress={connectedAddress}
            showToast={showToast} 
          />
        );
      case 'settings':
        return <Settings showToast={showToast} />;
      case 'admin':
        return (
          <Admin 
            swapOpen={swapOpen}
            setSwapOpen={setSwapOpen}
            swapRate={swapRate}
            setSwapRate={setSwapRate}
            tokenSale={tokenSale}
            setTokenSale={setTokenSale}
            withdrawRequests={withdrawRequests}
            setWithdrawRequests={setWithdrawRequests}
            showToast={showToast} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-bg-primary overflow-hidden flex items-center justify-center font-sans select-none">
      
      {/* 1. Background Experience Layers */}
      <div className="bg-experience">
        <div className="bg-layer-gradient"></div>
        <div className="bg-layer-aurora"></div>
        <div className="bg-layer-aurora-secondary"></div>
        
        {/* Floating Background Particles */}
        {bgParticles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              width: p.size,
              height: p.size,
            }}
          />
        ))}
      </div>
      
      {/* 2. Film Grain Cinematic Noise Overlay */}
      <div className="noise-overlay"></div>

      {/* 3. Luxury Preloader */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-50 bg-[#050816] flex flex-col items-center justify-center text-center p-6"
          >
            {/* Spinning Gold Coin with Halo */}
            <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-accent-cyan/15 filter blur-xl animate-pulse"></div>
              <motion.div
                animate={{ rotateY: 360 }}
                transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                className="w-20 h-20 rounded-full border-2 border-accent-cyan flex items-center justify-center shadow-[0_0_30px_rgba(0,229,255,0.25)] bg-[#0E1225]"
              >
                <Award size={38} className="text-accent-cyan" />
              </motion.div>
            </div>

            {/* Glowing Logo Text */}
            <h1 className="text-xl font-extrabold tracking-[0.25em] text-white uppercase drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
              ELITE FORCE
            </h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.4em] uppercase mt-2">
              WEB3 ECOSYSTEM v2.0
            </p>

            {/* Particle Loading Line */}
            <div className="w-36 h-1 bg-white/5 rounded-full mt-8 overflow-hidden relative">
              <motion.div
                initial={{ left: '-100%' }}
                animate={{ left: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="absolute w-1/2 h-full bg-gradient-to-r from-transparent via-accent-cyan to-transparent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Main Application Structure */}
      {!loading && (
        <div className="w-full h-full max-w-[430px] md:h-[840px] md:rounded-[36px] md:border-[6px] md:border-[#1E2338] md:shadow-[0_25px_80px_rgba(0,0,0,0.8),_0_0_0_1px_rgba(255,255,255,0.05),_0_0_40px_rgba(0,229,255,0.03)] bg-[#050816]/95 backdrop-blur-sm relative flex flex-col overflow-hidden">
          
          {/* Simulated Mobile Speaker Cutout on Desktop */}
          <div className="hidden md:block absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-[#1E2338] rounded-b-2xl z-50">
            <div className="w-12 h-1 bg-black rounded-full mx-auto mt-1.5"></div>
          </div>

          {/* Toast Notification Container */}
          <div className="absolute top-8 left-4 right-4 z-50 flex flex-col gap-2">
            <AnimatePresence>
              {toasts.map((toast) => (
                <motion.div
                  key={toast.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="glass-panel px-4 py-3 rounded-2xl flex items-center gap-3 shadow-[0_12px_30px_rgba(0,0,0,0.3)] border-white/8 relative overflow-hidden"
                >
                  {/* Decorative glowing back bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    toast.type === 'success' ? 'bg-accent-success' :
                    toast.type === 'error' ? 'bg-accent-danger' :
                    toast.type === 'warning' ? 'bg-accent-warning' : 'bg-accent-cyan'
                  }`} />
                  
                  {/* Toast Icon */}
                  <div className={`shrink-0 ${
                    toast.type === 'success' ? 'text-accent-success' :
                    toast.type === 'error' ? 'text-accent-danger' :
                    toast.type === 'warning' ? 'text-accent-warning' : 'text-accent-cyan'
                  }`}>
                    {toast.type === 'success' && <CheckCircle size={16} />}
                    {toast.type === 'error' && <ShieldAlert size={16} />}
                    {toast.type === 'warning' && <AlertCircle size={16} />}
                    {toast.type === 'info' && <Info size={16} />}
                  </div>

                  {/* Message */}
                  <span className="text-xs font-semibold text-slate-200 tracking-wide">
                    {toast.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* View Scrollable Frame */}
          <div className="flex-1 overflow-y-auto px-5 pt-10 pb-20 custom-scrollbar relative z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="h-full pt-4"
              >
                {renderActiveView()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Floating Navigation */}
          <Navigation 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            isAdmin={true} 
          />

        </div>
      )}
    </div>
  );
}
