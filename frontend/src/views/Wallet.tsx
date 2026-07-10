import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck, Lock, CheckCircle, ShieldAlert, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TokenSaleType {
  active: boolean;
  price: number;
  totalSold: number;
  totalSupply: number;
  minPurchase: number;
  maxPurchase: number;
}

interface WalletProps {
  efcBalance: number;
  setEfcBalance: React.Dispatch<React.SetStateAction<number>>;
  eforceTokens: number;
  setEforceTokens: React.Dispatch<React.SetStateAction<number>>;
  usdtBalance: number;
  setUsdtBalance: React.Dispatch<React.SetStateAction<number>>;
  swapOpen: boolean;
  swapRate: number;
  tokenSale: TokenSaleType;
  setTokenSale: React.Dispatch<React.SetStateAction<TokenSaleType>>;
  connectedWallet: string | null;
  setConnectedWallet: React.Dispatch<React.SetStateAction<string | null>>;
  connectedAddress: string | null;
  setConnectedAddress: React.Dispatch<React.SetStateAction<string | null>>;
  withdrawRequests: Array<{ id: string; user: string; amount: number; status: 'Pending' | 'Approved' | 'Rejected' | 'Banned'; date: string }>;
  setWithdrawRequests: React.Dispatch<React.SetStateAction<any[]>>;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  hasUnlockedWithdrawal: boolean;
}

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'reward' | 'swap' | 'buy';
  amount: string;
  asset: 'EForce' | 'USDT' | 'EForce Token';
  status: 'completed' | 'pending';
  date: string;
}

