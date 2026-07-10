import { Copy, ShieldCheck, Trophy, Calendar, Globe2 } from 'lucide-react';
import { getDisplayName, type TelegramUser } from '../lib/telegramUser';

interface ProfileProps {
  efcBalance: number;
  connectedAddress: string | null;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  telegramUser: TelegramUser | null;
}

export const Profile = ({ efcBalance, connectedAddress, showToast, telegramUser }: ProfileProps) => {
  const userAddress = connectedAddress 
    ? `${connectedAddress.slice(0, 8)}...${connectedAddress.slice(-8)}`
    : "No Wallet Connected";

  const handleCopyAddress = () => {
    if (!connectedAddress) {
      showToast("Please connect a wallet first!", "warning");
      return;
    }
    navigator.clipboard.writeText(connectedAddress);
    showToast("Wallet address copied to clipboard!", "success");
  };

  const achievements = [
    { name: "First Mine", desc: "Mined EForce coin for the first time", completed: true, badgeColor: "text-accent-cyan" },
    { name: "Affiliate Recruit", desc: "Invited 5 active members to the force", completed: true, badgeColor: "text-accent-purple" },
    { name: "Node Authorizer", desc: "Unlocked cryptocurrency withdrawal gateway", completed: connectedAddress !== null, badgeColor: connectedAddress !== null ? "text-accent-gold" : "text-slate-500" },
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
          <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#12182D] border border-white/10 flex items-center justify-center text-[10px]" title="Bangladesh">
            🇧🇩
          </div>
        </div>

        {/* User profile tags */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <h2 className="text-base font-bold text-white tracking-tight truncate">{getDisplayName(telegramUser)}</h2>
            <div className="p-0.5 rounded bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan flex items-center justify-center" title="Verified User">
              <ShieldCheck size={11} className="stroke-[2.5]" />
            </div>
            {telegramUser?.isPremium && (
              <span className="text-[8px] font-black uppercase text-accent-gold flex items-center gap-0.5 bg-accent-gold/10 border border-accent-gold/15 px-1.5 py-0.5 rounded">
                👑 Premium
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-medium">
            Node Member #{telegramUser?.id ?? 89741}
          </span>
        </div>
      </div>

      {/* Wallet Connection Node */}
      <div className="glass-panel p-5 rounded-[24px] border-white/6 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">BEP-20 Connected Node</span>
          {connectedAddress ? (
            <span className="text-accent-success font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-success animate-ping"></span>
              Connected
            </span>
          ) : (
            <span className="text-slate-500 font-semibold flex items-center gap-1">
              Disconnected
            </span>
          )}
        </div>

        <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl p-2.5">
          <span className="text-xs font-mono text-slate-400">{userAddress}</span>
          <button
            onClick={handleCopyAddress}
            disabled={!connectedAddress}
            className="p-1.5 rounded-lg bg-white/5 border border-white/8 text-slate-400 hover:text-white transition-all shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Copy size={13} />
          </button>
        </div>
      </div>

      {/* Verification details info */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="glass-panel p-4 rounded-[20px] border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Calendar size={13} />
            <span className="text-[10px] uppercase font-bold tracking-wider">Join Date</span>
          </div>
          <span className="text-xs font-semibold text-white">05 July 2026</span>
        </div>
        <div className="glass-panel p-4 rounded-[20px] border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-slate-500 mb-1">
            <Globe2 size={13} />
            <span className="text-[10px] uppercase font-bold tracking-wider">IP Origin</span>
          </div>
          <span className="text-xs font-semibold text-white">Dhaka, BD</span>
        </div>
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

    </div>
  );
};
