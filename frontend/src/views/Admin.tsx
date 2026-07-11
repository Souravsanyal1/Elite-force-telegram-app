import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timestamp } from 'firebase/firestore';
import {
  Check, X, Search, Ban, Edit3, Save,
  RefreshCw, Plus, Trash2, ToggleLeft, ToggleRight,
  Star, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ArrowUpDown,
} from 'lucide-react';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import type { AdminTab } from '../components/admin/AdminSidebar';
import {
  getAllUsers, updateUserDatabaseValues, getTotalUserCount,
  getTodayNewUsersCount, getFlaggedUsersCount, getBannedUsersCount,
  getPremiumUsersCount, getAutoMinerUsersCount, getOnlineUserCount,
  updateWithdrawRequest, subscribeToWithdrawRequests,
  flagUser, adminSetBan, type FirestoreUser,
} from '../lib/userService';
import {
  subscribeToTasks, createTask, updateTask, deleteTask, type EForceTask, type TaskType,
} from '../lib/taskService';
import {
  subscribeToAdminSettings, saveAdminSettings, DEFAULT_ADMIN_SETTINGS, type AdminSettings,
} from '../lib/adminSettingsService';

interface AdminProps {
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  liveUserCount: number;
}

type SortField = 'points' | 'tokens' | 'firstName' | 'referrals';
type SortDir = 'asc' | 'desc';
type UserFilter = 'all' | 'online' | 'premium' | 'flagged' | 'banned';

const PAGE_SIZE = 10;

