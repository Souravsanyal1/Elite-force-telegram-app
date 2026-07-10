import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, ShieldAlert, Award, Smartphone, Lock } from 'lucide-react';
import { ActiveTab, Navigation } from './components/Navigation';
import { Home } from './views/Home';
import { Tasks } from './views/Tasks';
import { Referral } from './views/Referral';
import { Wallet } from './views/Wallet';
import { Profile } from './views/Profile';
import { Settings } from './views/Settings';
import { Admin } from './views/Admin';
import { AdminLogin } from './views/AdminLogin';
import { getTelegramWebAppData, type TelegramUser } from './lib/telegramUser';
import { upsertUser, setUserOffline, syncPointsToFirestore, getOnlineUserCount, subscribeToUser } from './lib/userService';
import { isFirebaseConfigured } from './lib/firebase';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface DeviceDetails {
  platform: string;
  browser: string;
  os: string;
  resolution: string;
  language: string;
  timezone: string;
  userAgent: string;
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

  // State Declarations
  const [efcBalance, setEfcBalance] = useState<number>(() => getPersisted('efcBalance', 0));
  const [eforceTokens, setEforceTokens] = useState<number>(() => getPersisted('eforceTokens', 0));
  const [usdtBalance, setUsdtBalance] = useState<number>(() => getPersisted('usdtBalance', 0.00));
  const [referralsCount, setReferralsCount] = useState<number>(() => getPersisted('referralsCount', 0));
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
  const [withdrawRequests, setWithdrawRequests] = useState<{ id: string; user: string; amount: number; status: 'Pending' | 'Approved' | 'Rejected' | 'Banned'; date: string }[]>(() => getPersisted('withdrawRequests', []));


  // Route and Auth parameters
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => getPersisted('isAdminAuthenticated', false));
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Telegram environment parameters
  const [isTelegramWebview, setIsTelegramWebview] = useState(false);
  const [bypassTelegramCheck, setBypassTelegramCheck] = useState(() => getPersisted('bypassTelegramCheck', false));

  // Telegram user data (real from SDK or mock in dev)
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);

  // Ref to store telegramId for cleanup
  const telegramIdRef = useRef<number | null>(null);

  // Ref to store the last synced points to prevent overwrite loop
  const lastSyncedPointsRef = useRef<number>(-1);

  // Dynamic live stats for Admin Panel (real from Firestore)
  const [liveUserCount, setLiveUserCount] = useState(0);

  // Device Info parameters
  const [deviceInfo, setDeviceInfo] = useState<DeviceDetails>({
    platform: 'Unknown',
    browser: 'Unknown',
    os: 'Unknown',
    resolution: 'Unknown',
    language: 'en',
    timezone: 'UTC',
    userAgent: ''
  });

  // Device & Telegram signature checks
  useEffect(() => {
    // Detect Telegram WebApp
    const isTg = !!(window as any).Telegram?.WebApp?.initData || navigator.userAgent.includes('Telegram');
    setIsTelegramWebview(isTg);

    // Extract device metrics
    const ua = navigator.userAgent;
    let detectedOS = 'Unknown OS';
    if (ua.includes('Windows')) detectedOS = 'Windows';
    else if (ua.includes('Macintosh')) detectedOS = 'macOS';
    else if (ua.includes('Android')) detectedOS = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) detectedOS = 'iOS';

    let detectedBrowser = 'Unknown Browser';
    if (ua.includes('Firefox')) detectedBrowser = 'Firefox';
    else if (ua.includes('Chrome')) detectedBrowser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) detectedBrowser = 'Safari';
    else if (ua.includes('Telegram')) detectedBrowser = 'Telegram WebView';

    setDeviceInfo({
      platform: navigator.platform || 'Web',
      browser: detectedBrowser,
      os: detectedOS,
      resolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language || 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      userAgent: ua
    });

    // Parse Telegram user from WebApp SDK
    const webAppData = getTelegramWebAppData();
    if (webAppData.user) {
      setTelegramUser(webAppData.user);
      telegramIdRef.current = webAppData.user.id;

      // Upsert Firestore user doc
      upsertUser(
        webAppData.user,
        {
          platform: navigator.platform || 'Web',
          browser: detectedBrowser,
          os: detectedOS,
          resolution: `${window.screen.width}x${window.screen.height}`,
          language: navigator.language || 'en',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        },
        efcBalance
      ).catch(() => {});
    }

    // Set user offline on tab/window close
    const handleUnload = () => {
      if (telegramIdRef.current) {
        setUserOffline(telegramIdRef.current);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync route path changes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setCurrentPath(window.location.pathname);
    };
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  // Sync Firestore online user count every 30 seconds
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const syncCount = async () => {
      const count = await getOnlineUserCount();
      if (count > 0) setLiveUserCount(count);
    };
    syncCount();
    const interval = setInterval(syncCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Sync EForce points to Firestore when balance changes
  useEffect(() => {
    if (!telegramUser) return;
    const timeout = setTimeout(() => {
      lastSyncedPointsRef.current = efcBalance;
      syncPointsToFirestore(telegramUser.id, efcBalance).catch(() => {});
    }, 3000); // debounce 3s
    return () => clearTimeout(timeout);
  }, [efcBalance, telegramUser]);

  // Subscribe to real-time user document changes in Firestore
  useEffect(() => {
    if (!telegramUser) return;
    const unsubscribe = subscribeToUser(telegramUser.id, (dbUser) => {
      if (dbUser) {
        // Only update local state if db points is different from last synced value
        if (dbUser.points !== lastSyncedPointsRef.current) {
          setEfcBalance(dbUser.points ?? 0);
          lastSyncedPointsRef.current = dbUser.points ?? 0;
        }
        setUsdtBalance(dbUser.wallet ?? 0);
        setReferralsCount(dbUser.referrals ?? 0);
      }
    });
    return () => unsubscribe();
  }, [telegramUser]);

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
  useEffect(() => {
    localStorage.setItem('isAdminAuthenticated', JSON.stringify(isAdminAuthenticated));
  }, [isAdminAuthenticated]);
  useEffect(() => {
    localStorage.setItem('bypassTelegramCheck', JSON.stringify(bypassTelegramCheck));
  }, [bypassTelegramCheck]);

  // Energy & Presence Loops
  useEffect(() => {
    const interval = setInterval(() => {
      // Energy regeneration (+3/sec)
      setEnergy(prev => {
        if (prev >= maxEnergy) return maxEnergy;
        return Math.min(prev + 3, maxEnergy);
      });
      // Fluctuate active user presence counts (+/- 3 users)
      setLiveUserCount(prev => prev + (Math.random() > 0.5 ? 2 : -2));
    }, 1000);
    return () => clearInterval(interval);
  }, [maxEnergy]);

  // Preloader animation
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

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    // Route transition to /admin
    window.history.pushState({}, '', '/admin');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    window.history.pushState({}, '', '/admin-login');
    showToast("Logged out of Admin console.", "info");
  };

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
            telegramUser={telegramUser}
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
            telegramUser={telegramUser}
          />
        );
      case 'settings':
        return <Settings showToast={showToast} />;
      default:
        return null;
    }
  };

  // Determine routing view
  const renderRoutedPage = () => {
    // Block admin routes inside Telegram WebView
    const isAdminPath = currentPath === '/admin-login' || currentPath === '/admin';
    if (isAdminPath && isTelegramWebview) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh] select-none">
          <ShieldAlert size={46} className="text-accent-danger mb-4 animate-pulse" />
          <h2 className="text-xl font-black text-white tracking-wide uppercase mb-2">Access Denied</h2>
          <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed mb-6">
            The Admin Console cannot be accessed inside the Telegram client. Please open this URL from a secure external web browser.
          </p>
        </div>
      );
    }

    if (currentPath === '/admin-login') {
      return (
        <AdminLogin 
          onLoginSuccess={handleAdminLoginSuccess} 
          showToast={showToast} 
        />
      );
    }

    if (currentPath === '/admin') {
      if (!isAdminAuthenticated) {
        // Protected redirect
        return (
          <div className="flex flex-col items-center justify-center p-6 text-center min-h-[50vh]">
            <Lock size={36} className="text-accent-danger mb-4 animate-bounce" />
            <h2 className="text-lg font-black text-white uppercase mb-2">Access Denied</h2>
            <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed mb-6">
              You must authenticate with verified Admin credentials to open the console dashboard.
            </p>
            <button
              onClick={() => window.history.pushState({}, '', '/admin-login')}
              className="h-10 px-6 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white text-xs font-bold shadow hover:shadow-lg transition-all cursor-pointer"
            >
              Sign In Page
            </button>
          </div>
        );
      }
      return (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center px-5 pt-6">
            <span className="text-[10px] font-black text-accent-cyan uppercase tracking-widest bg-accent-cyan/10 border border-accent-cyan/15 px-3 py-1 rounded-full">
              Console Session
            </span>
            <button 
              onClick={handleAdminLogout}
              className="text-[10px] font-bold text-accent-danger border border-accent-danger/25 bg-accent-danger/5 hover:bg-accent-danger/15 px-3 py-1 rounded-full transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-10">
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
              liveUserCount={liveUserCount}
            />
          </div>
        </div>
      );
    }

    // Default Main User Route "/"
    // 1. Telegram webview checks
    if (!isTelegramWebview && !bypassTelegramCheck) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh] select-none">
          <ShieldAlert size={46} className="text-accent-danger mb-4 animate-pulse" />
          <h2 className="text-xl font-black text-white tracking-wide uppercase mb-2">Access Denied</h2>
          <p className="text-xs text-slate-400 max-w-[280px] leading-relaxed mb-6">
            This premium application can only be opened from the official Telegram WebApp client.
          </p>
          <div className="w-full h-[1px] bg-white/5 my-4" />
          
          {/* Dev Mode Simulator Panel */}
          <div className="glass-panel p-4 rounded-2xl border-white/5 w-full max-w-[300px]">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block mb-1">Developer Testing Console</span>
            <span className="text-[10px] text-slate-400 block mb-3">Simulate client environments locally</span>
            <button
              onClick={() => {
                setBypassTelegramCheck(true);
                showToast("Simulating Telegram WebApp session.", "success");
              }}
              className="w-full h-9 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 text-white text-[10px] font-bold transition-all cursor-pointer"
            >
              Launch Simulator (Bypass Check)
            </button>
          </div>
        </div>
      );
    }

    // Render client dashboard layout
    return (
      <div className="w-full h-full relative flex flex-col overflow-hidden">
        
        {/* Device metadata indicator header */}
        <div className="flex justify-between items-center px-5 pt-3.5 pb-2 text-[9px] text-slate-500 font-bold uppercase tracking-wider bg-white/[0.01] border-b border-white/5 z-20">
          <div className="flex items-center gap-1">
            <Smartphone size={10} className="text-slate-500" />
            <span>{deviceInfo.os} ({deviceInfo.browser})</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-ping"></span>
            <span>Live node active</span>
          </div>
        </div>

        {/* Dynamic content scroll area */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-20 custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.99 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="h-full"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Navigation */}
        <Navigation 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          isAdmin={true} 
        />
      </div>
    );
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
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                    toast.type === 'success' ? 'bg-accent-success' :
                    toast.type === 'error' ? 'bg-accent-danger' :
                    toast.type === 'warning' ? 'bg-accent-warning' : 'bg-accent-cyan'
                  }`} />
                  
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

                  <span className="text-xs font-semibold text-slate-200 tracking-wide">
                    {toast.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Render routed content */}
          {renderRoutedPage()}

        </div>
      )}
    </div>
  );
}
