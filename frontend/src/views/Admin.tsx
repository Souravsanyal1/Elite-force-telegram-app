import { useState } from 'react';
import { TrendingUp, Users, Check, X, Search, FileText, Ban } from 'lucide-react';

interface TokenSaleType {
  active: boolean;
  price: number;
  totalSold: number;
  totalSupply: number;
  minPurchase: number;
  maxPurchase: number;
}

interface AdminProps {
  swapOpen: boolean;
  setSwapOpen: (val: boolean) => void;
  swapRate: number;
  setSwapRate: (val: number) => void;
  tokenSale: TokenSaleType;
  setTokenSale: React.Dispatch<React.SetStateAction<TokenSaleType>>;
  withdrawRequests: Array<{ id: string; user: string; amount: number; status: 'Pending' | 'Approved' | 'Rejected' | 'Banned'; date: string }>;
  setWithdrawRequests: React.Dispatch<React.SetStateAction<any[]>>;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  liveUserCount: number;
}

export const Admin: React.FC<AdminProps> = ({ 
  swapOpen,
  setSwapOpen,
  swapRate,
  setSwapRate,
  tokenSale,
  setTokenSale,
  withdrawRequests,
  setWithdrawRequests,
  showToast,
  liveUserCount
}) => {
  const [search, setSearch] = useState('');

  // Local token sale configurator form
  const [icoPrice, setIcoPrice] = useState(tokenSale.price.toString());
  const [icoSupply, setIcoSupply] = useState(tokenSale.totalSupply.toString());

  const handleAction = (requestId: string, action: 'Approved' | 'Rejected' | 'Banned') => {
    setWithdrawRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        if (action === 'Approved') {
          showToast(`Request #${requestId} has been APPROVED! Funds sent.`, 'success');
        } else if (action === 'Rejected') {
          showToast(`Request #${requestId} has been REJECTED.`, 'warning');
        } else if (action === 'Banned') {
          showToast(`User for Request #${requestId} has been BANNED for Sybil activity!`, 'error');
        }
        return { ...req, status: action };
      }
      return req;
    }));
  };

  const handleExport = () => {
    showToast("Generating ledger report: EForce_Withdrawals.csv exported!", "success");
  };

  const filteredRequests = withdrawRequests.filter(req => 
    req.user.toLowerCase().includes(search.toLowerCase()) || 
    req.id.includes(search)
  );

  return (
    <div className="flex flex-col gap-5 pb-28">
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Console</h1>
        <p className="text-xs text-slate-400 mt-1">Global ecosystem parameters and withdrawal processing.</p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="glass-panel p-4 rounded-[20px] border-white/5 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[9px] uppercase font-bold tracking-wider">Total Ecosystem Users</span>
            <Users size={12} />
          </div>
          <span className="text-lg font-black text-white font-display">4,284,912</span>
          <span className="text-[9px] text-accent-success font-semibold flex items-center gap-0.5">
            <TrendingUp size={10} /> +14.2% Today
          </span>
        </div>

        <div className="glass-panel p-4 rounded-[20px] border-white/5 flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-[9px] uppercase font-bold tracking-wider">Online Nodes</span>
            <span className="w-2 h-2 rounded-full bg-accent-success animate-pulse"></span>
          </div>
          <span className="text-lg font-black text-accent-cyan font-display">{liveUserCount.toLocaleString()}</span>
          <span className="text-[9px] text-slate-500 font-semibold">Active Telegram listeners</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-3.5">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Performance Analytics</span>
            <h3 className="text-xs font-bold text-white">Daily Active Nodes & Referrals</h3>
          </div>
          <div className="flex gap-2">
            <span className="text-[8px] bg-accent-cyan/15 border border-accent-cyan/20 px-2 py-0.5 rounded text-accent-cyan font-bold uppercase">
              Nodes
            </span>
            <span className="text-[8px] bg-accent-purple/15 border border-accent-purple/20 px-2 py-0.5 rounded text-accent-purple font-bold uppercase">
              Invites
            </span>
          </div>
        </div>

        {/* Custom SVG Line Chart */}
        <div className="w-full h-32 relative flex items-end">
          <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartCyan" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="#00E5FF" stopOpacity="0"/>
              </linearGradient>
              <linearGradient id="chartPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B388FF" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="#B388FF" stopOpacity="0"/>
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
            <line x1="0" y1="30" x2="100" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

            {/* Cyan Node Area and Line */}
            <path d="M 0 35 Q 20 22 40 28 T 80 12 T 100 8 L 100 40 L 0 40 Z" fill="url(#chartCyan)" />
            <path d="M 0 35 Q 20 22 40 28 T 80 12 T 100 8" fill="none" stroke="#00E5FF" strokeWidth="1.5" strokeLinecap="round" />

            {/* Purple Invite Line */}
            <path d="M 0 38 Q 20 32 40 20 T 80 25 T 100 15 L 100 40 L 0 40 Z" fill="url(#chartPurple)" />
            <path d="M 0 38 Q 20 32 40 20 T 80 25 T 100 15" fill="none" stroke="#B388FF" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="1.5 1" />
          </svg>
          
          {/* Chart labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[8px] text-slate-500 font-bold px-1 pt-1 bg-gradient-to-t from-[#0E1225] to-transparent">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>
      </div>

      {/* Admin Controlled Swap Settings */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-4">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Swap Gateway Controller</span>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-white">Swap Portal Status</span>
            <span className="text-[10px] text-slate-500">Allow users to swap EForce Points to EForce Tokens</span>
          </div>
          <button 
            onClick={() => {
              setSwapOpen(!swapOpen);
              showToast(swapOpen ? "EForce Swap Portal Closed" : "EForce Swap Portal Opened!", "success");
            }}
            className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer duration-300 ${swapOpen ? 'bg-accent-success' : 'bg-white/10'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${swapOpen ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="w-full h-[1px] bg-white/5"></div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-white">Conversion Rate</span>
            <span className="text-[10px] text-slate-500">Number of points needed per 1 EForce Token</span>
          </div>
          <input
            type="number"
            value={swapRate}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val) && val > 0) {
                setSwapRate(val);
              }
            }}
            className="w-20 bg-[#12182D] border border-white/8 text-slate-300 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:border-accent-cyan outline-none text-center"
          />
        </div>
      </div>

      {/* Admin Controlled Token Sale Configurator */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-4">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Token Sale Manager</span>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-white">EForce ICO Status</span>
            <span className="text-[10px] text-slate-500">Toggle public EForce Token crowdsale</span>
          </div>
          <button 
            onClick={() => {
              setTokenSale(prev => ({ ...prev, active: !prev.active }));
              showToast(tokenSale.active ? "Token Sale Closed" : "Token Sale Activated!", "success");
            }}
            className={`w-11 h-6 rounded-full p-1 transition-colors cursor-pointer duration-300 ${tokenSale.active ? 'bg-accent-success' : 'bg-white/10'}`}
          >
            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${tokenSale.active ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        <div className="w-full h-[1px] bg-white/5"></div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">ICO Token Price ($USDT)</span>
            <input
              type="text"
              value={icoPrice}
              onChange={(e) => {
                setIcoPrice(e.target.value);
                const priceNum = parseFloat(e.target.value);
                if (!isNaN(priceNum) && priceNum > 0) {
                  setTokenSale(prev => ({ ...prev, price: priceNum }));
                }
              }}
              className="bg-[#12182D] border border-white/8 text-slate-300 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:border-accent-cyan outline-none text-center"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Total Supply Cap</span>
            <input
              type="text"
              value={icoSupply}
              onChange={(e) => {
                setIcoSupply(e.target.value);
                const capNum = parseInt(e.target.value);
                if (!isNaN(capNum) && capNum > 0) {
                  setTokenSale(prev => ({ ...prev, totalSupply: capNum }));
                }
              }}
              className="bg-[#12182D] border border-white/8 text-slate-300 text-xs font-bold rounded-lg px-2.5 py-1.5 focus:border-accent-cyan outline-none text-center"
            />
          </div>
        </div>
      </div>

      {/* Withdraw requests manager table */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Withdraw Requests</span>
          <button 
            onClick={handleExport}
            className="flex items-center gap-1 text-[9px] text-accent-cyan font-bold bg-accent-cyan/10 border border-accent-cyan/15 rounded px-2.5 py-1 hover:bg-accent-cyan/20 cursor-pointer"
          >
            <FileText size={10} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-2.5 py-1.5">
          <Search size={12} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search by ID or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-[11px] text-slate-300 w-full placeholder-slate-500"
          />
        </div>

        {/* Table Rows */}
        <div className="flex flex-col gap-2 mt-1">
          {filteredRequests.map((req) => (
            <div 
              key={req.id} 
              className={`glass-panel p-3.5 rounded-[18px] border-white/5 flex items-center justify-between transition-all duration-300 ${
                req.status === 'Approved' 
                  ? 'border-accent-success/15 bg-accent-success/[0.005]' 
                  : req.status === 'Rejected'
                    ? 'border-accent-warning/15 bg-accent-warning/[0.005]'
                    : req.status === 'Banned'
                      ? 'border-accent-danger/15 bg-accent-danger/[0.005] opacity-50'
                      : ''
              }`}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-slate-500 font-mono">#{req.id}</span>
                  <span className="text-xs font-bold text-white truncate max-w-[120px]">{req.user}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-semibold text-accent-usdt">${req.amount} USDT</span>
                  <span className="text-[9px] text-slate-500">{req.date}</span>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-1.5">
                {req.status === 'Pending' ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleAction(req.id, 'Approved')}
                      className="p-1.5 rounded-lg bg-accent-success/15 border border-accent-success/20 text-accent-success hover:bg-accent-success/30 active:scale-90 transition-all cursor-pointer"
                      title="Approve & Send"
                    >
                      <Check size={11} className="stroke-[3]" />
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'Rejected')}
                      className="p-1.5 rounded-lg bg-accent-warning/15 border border-accent-warning/20 text-accent-warning hover:bg-accent-warning/30 active:scale-90 transition-all cursor-pointer"
                      title="Reject"
                    >
                      <X size={11} className="stroke-[3]" />
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'Banned')}
                      className="p-1.5 rounded-lg bg-accent-danger/15 border border-accent-danger/20 text-accent-danger hover:bg-accent-danger/30 active:scale-90 transition-all cursor-pointer"
                      title="Ban User"
                    >
                      <Ban size={11} />
                    </button>
                  </div>
                ) : (
                  <span className={`text-[9px] px-2 py-0.5 font-bold uppercase tracking-wider rounded border ${
                    req.status === 'Approved' 
                      ? 'bg-accent-success/10 border-accent-success/20 text-accent-success' 
                      : req.status === 'Rejected'
                        ? 'bg-accent-warning/10 border-accent-warning/20 text-accent-warning'
                        : 'bg-accent-danger/10 border-accent-danger/20 text-accent-danger'
                  }`}>
                    {req.status}
                  </span>
                )}
              </div>
            </div>
          ))}

          {filteredRequests.length === 0 && (
            <div className="text-center py-6 text-slate-500 text-xs">
              No matching withdrawal requests found.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
