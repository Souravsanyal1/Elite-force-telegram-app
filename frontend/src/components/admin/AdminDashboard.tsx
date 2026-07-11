import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Users, Zap, TrendingUp, Star, Activity } from 'lucide-react';
import { VerifiedBadge } from '../VerifiedBadge';

interface AdminDashboardProps {
  kpi: {
    total: number; online: number; premium: number;
    newToday: number; flagged: number; banned: number; autoMiners: number;
  };
  loadingKpi: boolean;
  liveUserCount: number;
  withdrawals: any[];
  usersList: any[];
  onRefresh: () => void;
  eforceTokenValue: number;
}

const COUNTRY_COLORS = ['#FF8A00', '#00E5FF', '#B388FF', '#4CAF50', '#FFD700', '#FF5252'];

const generateGrowthData = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    days.push({
      date: label,
      users: Math.floor(Math.random() * 500 + 800),
      newUsers: Math.floor(Math.random() * 120 + 20),
    });
  }
  return days;
};

const GROWTH_DATA = generateGrowthData();

const COUNTRY_DATA = [
  { name: 'Bangladesh', value: 45.2 },
  { name: 'India', value: 18.7 },
  { name: 'Indonesia', value: 10.3 },
  { name: 'Philippines', value: 6.8 },
  { name: 'Brazil', value: 4.3 },
  { name: 'Others', value: 14.7 },
];