export const Wallet: React.FC<WalletProps> = ({
  efcBalance,
  setEfcBalance,
  eforceTokens,
  setEforceTokens,
  usdtBalance,
  setUsdtBalance,
  swapOpen,
  swapRate,
  tokenSale,
  setTokenSale,
  connectedWallet,
  setConnectedWallet,
  connectedAddress,
  setConnectedAddress,
  withdrawRequests,
  setWithdrawRequests,
  showToast,
  hasUnlockedWithdrawal,
}) => {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('10.0');

  // Local swap form state
  const [swapInputPoints, setSwapInputPoints] = useState('1000');
  
  // Local buy token state
  const [buyUsdtAmount, setBuyUsdtAmount] = useState('10.0');

  // Transactions list
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

    if (nextPin.length === 4) {
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        setIsSuccess(true);
        const amountNum = parseFloat(withdrawAmount);
        setUsdtBalance(prev => prev - amountNum);
        
        // Add to global withdraw requests so it shows up in Admin dashboard instantly
        const newReq = {
          id: Date.now().toString().slice(-4),
          user: 'Sourav Sanyal (You)',
          amount: amountNum,
          status: 'Pending' as const,
          date: 'Just Now',
        };
        setWithdrawRequests(prev => [newReq, ...prev]);

        // Add transaction local ledger
        setTransactions(prev => [
          {
            id: Date.now().toString(),
            type: 'withdraw',
            amount: withdrawAmount,
            asset: 'USDT',
            status: 'pending',
            date: 'Just Now',
          },
          ...prev,
        ]);

        showToast(`Withdrawal request of $${withdrawAmount} USDT submitted!`, 'success');

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00FF88', '#00E5FF', '#ffffff'],
        });

        setTimeout(() => {
          setShowWithdrawModal(false);
        }, 2200);

      }, 2000);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  // Simulated Wallet Connect Flow
  const handleSelectWallet = (walletName: string) => {
    setShowConnectModal(false);
    showToast(`Connecting to ${walletName}...`, 'info');
    
    setTimeout(() => {
      const mockAddr = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setConnectedWallet(walletName);
      setConnectedAddress(mockAddr);
      showToast(`${walletName} connected successfully!`, 'success');
      
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#F3BA2F', '#00E5FF']
      });
    }, 1500);
  };

  const handleDisconnectWallet = () => {
    setConnectedWallet(null);
    setConnectedAddress(null);
    showToast('Wallet disconnected.', 'info');
  };

  // EForce Swap Handler
  const handleSwap = () => {
    const pointsNum = parseInt(swapInputPoints);
    if (isNaN(pointsNum) || pointsNum <= 0) {
      showToast('Please enter a valid amount of points.', 'error');
      return;
    }
    if (efcBalance < pointsNum) {
      showToast('Insufficient EForce points balance.', 'error');
      return;
    }

    const tokensToReceive = pointsNum / swapRate;
    setEfcBalance(prev => prev - pointsNum);
    setEforceTokens(prev => prev + tokensToReceive);
    showToast(`Swapped ${pointsNum} Points for ${tokensToReceive} EForce Tokens!`, 'success');
    setShowSwapModal(false);

    setTransactions(prev => [
      {
        id: Date.now().toString(),
        type: 'swap',
        amount: `${tokensToReceive}`,
        asset: 'EForce Token',
        status: 'completed',
        date: 'Just Now',
      },
      ...prev,
    ]);

    confetti({
      particleCount: 60,
      spread: 60,
      colors: ['#00E5FF', '#B388FF']
    });
  };

  // Token Buy Handler
  const handleBuyTokens = () => {
    if (!connectedWallet) {
      showToast('Please connect your BEP-20 wallet first!', 'warning');
      return;
    }
    const usdtNum = parseFloat(buyUsdtAmount);
    if (isNaN(usdtNum) || usdtNum <= 0) {
      showToast('Please enter a valid USDT amount.', 'error');
      return;
    }
    if (usdtBalance < usdtNum) {
      showToast('Insufficient USDT balance.', 'error');
      return;
    }

    const tokensBought = usdtNum / tokenSale.price;
    if (tokenSale.totalSold + tokensBought > tokenSale.totalSupply) {
      showToast('Purchase exceeds remaining supply.', 'error');
      return;
    }

    setUsdtBalance(prev => prev - usdtNum);
    setEforceTokens(prev => prev + tokensBought);
    setTokenSale(prev => ({
      ...prev,
      totalSold: prev.totalSold + tokensBought
    }));

    showToast(`Successfully bought ${tokensBought.toLocaleString()} EForce Tokens!`, 'success');

    setTransactions(prev => [
      {
        id: Date.now().toString(),
        type: 'buy',
        amount: `${tokensBought.toLocaleString()}`,
        asset: 'EForce Token',
        status: 'completed',
        date: 'Just Now',
      },
      ...prev,
    ]);

    confetti({
      particleCount: 80,
      spread: 80,
      colors: ['#F3BA2F', '#00FF88']
    });
  };

  return (
    <div className="flex flex-col gap-5 pb-28">
      {/* View Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Cryptoport</h1>
          <p className="text-xs text-slate-400 mt-1">Manage deposits, pending assets, and luxury withdrawals.</p>
        </div>
        
        {/* Wallet Connection Status pill */}
        {connectedWallet ? (
          <button 
            onClick={handleDisconnectWallet}
            className="flex items-center gap-1.5 bg-accent-success/10 border border-accent-success/20 px-3 py-1.5 rounded-full hover:bg-accent-danger/10 hover:border-accent-danger/20 transition-all group cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-accent-success group-hover:bg-accent-danger"></span>
            <span className="text-[10px] font-bold text-accent-success group-hover:text-accent-danger uppercase font-mono">
              {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
            </span>
          </button>
        ) : (
          <button 
            onClick={() => setShowConnectModal(true)}
            className="flex items-center gap-1.5 bg-accent-cyan/15 border border-accent-cyan/20 px-3.5 py-1.5 rounded-full text-accent-cyan text-[10px] font-bold hover:bg-accent-cyan/25 transition-all cursor-pointer"
          >
            <WalletIcon size={12} />
            <span>Connect Wallet</span>
          </button>
        )}
      </div>

      {/* Hero Wallet Card */}
      <div className="glass-panel p-6 rounded-[24px] border-white/6 relative overflow-hidden flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.4)]">
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
            <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-semibold mb-0.5">EForce Tokens</span>
            <span className="text-sm font-semibold text-accent-purple flex items-center gap-1 font-display">
              <Clock size={11} /> {eforceTokens.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => showToast('USDT Deposit address: 0x8a9C...92Fb (Binance Smart Chain BEP-20)', 'info')}
          className="h-12 glass-btn rounded-[18px] text-xs font-bold text-white flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(0,0,0,0.15)]"
        >
          <ArrowDownLeft size={14} className="text-accent-cyan" />
          <span>Deposit USDT</span>
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

      {/* Swap Center - Dynamic and Admin Controlled */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-3.5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Swap Portal</span>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-slate-400">Swap Status:</span>
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
              swapOpen 
                ? 'bg-accent-success/15 border-accent-success/20 text-accent-success' 
                : 'bg-accent-danger/15 border-accent-danger/20 text-accent-danger'
            }`}>
              {swapOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>

        {swapOpen ? (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] text-slate-400">
              Convert your mined EForce Points to EForce utility tokens instantly. Current Conversion rate is <span className="text-accent-cyan font-bold">{swapRate} Points = 1 EForce Token</span>.
            </p>
            <button
              onClick={() => setShowSwapModal(true)}
              className="h-10 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Configure Swap Exchange
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center flex flex-col gap-1.5">
            <Lock className="text-slate-500 mx-auto" size={16} />
            <span className="text-xs font-bold text-slate-400">Conversion Swapping Closed</span>
            <p className="text-[10px] text-slate-500">The swap gateway is currently locked by ecosystem administrators.</p>
          </div>
        )}
      </div>

      {/* 6. Token Sale Manager Interface */}
      {tokenSale.active && (
        <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-3.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">EForce Token Sale</span>
            <span className="text-[9px] text-accent-gold font-bold uppercase border border-accent-gold/20 bg-accent-gold/10 px-2 py-0.5 rounded">
              Live ICO
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-xs font-bold text-white">
              <span>Price: ${tokenSale.price} USDT</span>
              <span className="text-accent-purple">
                {((tokenSale.totalSold / tokenSale.totalSupply) * 100).toFixed(1)}% Sold
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
              <div 
                className="h-full bg-gradient-to-r from-accent-purple to-accent-blue rounded-full" 
                style={{ width: `${(tokenSale.totalSold / tokenSale.totalSupply) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-slate-500 font-bold">
              <span>{tokenSale.totalSold.toLocaleString()} EForce</span>
              <span>Max Cap: {tokenSale.totalSupply.toLocaleString()}</span>
            </div>

            <div className="w-full h-[1px] bg-white/5 my-1.5" />

            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Buy with USDT</span>
            <div className="flex gap-2">
              <input
                type="number"
                value={buyUsdtAmount}
                onChange={(e) => setBuyUsdtAmount(e.target.value)}
                placeholder="USDT amount"
                className="flex-1 bg-[#12182D] border border-white/8 text-slate-300 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:border-accent-cyan outline-none"
              />
              <button
                onClick={handleBuyTokens}
                className="px-5 rounded-lg bg-accent-cyan text-bg-primary text-xs font-extrabold shadow hover:bg-accent-cyan/90 transition-all cursor-pointer"
              >
                Purchase
              </button>
            </div>
            <span className="text-[9px] text-slate-500">
              Receive: {(parseFloat(buyUsdtAmount) / tokenSale.price || 0).toLocaleString()} EForce Tokens (Min: ${tokenSale.minPurchase} USDT)
            </span>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-accent-cyan tracking-wider uppercase">Ledger History</span>
          {withdrawRequests.filter(r => r.status === 'Pending').length > 0 && (
            <span className="text-[10px] text-accent-warning font-bold uppercase animate-pulse">
              ({withdrawRequests.filter(r => r.status === 'Pending').length} Pending Node Approval)
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {transactions.map((tx) => (
            <div key={tx.id} className="glass-panel p-4 rounded-[20px] border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border flex items-center justify-center ${
                  tx.type === 'deposit' 
                    ? 'bg-accent-success/10 border-accent-success/20 text-accent-success' 
                    : tx.type === 'withdraw'
                      ? 'bg-accent-danger/10 border-accent-danger/20 text-accent-danger'
                      : tx.type === 'swap'
                        ? 'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan'
                        : 'bg-accent-purple/10 border-accent-purple/20 text-accent-purple'
                }`}>
                  {tx.type === 'deposit' && <ArrowDownLeft size={15} />}
                  {tx.type === 'withdraw' && <ArrowUpRight size={15} />}
                  {tx.type === 'reward' && <Sparkles size={15} />}
                  {tx.type === 'swap' && <Clock size={15} />}
                  {tx.type === 'buy' && <WalletIcon size={15} />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white capitalize">{tx.type} Asset</h4>
                  <span className="text-[10px] text-slate-500">{tx.date}</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-xs font-extrabold font-display ${
                  tx.type === 'deposit' || tx.type === 'reward' || tx.type === 'swap' || tx.type === 'buy' ? 'text-accent-success' : 'text-accent-danger'
                }`}>
                  {tx.type === 'deposit' || tx.type === 'reward' || tx.type === 'swap' || tx.type === 'buy' ? '+' : '-'}{tx.amount} {tx.asset}
                </span>
                <span className="text-[9px] text-slate-500 block">Verified</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connect Wallet Modal */}
      <AnimatePresence>
        {showConnectModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-6 rounded-[28px] border-white/8 w-full max-w-[340px] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <WalletIcon size={16} className="text-accent-cyan" />
                  Connect BEP-20 Wallet
                </h3>
                <button onClick={() => setShowConnectModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
              </div>

              <div className="flex flex-col gap-2.5">
                {['MetaMask', 'Trust Wallet', 'Binance Wallet', 'OKX Wallet', 'TokenPocket'].map((wallet) => (
                  <button
                    key={wallet}
                    onClick={() => handleSelectWallet(wallet)}
                    className="p-3 rounded-xl bg-white/5 border border-white/8 hover:bg-white/10 text-left text-xs font-bold text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>{wallet}</span>
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-slate-500">BEP20 Support</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EForce Swap Modal */}
      <AnimatePresence>
        {showSwapModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-6 rounded-[28px] border-white/8 w-full max-w-[340px] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-white">Perform EForce Token Swap</h3>
                <button onClick={() => setShowSwapModal(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Points to Swap</span>
                  <input
                    type="number"
                    value={swapInputPoints}
                    onChange={(e) => setSwapInputPoints(e.target.value)}
                    className="w-full bg-[#12182D] border border-white/8 text-slate-300 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:border-accent-cyan outline-none"
                  />
                  <span className="text-[9px] text-slate-500">Available: {efcBalance.toLocaleString()} Points</span>
                </div>

                <div className="w-full h-[1px] bg-white/5" />

                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">You will receive</span>
                  <span className="text-sm font-black text-accent-cyan">
                    {(parseInt(swapInputPoints) / swapRate || 0).toLocaleString()} EForce Tokens
                  </span>
                </div>

                <button
                  onClick={handleSwap}
                  className="h-10 rounded-xl bg-gradient-to-r from-accent-purple to-accent-blue text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Confirm Convert Swap
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                <div className="relative w-28 h-28 flex items-center justify-center">
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
                    <rect x="15" y="15" width="70" height="70" rx="14" fill="url(#safeMetal)" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
                    <rect x="23" y="23" width="54" height="54" rx="8" fill="#121522" stroke="rgba(255,255,255,0.05)" />
                    <circle cx="50" cy="50" r="18" fill="url(#safeMetal)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    
                    <motion.g
                      animate={isVerifying ? { rotate: 360 } : isSuccess ? { rotate: 90 } : { rotate: 0 }}
                      transition={isVerifying ? { repeat: Infinity, duration: 1.5, ease: 'linear' } : { duration: 0.5 }}
                      style={{ originX: '50px', originY: '50px' }}
                    >
                      <circle cx="50" cy="50" r="10" fill="none" stroke="url(#accentGlow)" strokeWidth="2.5" strokeDasharray="10 4" />
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