const inputCls = "w-full h-9 rounded-xl px-3 text-xs text-white outline-none transition-all focus:ring-1 focus:ring-[#FF8A00]/50";
const inputStyle = { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' };
const panelStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' };

export const Admin: React.FC<AdminProps> = ({ showToast, liveUserCount }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Dashboard KPIs ---
  const [kpi, setKpi] = useState({ total: 0, online: 0, premium: 0, normal: 0, newToday: 0, flagged: 0, banned: 0, autoMiners: 0 });
  const [loadingKpi, setLoadingKpi] = useState(true);

  const fetchKpis = async () => {
    setLoadingKpi(true);
    const [total, online, premium, newToday, flagged, banned, autoMiners] = await Promise.all([
      getTotalUserCount(), getOnlineUserCount(), getPremiumUsersCount(),
      getTodayNewUsersCount(), getFlaggedUsersCount(), getBannedUsersCount(), getAutoMinerUsersCount(),
    ]);
    setKpi({ total, online, premium, normal: Math.max(0, total - premium), newToday, flagged, banned, autoMiners });
    setLoadingKpi(false);
  };

  useEffect(() => { fetchKpis(); const t = setInterval(fetchKpis, 30000); return () => clearInterval(t); }, []);

  // --- Users ---
  const [usersList, setUsersList] = useState<FirestoreUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [sortField, setSortField] = useState<SortField>('points');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<FirestoreUser | null>(null);
  const [editPoints, setEditPoints] = useState(0);
  const [editTokens, setEditTokens] = useState(0);
  const [editWallet, setEditWallet] = useState(0);
  const [editReferrals, setEditReferrals] = useState(0);
  const [editRiskLevel, setEditRiskLevel] = useState<'safe' | 'medium' | 'high'>('safe');
  const [editBanStatus, setEditBanStatus] = useState<'none' | 'temp' | 'permanent'>('none');
  const [editBanDuration, setEditBanDuration] = useState<number>(24);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingUser, setSavingUser] = useState(false);

  const fetchUsers = async () => { setLoadingUsers(true); const u = await getAllUsers(); setUsersList(u); setLoadingUsers(false); };
  useEffect(() => { fetchUsers(); }, []);

  const startEditUser = (u: FirestoreUser) => {
    setEditingUser(u); setEditPoints(u.points ?? 0); setEditTokens(u.tokens ?? 0);
    setEditWallet(u.wallet ?? 0); setEditReferrals(u.referrals ?? 0);
    setEditRiskLevel(u.riskLevel ?? 'safe'); setEditBanStatus(u.banStatus ?? 'none');
    if (u.banStatus === 'temp' && u.banUntil) {
      const until = u.banUntil instanceof Timestamp ? u.banUntil.toDate() : new Date(u.banUntil as string);
      const diffHrs = Math.max(1, Math.round((until.getTime() - Date.now()) / 3600000));
      setEditBanDuration(diffHrs >= 72 ? 72 : diffHrs >= 48 ? 48 : 24);
    } else setEditBanDuration(24);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return; setSavingUser(true);
    let banUntil = null;
    if (editBanStatus === 'temp') banUntil = Timestamp.fromDate(new Date(Date.now() + editBanDuration * 3600000));
    const ok = await updateUserDatabaseValues(editingUser.telegramId, { points: editPoints, tokens: editTokens, wallet: editWallet, referrals: editReferrals, riskLevel: editRiskLevel, banStatus: editBanStatus, banUntil });
    setSavingUser(false);
    ok ? (showToast(`✅ ${editingUser.firstName} updated.`, 'success'), fetchUsers(), setEditingUser(null)) : showToast('Error updating user.', 'error');
  };

  const handleFlagUser = async (u: FirestoreUser) => { await flagUser(u.telegramId, 'Manual flag by admin'); showToast(`🚩 ${u.firstName} flagged.`, 'warning'); fetchUsers(); };
  const handleBanUser = async (u: FirestoreUser) => { await adminSetBan(u.telegramId, 'permanent'); showToast(`🚫 ${u.firstName} banned.`, 'error'); fetchUsers(); };
  const handleUnbanUser = async (u: FirestoreUser) => { await adminSetBan(u.telegramId, 'none'); showToast(`✅ ${u.firstName} unbanned.`, 'success'); fetchUsers(); };

  // Sort and filter logic
  const handleSort = (field: SortField) => { if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('desc'); } setPage(1); };

  const processedUsers = useMemo(() => {
    let list = [...usersList];
    const q = userSearch.toLowerCase();
    if (q) list = list.filter(u => u.firstName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || String(u.telegramId).includes(q));
    switch (userFilter) {
      case 'premium': list = list.filter(u => u.isTelegramPremium); break;
      case 'flagged': list = list.filter(u => u.flagCount > 0); break;
      case 'banned': list = list.filter(u => u.banStatus !== 'none'); break;
      case 'online': list = list.filter(u => u.isOnline); break;
    }
    list.sort((a, b) => {
      const av = (a as any)[sortField] ?? 0;
      const bv = (b as any)[sortField] ?? 0;
      if (typeof av === 'string') return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [usersList, userSearch, userFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processedUsers.length / PAGE_SIZE));
  const pagedUsers = processedUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // --- Tasks ---
  const [tasks, setTasks] = useState<EForceTask[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<EForceTask | null>(null);
  const blankTask = { title: '', description: '', type: 'channel' as TaskType, reward: 500, tokenReward: 0, url: '', dailyLimit: 0, totalCompletionLimit: 0, expiryDate: '', isEnabled: true, autoApprove: true };
  const [taskForm, setTaskForm] = useState(blankTask);
  useEffect(() => { const unsub = subscribeToTasks(setTasks); return unsub; }, []);
  const handleSaveTask = async () => {
    const d = { ...taskForm, expiryDate: taskForm.expiryDate || null };
    editingTask ? (await updateTask(editingTask.id, d) ? showToast('Task updated.', 'success') : showToast('Failed.', 'error'))
      : (await createTask(d) ? showToast('Task created.', 'success') : showToast('Failed.', 'error'));
    setShowTaskForm(false); setEditingTask(null); setTaskForm(blankTask);
  };
  const handleDeleteTask = async (t: EForceTask) => { await deleteTask(t.id) ? showToast('Deleted.', 'success') : showToast('Failed.', 'error'); };
  const handleToggleTask = async (t: EForceTask) => { await updateTask(t.id, { isEnabled: !t.isEnabled }); showToast(`Task ${t.isEnabled ? 'disabled' : 'enabled'}.`, 'info'); };
  const startEditTask = (t: EForceTask) => { setEditingTask(t); setTaskForm({ title: t.title, description: t.description, type: t.type, reward: t.reward, tokenReward: t.tokenReward, url: t.url, dailyLimit: t.dailyLimit, totalCompletionLimit: t.totalCompletionLimit, expiryDate: t.expiryDate || '', isEnabled: t.isEnabled, autoApprove: t.autoApprove }); setShowTaskForm(true); };

  // --- Withdrawals ---
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawFilter, setWithdrawFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected' | 'Banned'>('Pending');
  useEffect(() => { const unsub = subscribeToWithdrawRequests(setWithdrawals); return unsub; }, []);
  const handleWithdrawAction = async (id: string, status: 'Approved' | 'Rejected' | 'Banned') => {
    const ok = await updateWithdrawRequest(id, status);
    ok ? showToast(`Request ${status}.`, status === 'Approved' ? 'success' : 'warning') : showToast('Update failed.', 'error');
  };

  // --- Settings ---
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  useEffect(() => { const unsub = subscribeToAdminSettings(setSettings); return unsub; }, []);
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const ok = await saveAdminSettings(settings);
    setSavingSettings(false);
    ok ? showToast('⚙️ Settings saved.', 'success') : showToast('Failed.', 'error');
  };

  const SortBtn = ({ field, label }: { field: SortField; label: string }) => (
    <button onClick={() => handleSort(field)} className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-all cursor-pointer group">
      {label}
      {sortField === field ? (sortDir === 'asc' ? <ChevronUp size={10} className="text-[#FF8A00]" /> : <ChevronDown size={10} className="text-[#FF8A00]" />) : <ArrowUpDown size={9} className="opacity-30 group-hover:opacity-60" />}
    </button>
  );

  const filterCounts: Record<UserFilter, number> = {
    all: usersList.length,
    online: usersList.filter(u => u.isOnline).length,
    premium: usersList.filter(u => u.isTelegramPremium).length,
    flagged: usersList.filter(u => u.flagCount > 0).length,
    banned: usersList.filter(u => u.banStatus !== 'none').length,
  };

  const visibleFrom = processedUsers.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const visibleTo = Math.min(page * PAGE_SIZE, processedUsers.length);
  const activeFilters = [
    userFilter !== 'all' ? userFilter : null,
    userSearch ? 'search' : null,
  ].filter(Boolean).length;

  // ============ RENDER ============
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#080C14' }}>
      <AdminSidebar activeTab={activeTab} setActiveTab={tab => { setActiveTab(tab); setPage(1); }} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} eforceTokenValue={settings.eforceTokenValue} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader activeTab={activeTab} onMenuClick={() => setSidebarOpen(true)} pendingCount={withdrawals.filter(w => w.status === 'Pending').length} flaggedCount={kpi.flagged} onRefresh={fetchKpis} isRefreshing={loadingKpi} />

        <main className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>

          {/* ===== DASHBOARD ===== */}
          {activeTab === 'dashboard' && (
            <AdminDashboard kpi={kpi} loadingKpi={loadingKpi} liveUserCount={liveUserCount} withdrawals={withdrawals} usersList={usersList} onRefresh={fetchKpis} eforceTokenValue={settings.eforceTokenValue} />
          )}

          {/* ===== USERS — Advanced Table ===== */}
          {activeTab === 'users' && (
            <div className="flex flex-col gap-4">
              <div className="rounded-[24px] p-5 md:p-6 flex flex-col gap-5 glass-panel">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm md:text-base font-black text-white">User Management</h2>
                      <span className="text-[9px] font-black uppercase tracking-[0.22em] px-2.5 py-1 rounded-full bg-[#FF8A00]/10 text-[#FFB347] border border-[#FF8A00]/20">
                        Live roster
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 max-w-2xl">
                      Search, review, and moderate users from one place. Use filters to isolate online, premium, flagged, or banned accounts.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full xl:w-auto xl:min-w-[520px]">
                    {[
                      { label: 'Total', value: usersList.length, tone: 'text-white', border: 'rgba(255,255,255,0.08)', bg: 'rgba(255,255,255,0.04)' },
                      { label: 'Online', value: filterCounts.online, tone: 'text-green-400', border: 'rgba(74,222,128,0.18)', bg: 'rgba(74,222,128,0.08)' },
                      { label: 'Flagged', value: filterCounts.flagged, tone: 'text-yellow-400', border: 'rgba(234,179,8,0.18)', bg: 'rgba(234,179,8,0.08)' },
                      { label: 'Banned', value: filterCounts.banned, tone: 'text-red-400', border: 'rgba(248,113,113,0.18)', bg: 'rgba(248,113,113,0.08)' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-2xl px-3 py-2.5" style={{ background: stat.bg, border: `1px solid ${stat.border}` }}>
                        <div className={`text-lg font-black leading-none ${stat.tone}`}>{stat.value.toLocaleString()}</div>
                        <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      value={userSearch}
                      onChange={e => { setUserSearch(e.target.value); setPage(1); }}
                      placeholder="Search name, username, Telegram ID..."
                      className="w-full pl-9 pr-10 h-11 rounded-2xl text-xs md:text-sm text-white outline-none transition-all"
                      style={inputStyle}
                    />
                    {userSearch && (
                      <button
                        onClick={() => { setUserSearch(''); setPage(1); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white transition-all"
                        aria-label="Clear search"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={fetchUsers}
                    className="h-11 px-5 rounded-2xl text-xs font-bold text-white flex items-center gap-2 shrink-0 transition-all hover:opacity-90"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <RefreshCw size={12} className={loadingUsers ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex gap-2 flex-wrap">
                    {(['all', 'online', 'premium', 'flagged', 'banned'] as UserFilter[]).map(f => (
                      <button
                        key={f}
                        onClick={() => { setUserFilter(f); setPage(1); }}
                        className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[10px] font-bold capitalize transition-all cursor-pointer ${
                          userFilter === f ? 'text-white shadow-[0_0_12px_rgba(255,138,0,0.28)]' : 'text-slate-400 hover:text-white'
                        }`}
                        style={{
                          background: userFilter === f ? 'linear-gradient(135deg,#FF8A00,#FFB347)' : 'rgba(255,255,255,0.05)',
                          border: userFilter === f ? 'none' : '1px solid rgba(255,255,255,0.08)'
                        }}
                      >
                        {f === 'online' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />}
                        {f === 'premium' && <Star size={9} className="fill-current" />}
                        {f === 'flagged' && '🚩'}
                        {f === 'banned' && '🚫'}
                        {f} <span className="opacity-60">({filterCounts[f]})</span>
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {activeFilters > 0 ? `${activeFilters} filter${activeFilters > 1 ? 's' : ''} active` : 'Showing all users'}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] overflow-hidden glass-panel">
                <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">Users</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/8">
                      {processedUsers.length.toLocaleString()} total
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {visibleFrom === 0 ? 'No results' : `Showing ${visibleFrom}–${visibleTo}`}
                  </span>
                </div>

                <div
                  className="grid items-center gap-2 px-4 md:px-5 py-3 border-b sticky top-0 z-10 backdrop-blur"
                  style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(10,14,24,0.92)', gridTemplateColumns: '2.5rem 1fr 8rem 7rem 6rem 7rem 9rem' }}
                >
                  <div />
                  <SortBtn field="firstName" label="User" />
                  <SortBtn field="points" label="Points" />
                  <SortBtn field="tokens" label="Tokens" />
                  <SortBtn field="referrals" label="Refs" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Status</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</span>
                </div>

                {loadingUsers ? (
                  <div className="flex flex-col gap-0">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="grid items-center gap-2 px-4 md:px-5 py-3.5 border-b border-white/[0.03]" style={{ gridTemplateColumns: '2.5rem 1fr 8rem 7rem 6rem 7rem 9rem' }}>
                        <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
                        <div className="space-y-1.5"><div className="h-3 w-24 bg-white/5 rounded animate-pulse" /><div className="h-2 w-16 bg-white/[0.03] rounded animate-pulse" /></div>
                        {Array.from({ length: 5 }).map((_, j) => <div key={j} className="h-3 bg-white/[0.03] rounded animate-pulse" />)}
                      </div>
                    ))}
                  </div>
                ) : pagedUsers.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs px-6">No users match your filters.</div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div key={`${userFilter}-${page}-${sortField}-${sortDir}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                      {pagedUsers.map((u, idx) => (
                        <React.Fragment key={u.telegramId}>
                          <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="grid items-center gap-2 px-4 md:px-5 py-4 border-b transition-all hover:bg-white/[0.025] group cursor-default"
                            style={{ borderColor: 'rgba(255,255,255,0.04)', gridTemplateColumns: '2.5rem 1fr 8rem 7rem 6rem 7rem 9rem' }}
                          >
                            <div className="relative">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-[#FF8A00]" style={{ background: 'rgba(255,138,0,0.12)', border: '1px solid rgba(255,138,0,0.2)' }}>
                                {(u.firstName?.[0] ?? 'U').toUpperCase()}
                              </div>
                              {u.isOnline && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-[#080C14] shadow-[0_0_5px_rgba(74,222,128,0.8)]" />}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-white truncate max-w-[120px]">{u.firstName} {u.lastName}</span>
                                <VerifiedBadge size={10} />
                                {u.isTelegramPremium && <Star size={10} className="text-[#00E5FF] fill-current shrink-0" />}
                                {u.banStatus !== 'none' && <span className="text-[7px] font-black text-red-400 bg-red-400/10 border border-red-400/20 px-1.5 py-0.5 rounded uppercase">Banned</span>}
                                {u.flagCount > 0 && <span className="text-[7px] font-black text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 rounded">🚩{u.flagCount}</span>}
                              </div>
                              <span className="text-[9px] text-slate-500">@{u.username || 'no_username'} • {u.telegramId}</span>
                            </div>

                            <div>
                              <span className="text-xs font-black text-[#FF8A00]">{(u.points || 0).toLocaleString()}</span>
                              <div className="text-[8px] uppercase tracking-[0.18em] text-slate-600">Points</div>
                            </div>

                            <div>
                              <span className="text-xs font-semibold text-slate-300">{(u.tokens || 0).toLocaleString()}</span>
                              <div className="text-[8px] uppercase tracking-[0.18em] text-slate-600">Tokens</div>
                            </div>

                            <div>
                              <span className="text-xs font-semibold text-[#B388FF]">{u.referrals || 0}</span>
                              <div className="text-[8px] uppercase tracking-[0.18em] text-slate-600">Refs</div>
                            </div>

                            <div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${u.banStatus !== 'none' ? 'text-red-400 bg-red-400/10' : u.isOnline ? 'text-green-400 bg-green-400/10' : 'text-slate-500 bg-white/5'}`}>
                                {u.banStatus !== 'none' ? '🚫 Banned' : u.isOnline ? '● Online' : '○ Offline'}
                              </span>
                            </div>

                            <div className="flex items-center justify-end gap-1.5">
                              <button onClick={() => startEditUser(u)} title="Edit" className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/8 transition-all cursor-pointer">
                                <Edit3 size={11} />
                              </button>
                              <button onClick={() => handleFlagUser(u)} title="Flag" className="w-7 h-7 rounded-lg flex items-center justify-center text-yellow-500 hover:bg-yellow-400/10 transition-all cursor-pointer text-[11px]">
                                🚩
                              </button>
                              {u.banStatus !== 'none' ? (
                                <button onClick={() => handleUnbanUser(u)} title="Unban" className="w-7 h-7 rounded-lg flex items-center justify-center text-green-400 hover:bg-green-400/10 transition-all cursor-pointer">
                                  <Check size={11} />
                                </button>
                              ) : (
                                <button onClick={() => handleBanUser(u)} title="Ban" className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-400/10 transition-all cursor-pointer">
                                  <Ban size={11} />
                                </button>
                              )}
                            </div>
                          </motion.div>

                          <AnimatePresence>
                            {editingUser?.telegramId === u.telegramId && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: 'easeOut' }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 md:px-5 py-4 border-b flex flex-col gap-3" style={{ borderColor: 'rgba(255,138,0,0.15)', background: 'rgba(255,138,0,0.04)' }}>
                                  <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div>
                                      <div className="text-xs font-black text-white">Edit profile</div>
                                      <div className="text-[9px] text-slate-500">@{u.username || 'no_username'} • ID {u.telegramId}</div>
                                    </div>
                                    <div className="text-[9px] text-slate-400">
                                      Risk: <span className="font-bold text-[#FFB347] uppercase">{editRiskLevel}</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {[
                                      { label: 'Points', val: editPoints, set: setEditPoints },
                                      { label: 'Tokens', val: editTokens, set: setEditTokens },
                                      { label: 'Wallet', val: editWallet, set: setEditWallet },
                                      { label: 'Referrals', val: editReferrals, set: setEditReferrals },
                                    ].map(f => (
                                      <div key={f.label}>
                                        <label className="text-[8px] text-slate-500 font-bold uppercase block mb-1">{f.label}</label>
                                        <input type="number" value={f.val} onChange={e => f.set(Number(e.target.value))} className={inputCls} style={inputStyle} />
                                      </div>
                                    ))}
                                  </div>

                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    <div>
                                      <label className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Risk Level</label>
                                      <select value={editRiskLevel} onChange={e => setEditRiskLevel(e.target.value as any)} className={inputCls + ' cursor-pointer'} style={{ ...inputStyle, background: '#0D1117' }}>
                                        <option value="safe">Safe</option><option value="medium">Medium</option><option value="high">High</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Ban Status</label>
                                      <select value={editBanStatus} onChange={e => setEditBanStatus(e.target.value as any)} className={inputCls + ' cursor-pointer'} style={{ ...inputStyle, background: '#0D1117' }}>
                                        <option value="none">None</option><option value="temp">Temp</option><option value="permanent">Permanent</option>
                                      </select>
                                    </div>
                                    {editBanStatus === 'temp' && (
                                      <div>
                                        <label className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Duration (h)</label>
                                        <select value={editBanDuration} onChange={e => setEditBanDuration(Number(e.target.value))} className={inputCls + ' cursor-pointer'} style={{ ...inputStyle, background: '#0D1117' }}>
                                          <option value={24}>24h</option><option value={48}>48h</option><option value={72}>72h</option>
                                        </select>
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex gap-2">
                                    <button onClick={handleSaveUser} disabled={savingUser} className="flex-1 h-10 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all" style={{ background: 'linear-gradient(135deg,#FF8A00,#FFB347)' }}>
                                      {savingUser ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Save Changes
                                    </button>
                                    <button onClick={() => setEditingUser(null)} className="h-10 px-4 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}

                <div className="flex items-center justify-between gap-3 px-4 md:px-5 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-[10px] text-slate-500">
                    Showing {visibleFrom}–{visibleTo} of <span className="text-white font-bold">{processedUsers.length}</span> users
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <ChevronLeft size={13} />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                      return (
                        <button key={p} onClick={() => setPage(p)} className="w-7 h-7 rounded-lg text-[10px] font-bold cursor-pointer transition-all" style={{ background: p === page ? 'linear-gradient(135deg,#FF8A00,#FFB347)' : 'rgba(255,255,255,0.05)', border: p === page ? 'none' : '1px solid rgba(255,255,255,0.08)', color: p === page ? '#fff' : '#64748b' }}>
                          {p}
                        </button>
                      );
                    })}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white disabled:opacity-30 transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== TASKS ===== */}
          {activeTab === 'tasks' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-black text-white">Tasks <span className="text-slate-600 text-xs font-normal">({tasks.length})</span></h2>
                  <p className="text-[9px] text-slate-500">Create and manage EForce earning tasks</p>
                </div>
                <button onClick={() => { setShowTaskForm(true); setEditingTask(null); setTaskForm(blankTask); }} className="h-9 px-4 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg,#FF8A00,#FFB347)', boxShadow: '0 0 18px rgba(255,138,0,0.35)' }}>
                  <Plus size={13} /> New Task
                </button>
              </div>

              <AnimatePresence>
                {showTaskForm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="rounded-[20px] p-5 flex flex-col gap-4" style={{ background: 'rgba(255,138,0,0.04)', border: '1px solid rgba(255,138,0,0.2)' }}>
                      <span className="text-xs font-black text-[#FF8A00]">{editingTask ? '✏️ Edit Task' : '➕ New Task'}</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div><label className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Title</label><input type="text" value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))} className={inputCls} style={inputStyle} /></div>
                        <div><label className="text-[8px] text-slate-500 font-bold uppercase block mb-1">URL</label><input type="text" value={taskForm.url} onChange={e => setTaskForm(p => ({ ...p, url: e.target.value }))} className={inputCls} style={inputStyle} /></div>
                      </div>
                      <div><label className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Description</label><textarea value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full rounded-xl px-3 py-2 text-xs text-white outline-none resize-none" style={inputStyle} /></div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[{ label: 'Reward (EF)', key: 'reward' }, { label: 'Token Reward', key: 'tokenReward' }, { label: 'Daily Limit', key: 'dailyLimit' }, { label: 'Total Limit', key: 'totalCompletionLimit' }].map(f => (
                          <div key={f.key}><label className="text-[8px] text-slate-500 font-bold uppercase block mb-1">{f.label}</label><input type="number" value={(taskForm as any)[f.key]} onChange={e => setTaskForm(p => ({ ...p, [f.key]: Number(e.target.value) }))} className={inputCls + ' text-right'} style={inputStyle} /></div>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div><label className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Type</label><select value={taskForm.type} onChange={e => setTaskForm(p => ({ ...p, type: e.target.value as TaskType }))} className={inputCls + ' cursor-pointer'} style={{ ...inputStyle, background: '#0D1117' }}><option value="channel">Channel</option><option value="youtube">YouTube</option><option value="twitter">Twitter</option><option value="website">Website</option><option value="daily">Daily</option></select></div>
                        <div><label className="text-[8px] text-slate-500 font-bold uppercase block mb-1">Expiry Date</label><input type="date" value={taskForm.expiryDate} onChange={e => setTaskForm(p => ({ ...p, expiryDate: e.target.value }))} className={inputCls} style={inputStyle} /></div>
                        <div className="flex gap-4 items-center pt-4">
                          <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer"><input type="checkbox" checked={taskForm.isEnabled} onChange={e => setTaskForm(p => ({ ...p, isEnabled: e.target.checked }))} className="accent-[#FF8A00]" />Enabled</label>
                          <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer"><input type="checkbox" checked={taskForm.autoApprove} onChange={e => setTaskForm(p => ({ ...p, autoApprove: e.target.checked }))} className="accent-[#FF8A00]" />Auto-approve</label>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveTask} className="flex-1 h-9 text-white rounded-xl text-xs font-bold cursor-pointer" style={{ background: 'linear-gradient(135deg,#FF8A00,#FFB347)' }}>{editingTask ? 'Update Task' : 'Create Task'}</button>
                        <button onClick={() => { setShowTaskForm(false); setEditingTask(null); }} className="h-9 px-4 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="rounded-[20px] overflow-hidden" style={panelStyle}>
                <div className="grid gap-2 px-4 py-3 border-b text-[9px] font-bold uppercase tracking-wider text-slate-500" style={{ borderColor: 'rgba(255,255,255,0.06)', gridTemplateColumns: '1.5rem 1fr auto auto 7rem' }}>
                  <div /><div>Task</div><div className="hidden md:block">Reward</div><div className="hidden md:block">Type</div><div className="text-right">Actions</div>
                </div>
                {tasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">No tasks yet. Create the first one!</div>
                ) : tasks.map((task, idx) => (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                    className="grid gap-2 items-center px-4 py-3.5 border-b hover:bg-white/[0.015] transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.04)', gridTemplateColumns: '1.5rem 1fr auto auto 7rem' }}>
                    <div className={`w-2 h-2 rounded-full ${task.isEnabled ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]' : 'bg-slate-600'}`} />
                    <div>
                      <span className="text-xs font-bold text-white block">{task.title}</span>
                      <span className="text-[9px] text-slate-500">{task.description?.slice(0, 50)}{task.description?.length > 50 ? '...' : ''}</span>
                    </div>
                    <span className="text-[10px] font-black text-[#FF8A00] hidden md:block">{task.reward} EF {task.tokenReward > 0 ? `+ ${task.tokenReward}t` : ''}</span>
                    <span className="text-[9px] font-bold text-slate-400 capitalize hidden md:block bg-white/5 px-2 py-0.5 rounded-lg">{task.type}</span>
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => handleToggleTask(task)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {task.isEnabled ? <ToggleRight size={13} className="text-green-400" /> : <ToggleLeft size={13} className="text-slate-500" />}
                      </button>
                      <button onClick={() => startEditTask(task)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}><Edit3 size={11} /></button>
                      <button onClick={() => handleDeleteTask(task)} className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-400/10 transition-all cursor-pointer" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}><Trash2 size={11} /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ===== WITHDRAWALS ===== */}
          {activeTab === 'withdrawals' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'Pending', 'Approved', 'Rejected', 'Banned'] as const).map(f => {
                  const cnt = f === 'all' ? withdrawals.length : withdrawals.filter(w => w.status === f).length;
                  return (
                    <button key={f} onClick={() => setWithdrawFilter(f)} className={`flex items-center gap-1.5 h-8 px-4 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${withdrawFilter === f ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`} style={{ background: withdrawFilter === f ? 'linear-gradient(135deg,#FF8A00,#FFB347)' : 'rgba(255,255,255,0.04)', border: withdrawFilter === f ? 'none' : '1px solid rgba(255,255,255,0.08)' }}>
                      {f} {cnt > 0 && <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black ${withdrawFilter === f ? 'bg-white/20' : 'bg-white/10 text-slate-400'}`}>{cnt}</span>}
                    </button>
                  );
                })}
              </div>
              <div className="rounded-[20px] overflow-hidden" style={panelStyle}>
                <div className="grid gap-3 px-4 py-3 border-b text-[9px] font-bold uppercase tracking-wider text-slate-500" style={{ borderColor: 'rgba(255,255,255,0.06)', gridTemplateColumns: '2rem 1fr 7rem 6rem 5rem 10rem' }}>
                  <div /><div>User</div><div>Amount</div><div>Method</div><div>Status</div><div className="text-right">Actions</div>
                </div>
                {withdrawals.filter(w => withdrawFilter === 'all' || w.status === withdrawFilter).length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">No {withdrawFilter !== 'all' ? withdrawFilter.toLowerCase() : ''} requests.</div>
                ) : withdrawals.filter(w => withdrawFilter === 'all' || w.status === withdrawFilter).map((req, idx) => (
                  <motion.div key={req.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                    className="grid gap-3 items-center px-4 py-3.5 border-b hover:bg-white/[0.015] transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.04)', gridTemplateColumns: '2rem 1fr 7rem 6rem 5rem 10rem' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ background: 'rgba(255,138,0,0.1)', border: '1px solid rgba(255,138,0,0.2)' }}>💸</div>
                    <div><span className="text-xs font-bold text-white block">@{req.username || req.telegramId}</span><span className="text-[9px] text-slate-500">{req.telegramId}</span></div>
                    <span className="text-xs font-black text-white">{req.amount || '?'} USDT</span>
                    <span className="text-[9px] text-slate-400 font-bold">BEP-20</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${req.status === 'Pending' ? 'text-yellow-400 bg-yellow-400/10' : req.status === 'Approved' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>{req.status}</span>
                    {req.status === 'Pending' ? (
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => handleWithdrawAction(req.id, 'Approved')} className="h-7 px-2.5 rounded-lg text-[9px] font-bold text-green-400 cursor-pointer transition-all" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}><Check size={10} /></button>
                        <button onClick={() => handleWithdrawAction(req.id, 'Rejected')} className="h-7 px-2.5 rounded-lg text-[9px] font-bold text-slate-400 cursor-pointer transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}><X size={10} /></button>
                        <button onClick={() => handleWithdrawAction(req.id, 'Banned')} className="h-7 px-2.5 rounded-lg text-[9px] font-bold text-red-400 cursor-pointer transition-all" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}><Ban size={10} /></button>
                      </div>
                    ) : <div />}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ===== SECURITY ===== */}
          {activeTab === 'security' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Flagged', value: kpi.flagged, icon: '🚩', color: '#FFB347', bg: 'rgba(255,179,71,0.08)', border: 'rgba(255,179,71,0.2)' },
                  { label: 'Banned', value: kpi.banned, icon: '🚫', color: '#FF5252', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)' },
                  { label: 'Auto Miners', value: kpi.autoMiners, icon: '⛏️', color: '#FF8A00', bg: 'rgba(255,138,0,0.08)', border: 'rgba(255,138,0,0.2)' },
                  { label: 'Total', value: kpi.total, icon: '👥', color: '#ffffff', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
                ].map(item => (
                  <div key={item.label} className="rounded-[18px] p-4 flex flex-col gap-1.5" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-2xl font-black" style={{ color: item.color }}>{loadingKpi ? '-' : item.value.toLocaleString()}</span>
                    <span className="text-[9px] text-slate-500">{item.label}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-[20px] overflow-hidden" style={panelStyle}>
                <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-xs font-black text-white">Flagged Users</span>
                </div>
                {usersList.filter(u => u.flagCount > 0).length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-xs">✅ System clean! No flagged users.</div>
                ) : usersList.filter(u => u.flagCount > 0).map((u, idx) => (
                  <motion.div key={u.telegramId} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                    className="flex items-center gap-3 px-4 py-3.5 border-b hover:bg-white/[0.015] transition-all"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-yellow-400 shrink-0" style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.2)' }}>{(u.firstName?.[0] ?? 'U').toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-white block">{u.firstName} {u.lastName}</span>
                      <span className="text-[9px] text-slate-500">🚩 {u.flagCount} flags • Risk: <span className="font-bold text-yellow-400 uppercase">{u.riskLevel}</span> • @{u.username}</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleUnbanUser(u)} className="h-7 px-3 rounded-xl text-[9px] font-bold text-green-400 cursor-pointer transition-all" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>Unban</button>
                      <button onClick={() => handleBanUser(u)} className="h-7 px-3 rounded-xl text-[9px] font-bold text-red-400 cursor-pointer transition-all" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>Ban</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {[
                  { title: '💰 Economy', fields: [{ label: 'Swap Rate (Points per Token)', key: 'swapRate' }, { label: 'EForce Token Value (USD)', key: 'eforceTokenValue' }, { label: 'Tap Reward (EForce)', key: 'tapReward' }, { label: 'Combo Multiplier (x)', key: 'comboReward' }, { label: 'Max Energy', key: 'energyMax' }] },
                  { title: '⛏️ Auto Miner', fields: [{ label: 'Duration (seconds)', key: 'autoMinerDuration' }, { label: 'Reward per Session (EForce)', key: 'autoMinerReward' }, { label: 'Cooldown (seconds)', key: 'autoMinerCooldown' }] },
                  { title: '🔗 Referral & Withdrawal', fields: [{ label: 'Referral USDT Reward', key: 'referralRewardUsdt' }, { label: 'Referral Token Reward', key: 'referralRewardToken' }, { label: 'Min Referrals to Withdraw', key: 'withdrawMinReferrals' }, { label: 'Min Withdraw Amount (USDT)', key: 'withdrawMinAmount' }] },
                ].map(section => (
                  <div key={section.title} className="rounded-[20px] p-5 flex flex-col gap-0.5" style={panelStyle}>
                    <span className="text-xs font-black text-white mb-3">{section.title}</span>
                    {section.fields.map(f => (
                      <div key={f.key} className="flex items-center justify-between gap-4 py-2.5 border-b border-white/[0.04] last:border-0">
                        <label className="text-xs text-slate-400">{f.label}</label>
                        <input type="number" value={(settings as any)[f.key]} onChange={e => setSettings(prev => ({ ...prev, [f.key]: Number(e.target.value) }))} className="w-28 h-8 rounded-lg px-3 text-xs text-white outline-none text-right transition-all" style={inputStyle} />
                      </div>
                    ))}
                    {section.title.includes('Economy') && (
                      <div className="flex items-center justify-between py-2.5">
                        <label className="text-xs text-slate-400">Swap Portal Open</label>
                        <button onClick={() => setSettings(prev => ({ ...prev, swapOpen: !prev.swapOpen }))} className={`w-11 h-6 rounded-full transition-all cursor-pointer relative ${settings.swapOpen ? 'bg-green-500' : 'bg-white/10'}`}>
                          <div className="absolute top-[3px] bg-white rounded-full transition-all" style={{ width: 18, height: 18, left: settings.swapOpen ? 23 : 3 }} />
                        </button>
                      </div>
                    )}
                    {section.title.includes('Miner') && (
                      <div className="flex items-center justify-between py-2.5">
                        <label className="text-xs text-slate-400">Premium Only</label>
                        <button onClick={() => setSettings(prev => ({ ...prev, autoMinerPremiumOnly: !prev.autoMinerPremiumOnly }))} className={`w-11 h-6 rounded-full transition-all cursor-pointer relative ${settings.autoMinerPremiumOnly ? 'bg-[#00E5FF]' : 'bg-white/10'}`}>
                          <div className="absolute top-[3px] bg-white rounded-full transition-all" style={{ width: 18, height: 18, left: settings.autoMinerPremiumOnly ? 23 : 3 }} />
                        </button>
                      </div>
                    )}
                    {section.title.includes('Referral') && (
                      <>
                        <div className="flex items-center justify-between py-2.5 border-t border-white/[0.04] mt-1.5">
                          <label className="text-xs text-slate-400">Withdrawal Open</label>
                          <button onClick={() => setSettings(prev => ({ ...prev, withdrawOpen: !prev.withdrawOpen }))} className={`w-11 h-6 rounded-full transition-all cursor-pointer relative ${settings.withdrawOpen ? 'bg-green-500' : 'bg-white/10'}`}>
                            <div className="absolute top-[3px] bg-white rounded-full transition-all" style={{ width: 18, height: 18, left: settings.withdrawOpen ? 23 : 3 }} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between py-2.5 border-t border-white/[0.04] mt-1.5">
                          <label className="text-xs text-slate-400">Require Referrals for Withdraw</label>
                          <button onClick={() => setSettings(prev => ({ ...prev, withdrawRequireReferrals: !prev.withdrawRequireReferrals }))} className={`w-11 h-6 rounded-full transition-all cursor-pointer relative ${settings.withdrawRequireReferrals ? 'bg-green-500' : 'bg-white/10'}`}>
                            <div className="absolute top-[3px] bg-white rounded-full transition-all" style={{ width: 18, height: 18, left: settings.withdrawRequireReferrals ? 23 : 3 }} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-4 py-2.5 border-t border-white/[0.04] mt-1.5">
                          <label className="text-xs text-slate-400">Telegram Bot Username (Ref Links)</label>
                          <input type="text" value={settings.botUsername} onChange={e => setSettings(prev => ({ ...prev, botUsername: e.target.value }))} className="w-40 h-8 rounded-lg px-3 text-xs text-white outline-none text-right transition-all" style={inputStyle} />
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* 📢 Monetag Sponsored Ads Setup */}
                <div className="rounded-[20px] p-5 flex flex-col gap-0.5 animate-fade-in" style={panelStyle}>
                  <span className="text-xs font-black text-[#00E5FF] mb-3">📢 Monetag Sponsored Ads Setup</span>
                  
                  <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                    <label className="text-xs text-slate-400">Enable Ads System</label>
                    <button onClick={() => setSettings(prev => ({ ...prev, adEnabled: !prev.adEnabled }))} className={`w-11 h-6 rounded-full transition-all cursor-pointer relative ${settings.adEnabled ? 'bg-green-500' : 'bg-white/10'}`}>
                      <div className="absolute top-[3px] bg-white rounded-full transition-all" style={{ width: 18, height: 18, left: settings.adEnabled ? 23 : 3 }} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2.5 border-b border-white/[0.04]">
                    <label className="text-xs text-slate-400">Monetag Zone ID</label>
                    <input type="text" value={settings.monetagZoneId} onChange={e => setSettings(prev => ({ ...prev, monetagZoneId: e.target.value }))} className="w-40 h-8 rounded-lg px-3 text-xs text-white outline-none text-right transition-all" style={inputStyle} />
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2.5 border-b border-white/[0.04]">
                    <label className="text-xs text-slate-400">Ad Reward Amount (EF Points)</label>
                    <input type="number" value={settings.adRewardAmount} onChange={e => setSettings(prev => ({ ...prev, adRewardAmount: Number(e.target.value) }))} className="w-28 h-8 rounded-lg px-3 text-xs text-white outline-none text-right transition-all" style={inputStyle} />
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2.5 border-b border-white/[0.04]">
                    <label className="text-xs text-slate-400">Sponsored Ad Reward (Tokens)</label>
                    <input type="number" value={settings.adTokenReward} onChange={e => setSettings(prev => ({ ...prev, adTokenReward: Number(e.target.value) }))} className="w-28 h-8 rounded-lg px-3 text-xs text-white outline-none text-right transition-all" style={inputStyle} />
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2.5 border-b border-white/[0.04]">
                    <label className="text-xs text-slate-400">Daily Video Ads Limit (Normal)</label>
                    <input type="number" value={settings.adDailyLimitNormal} onChange={e => setSettings(prev => ({ ...prev, adDailyLimitNormal: Number(e.target.value) }))} className="w-28 h-8 rounded-lg px-3 text-xs text-white outline-none text-right transition-all" style={inputStyle} />
                  </div>

                  <div className="flex items-center justify-between gap-4 py-2.5 border-b border-white/[0.04]">
                    <label className="text-xs text-slate-400">Daily Video Ads Limit (Premium)</label>
                    <input type="number" value={settings.adDailyLimitPremium} onChange={e => setSettings(prev => ({ ...prev, adDailyLimitPremium: Number(e.target.value) }))} className="w-28 h-8 rounded-lg px-3 text-xs text-white outline-none text-right transition-all" style={inputStyle} />
                  </div>

                  <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                    <label className="text-xs text-slate-400">Require Ad for Daily Check-in</label>
                    <button onClick={() => setSettings(prev => ({ ...prev, adRequireDailyClaim: !prev.adRequireDailyClaim }))} className={`w-11 h-6 rounded-full transition-all cursor-pointer relative ${settings.adRequireDailyClaim ? 'bg-[#FF8A00]' : 'bg-white/10'}`}>
                      <div className="absolute top-[3px] bg-white rounded-full transition-all" style={{ width: 18, height: 18, left: settings.adRequireDailyClaim ? 23 : 3 }} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                    <label className="text-xs text-slate-400">Require Ad to Complete Tasks</label>
                    <button onClick={() => setSettings(prev => ({ ...prev, adRequireTasks: !prev.adRequireTasks }))} className={`w-11 h-6 rounded-full transition-all cursor-pointer relative ${settings.adRequireTasks ? 'bg-[#FF8A00]' : 'bg-white/10'}`}>
                      <div className="absolute top-[3px] bg-white rounded-full transition-all" style={{ width: 18, height: 18, left: settings.adRequireTasks ? 23 : 3 }} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2.5">
                    <label className="text-xs text-slate-400">Require Ad to Start Auto Miner</label>
                    <button onClick={() => setSettings(prev => ({ ...prev, adRequireAutoMiner: !prev.adRequireAutoMiner }))} className={`w-11 h-6 rounded-full transition-all cursor-pointer relative ${settings.adRequireAutoMiner ? 'bg-[#FF8A00]' : 'bg-white/10'}`}>
                      <div className="absolute top-[3px] bg-white rounded-full transition-all" style={{ width: 18, height: 18, left: settings.adRequireAutoMiner ? 23 : 3 }} />
                    </button>
                  </div>
                </div>

                <div className="rounded-[20px] p-5" style={panelStyle}>
                  <span className="text-xs font-black text-white block mb-3">📅 Daily Check-in Rewards</span>
                  <div className="grid grid-cols-4 gap-2">
                    {settings.dailyClaimRewards.map((reward, i) => (
                      <div key={i} className="flex flex-col gap-1 items-center">
                        <label className="text-[8px] text-slate-500 font-bold">Day {i + 1}</label>
                        <input type="number" value={reward} onChange={e => { const nr = [...settings.dailyClaimRewards]; nr[i] = Number(e.target.value); setSettings(prev => ({ ...prev, dailyClaimRewards: nr })); }} className="w-full h-8 rounded-lg px-1 text-[10px] text-white outline-none text-center" style={inputStyle} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={handleSaveSettings} disabled={savingSettings} className="w-full h-12 text-white font-black rounded-[18px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all text-sm" style={{ background: 'linear-gradient(135deg,#FF8A00,#FFB347)', boxShadow: '0 0 30px rgba(255,138,0,0.4)' }}>
                {savingSettings ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                {savingSettings ? 'Saving to Firestore...' : 'Save All Settings'}
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