const KpiCard: React.FC<{ label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string; loading: boolean }> = ({
  label, value, sub, icon, color, loading
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-[18px] p-4 flex flex-col gap-2 relative overflow-hidden"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
  >
    <div className="flex items-center justify-between">
      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">{label}</span>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`} style={{ background: 'rgba(255,255,255,0.06)' }}>
        {icon}
      </div>
    </div>
    <span className="text-2xl font-black text-white">
      {loading ? <span className="text-slate-600 text-sm">Loading...</span> : value.toLocaleString()}
    </span>
    {sub && <span className="text-[9px] text-slate-500">{sub}</span>}
  </motion.div>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  kpi, loadingKpi, liveUserCount, withdrawals, usersList, onRefresh, eforceTokenValue
}) => {
  void onRefresh;
  const pending = withdrawals.filter(w => w.status === 'Pending');
  const recentUsers = [...usersList].slice(0, 5);
  const flaggedUsers = usersList.filter(u => u.flagCount > 0).slice(0, 5);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0D1117] border border-white/10 rounded-xl p-3 text-[10px]">
          <p className="text-slate-400 mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {p.value.toLocaleString()}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-4">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Total Users" value={kpi.total} icon={<Users size={13} className="text-[#FF8A00]" />} color="text-[#FF8A00]" loading={loadingKpi} sub="Registered" />
        <KpiCard label="Online Now" value={liveUserCount || kpi.online} icon={<Activity size={13} className="text-green-400" />} color="text-green-400" loading={loadingKpi} sub="● Live" />
        <KpiCard label="Tg Premium" value={kpi.premium} icon={<Star size={13} className="text-accent-cyan" />} color="text-accent-cyan" loading={loadingKpi} sub={`${kpi.total > 0 ? ((kpi.premium / kpi.total) * 100).toFixed(1) : 0}% of total`} />
        <KpiCard label="New Today" value={kpi.newToday} icon={<TrendingUp size={13} className="text-accent-purple" />} color="text-accent-purple" loading={loadingKpi} sub="Joined today" />
        <KpiCard label="Auto Miners" value={kpi.autoMiners} icon={<Zap size={13} className="text-yellow-400" />} color="text-yellow-400" loading={loadingKpi} sub="Active sessions" />
        <KpiCard label="EF Token" value={`$${eforceTokenValue}`} icon={<TrendingUp size={13} className="text-[#FF8A00]" />} color="text-[#FF8A00]" loading={false} sub="USD Value" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* User Growth Chart */}
        <div className="xl:col-span-2 rounded-[20px] p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-white">User Growth</span>
            <span className="text-[9px] text-slate-500 bg-white/5 border border-white/8 px-2 py-1 rounded-lg">Last 7 Days</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={GROWTH_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="users" name="Total Users" stroke="#FF8A00" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="newUsers" name="New Users" stroke="#00E5FF" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Country Donut */}
        <div className="rounded-[20px] p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs font-bold text-white block mb-3">Users by Country</span>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={COUNTRY_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
                {COUNTRY_DATA.map((_, index) => (
                  <Cell key={index} fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => `${v}%`} contentStyle={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1 mt-2">
            {COUNTRY_DATA.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: COUNTRY_COLORS[i] }} />
                  <span className="text-slate-400">{c.name}</span>
                </div>
                <span className="text-white font-bold">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent Users */}
        <div className="rounded-[20px] p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs font-bold text-white block mb-3">Recent Users</span>
          <div className="flex flex-col gap-2">
            {recentUsers.length === 0 ? (
              <div className="text-[10px] text-slate-500 text-center py-4">No users yet</div>
            ) : recentUsers.map((u: any) => (
              <div key={u.telegramId} className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF8A00]/30 to-[#FFB347]/20 flex items-center justify-center text-[9px] font-bold text-[#FF8A00] shrink-0">
                  {(u.firstName?.[0] ?? 'U').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold text-white truncate">{u.firstName} {u.lastName}</span>
                    <VerifiedBadge size={9} />
                  </div>
                  <span className="text-[8px] text-slate-500">@{u.username || 'no_username'}</span>
                </div>
                <span className="text-[8px] font-bold text-green-400 shrink-0">● Online</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Withdrawals */}
        <div className="rounded-[20px] p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs font-bold text-white block mb-3">Recent Withdrawals</span>
          <div className="flex flex-col gap-2">
            {pending.length === 0 ? (
              <div className="text-[10px] text-slate-500 text-center py-4">No pending requests</div>
            ) : pending.slice(0, 5).map((req: any) => (
              <div key={req.id} className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center text-[9px] font-bold text-yellow-400 shrink-0">
                  $
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-white block truncate">@{req.username || req.telegramId}</span>
                  <span className="text-[8px] text-slate-500">BEP-20</span>
                </div>
                <span className="text-[9px] font-black text-yellow-400 shrink-0">Pending</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flagged Users */}
        <div className="rounded-[20px] p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-xs font-bold text-white block mb-3">Flagged Users</span>
          <div className="flex flex-col gap-2">
            {flaggedUsers.length === 0 ? (
              <div className="text-[10px] text-slate-500 text-center py-4">✅ No flagged users</div>
            ) : flaggedUsers.map((u: any) => (
              <div key={u.telegramId} className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[9px] shrink-0">
                  🚩
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-white block truncate">@{u.username || 'unknown'}</span>
                  <span className="text-[8px] text-slate-500">{u.riskLevel ?? 'medium'} risk</span>
                </div>
                <span className="text-[8px] font-black text-red-400 shrink-0">🚩{u.flagCount}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Auto Miner Users', value: kpi.autoMiners, icon: '⛏️' },
          { label: 'Pending Withdrawals', value: pending.length, icon: '💸' },
          { label: 'Flagged Users', value: kpi.flagged, icon: '🚩' },
          { label: 'Banned Users', value: kpi.banned, icon: '🚫' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 p-3 rounded-[14px]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-lg">{item.icon}</span>
            <div>
              <div className="text-sm font-black text-white">{loadingKpi ? '-' : item.value}</div>
              <div className="text-[8px] text-slate-500">{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div className="flex items-center justify-between p-3.5 rounded-[14px]" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
        <span className="text-[10px] font-bold text-white">System Status</span>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_rgba(74,222,128,0.8)]" />
          <span className="text-[10px] text-green-400 font-semibold">All Systems Operational</span>
        </div>
      </div>

    </div>
  );
};
