import React, { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import {
  Check, X, Search, Ban, Edit3, Save,
  RefreshCw, Plus, Trash2, ToggleLeft, ToggleRight,
  DollarSign, Star,
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

export const Admin: React.FC<AdminProps> = ({ showToast, liveUserCount }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Dashboard KPIs ---
  const [kpi, setKpi] = useState({
    total: 0, online: 0, premium: 0, normal: 0,
    newToday: 0, flagged: 0, banned: 0, autoMiners: 0,
  });
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

  useEffect(() => {
    fetchKpis();
    const interval = setInterval(fetchKpis, 30000);
    return () => clearInterval(interval);
  }, []);

  // --- Users ---
  const [usersList, setUsersList] = useState<FirestoreUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
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

  const fetchUsers = async () => {
    setLoadingUsers(true);
    const u = await getAllUsers();
    setUsersList(u);
    setLoadingUsers(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const startEditUser = (u: FirestoreUser) => {
    setEditingUser(u);
    setEditPoints(u.points ?? 0);
    setEditTokens(u.tokens ?? 0);
    setEditWallet(u.wallet ?? 0);
    setEditReferrals(u.referrals ?? 0);
    setEditRiskLevel(u.riskLevel ?? 'safe');
    setEditBanStatus(u.banStatus ?? 'none');
    if (u.banStatus === 'temp' && u.banUntil) {
      const until = u.banUntil instanceof Timestamp ? u.banUntil.toDate() : new Date(u.banUntil as string);
      const diffHrs = Math.max(1, Math.round((until.getTime() - Date.now()) / (3600 * 1000)));
      setEditBanDuration(diffHrs === 48 ? 48 : diffHrs === 72 ? 72 : 24);
    } else { setEditBanDuration(24); }
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    let banUntil = null;
    if (editBanStatus === 'temp') {
      banUntil = Timestamp.fromDate(new Date(Date.now() + editBanDuration * 3600 * 1000));
    }
    const ok = await updateUserDatabaseValues(editingUser.telegramId, {
      points: editPoints, tokens: editTokens, wallet: editWallet,
      referrals: editReferrals, riskLevel: editRiskLevel,
      banStatus: editBanStatus, banUntil: banUntil,
    });
    setSavingUser(false);
    if (ok) { showToast(`✅ ${editingUser.firstName} updated.`, 'success'); fetchUsers(); setEditingUser(null); }
    else { showToast('Error updating user.', 'error'); }
  };

  const handleFlagUser = async (u: FirestoreUser) => {
    await flagUser(u.telegramId, 'Manual flag by admin');
    showToast(`🚩 ${u.firstName} flagged.`, 'warning');
    fetchUsers();
  };
  const handleBanUser = async (u: FirestoreUser) => {
    await adminSetBan(u.telegramId, 'permanent');
    showToast(`🚫 ${u.firstName} permanently banned.`, 'error');
    fetchUsers();
  };
  const handleUnbanUser = async (u: FirestoreUser) => {
    await adminSetBan(u.telegramId, 'none');
    showToast(`✅ ${u.firstName} unbanned.`, 'success');
    fetchUsers();
  };

  // --- Tasks ---
  const [tasks, setTasks] = useState<EForceTask[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<EForceTask | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', type: 'channel' as TaskType,
    reward: 500, tokenReward: 0, url: '',
    dailyLimit: 0, totalCompletionLimit: 0, expiryDate: '',
    isEnabled: true, autoApprove: true,
  });

  useEffect(() => { const unsub = subscribeToTasks(setTasks); return unsub; }, []);

  const handleSaveTask = async () => {
    const taskData = { ...taskForm, expiryDate: taskForm.expiryDate || null };
    if (editingTask) {
      const ok = await updateTask(editingTask.id, taskData);
      ok ? showToast('Task updated.', 'success') : showToast('Failed to update.', 'error');
    } else {
      const id = await createTask(taskData);
      id ? showToast('Task created.', 'success') : showToast('Failed to create.', 'error');
    }
    setShowTaskForm(false); setEditingTask(null);
    setTaskForm({ title: '', description: '', type: 'channel', reward: 500, tokenReward: 0, url: '', dailyLimit: 0, totalCompletionLimit: 0, expiryDate: '', isEnabled: true, autoApprove: true });
  };

  const handleDeleteTask = async (task: EForceTask) => {
    const ok = await deleteTask(task.id);
    ok ? showToast('Task deleted.', 'success') : showToast('Failed to delete.', 'error');
  };

  const handleToggleTask = async (task: EForceTask) => {
    await updateTask(task.id, { isEnabled: !task.isEnabled });
    showToast(`Task ${task.isEnabled ? 'disabled' : 'enabled'}.`, 'info');
  };

  const startEditTask = (task: EForceTask) => {
    setEditingTask(task);
    setTaskForm({ title: task.title, description: task.description, type: task.type, reward: task.reward, tokenReward: task.tokenReward, url: task.url, dailyLimit: task.dailyLimit, totalCompletionLimit: task.totalCompletionLimit, expiryDate: task.expiryDate || '', isEnabled: task.isEnabled, autoApprove: task.autoApprove });
    setShowTaskForm(true);
  };

  // --- Withdrawals ---
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawFilter, setWithdrawFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected' | 'Banned'>('Pending');

  useEffect(() => { const unsub = subscribeToWithdrawRequests(setWithdrawals); return unsub; }, []);

  const handleWithdrawAction = async (reqId: string, status: 'Approved' | 'Rejected' | 'Banned') => {
    const ok = await updateWithdrawRequest(reqId, status);
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
    ok ? showToast('⚙️ Settings saved to Firestore.', 'success') : showToast('Failed to save settings.', 'error');
  };

  const filteredUsers = usersList.filter(u => {
    const q = userSearch.toLowerCase();
    return u.firstName?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q) || String(u.telegramId).includes(q);
  });

  // ============ RENDER ============
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0A0E18' }}>
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        eforceTokenValue={settings.eforceTokenValue}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <AdminHeader
          activeTab={activeTab}
          onMenuClick={() => setSidebarOpen(true)}
          pendingCount={withdrawals.filter(w => w.status === 'Pending').length}
          flaggedCount={kpi.flagged}
          onRefresh={fetchKpis}
          isRefreshing={loadingKpi}
        />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-5" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>

          {/* ===== DASHBOARD ===== */}
          {activeTab === 'dashboard' && (
            <AdminDashboard
              kpi={kpi}
              loadingKpi={loadingKpi}
              liveUserCount={liveUserCount}
              withdrawals={withdrawals}
              usersList={usersList}
              onRefresh={fetchKpis}
              eforceTokenValue={settings.eforceTokenValue}
            />
          )}

          {/* ===== USERS ===== */}
          {activeTab === 'users' && (
            <div className="flex flex-col gap-4">
              {/* Search + refresh */}
              <div className="flex gap-3 items-center">
                <div className="flex-1 relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name, username, ID..."
                    className="w-full pl-9 pr-4 h-9 rounded-xl text-xs text-white outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  />
                </div>
                <button onClick={fetchUsers} className="h-9 px-4 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <RefreshCw size={12} className={loadingUsers ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {/* User cards */}
              {loadingUsers ? (
                <div className="text-center py-10 text-slate-500 text-xs">Loading users...</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {filteredUsers.map(u => (
                    <div key={u.telegramId} className="rounded-[16px] p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF8A00]/30 to-[#FFB347]/20 flex items-center justify-center text-sm font-bold text-[#FF8A00] shrink-0">
                          {(u.firstName?.[0] ?? 'E').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">{u.firstName} {u.lastName}</span>
                            <VerifiedBadge size={13} className="shrink-0" />
                            {u.isTelegramPremium && <Star size={12} className="text-accent-cyan fill-current shrink-0" />}
                            {u.banStatus !== 'none' && <span className="text-[9px] text-red-400 font-extrabold uppercase bg-red-400/10 px-2 py-0.5 border border-red-400/20 rounded">BANNED</span>}
                            {u.flagCount > 0 && <span className="text-[9px] text-yellow-400 font-extrabold bg-yellow-400/10 px-2 py-0.5 border border-yellow-400/20 rounded">🚩{u.flagCount}</span>}
                          </div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            @{u.username || 'no_username'} • {u.telegramId}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-xs font-black text-[#FF8A00]">{(u.points || 0).toLocaleString()} EF</span>
                          <span className="text-[9px] text-slate-500">{(u.tokens || 0)} tokens</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => startEditUser(u)} className="flex-1 h-8 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <Edit3 size={11} /> Edit
                        </button>
                        <button onClick={() => handleFlagUser(u)} className="flex-1 h-8 rounded-xl text-[10px] font-bold text-yellow-400 hover:bg-yellow-400/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                          🚩 Flag
                        </button>
                        {u.banStatus !== 'none' ? (
                          <button onClick={() => handleUnbanUser(u)} className="flex-1 h-8 rounded-xl text-[10px] font-bold text-green-400 hover:bg-green-400/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                            <Check size={11} /> Unban
                          </button>
                        ) : (
                          <button onClick={() => handleBanUser(u)} className="flex-1 h-8 rounded-xl text-[10px] font-bold text-red-400 hover:bg-red-400/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                            <Ban size={11} /> Ban
                          </button>
                        )}
                      </div>

                      {/* Edit form inline */}
                      {editingUser?.telegramId === u.telegramId && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {[
                              { label: 'Points', val: editPoints, set: setEditPoints },
                              { label: 'Tokens', val: editTokens, set: setEditTokens },
                              { label: 'Wallet', val: editWallet, set: setEditWallet },
                              { label: 'Referrals', val: editReferrals, set: setEditReferrals },
                            ].map(f => (
                              <div key={f.label}>
                                <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">{f.label}</label>
                                <input type="number" value={f.val} onChange={e => f.set(Number(e.target.value))}
                                  className="w-full h-8 rounded-lg px-2 text-xs text-white outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Risk Level</label>
                              <select value={editRiskLevel} onChange={e => setEditRiskLevel(e.target.value as any)}
                                className="w-full h-8 rounded-lg px-2 text-xs text-white outline-none cursor-pointer" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <option value="safe">Safe</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Ban Status</label>
                              <select value={editBanStatus} onChange={e => setEditBanStatus(e.target.value as any)}
                                className="w-full h-8 rounded-lg px-2 text-xs text-white outline-none cursor-pointer" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <option value="none">None</option>
                                <option value="temp">Temp</option>
                                <option value="permanent">Permanent</option>
                              </select>
                            </div>
                          </div>
                          {editBanStatus === 'temp' && (
                            <div>
                              <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Duration (hours)</label>
                              <select value={editBanDuration} onChange={e => setEditBanDuration(Number(e.target.value))}
                                className="w-full h-8 rounded-lg px-2 text-xs text-white outline-none cursor-pointer" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <option value={24}>24h</option>
                                <option value={48}>48h</option>
                                <option value={72}>72h</option>
                              </select>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button onClick={handleSaveUser} disabled={savingUser} className="flex-1 h-9 bg-[#FF8A00] hover:bg-[#FF8A00]/90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
                              {savingUser ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Save
                            </button>
                            <button onClick={() => setEditingUser(null)} className="h-9 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-10 text-slate-500 text-xs">No users found.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== TASKS ===== */}
          {activeTab === 'tasks' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Tasks ({tasks.length})</span>
                <button onClick={() => { setShowTaskForm(true); setEditingTask(null); setTaskForm({ title: '', description: '', type: 'channel', reward: 500, tokenReward: 0, url: '', dailyLimit: 0, totalCompletionLimit: 0, expiryDate: '', isEnabled: true, autoApprove: true }); }}
                  className="h-8 px-4 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-all"
                  style={{ background: 'linear-gradient(135deg,#FF8A00,#FFB347)', boxShadow: '0 0 16px rgba(255,138,0,0.35)' }}>
                  <Plus size={12} /> New Task
                </button>
              </div>

              {showTaskForm && (
                <div className="rounded-[20px] p-5 flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,138,0,0.2)' }}>
                  <span className="text-xs font-bold text-[#FF8A00]">{editingTask ? 'Edit Task' : 'New Task'}</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { label: 'Title', key: 'title', type: 'text' },
                      { label: 'URL', key: 'url', type: 'text' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">{f.label}</label>
                        <input type={f.type} value={(taskForm as any)[f.key]} onChange={e => setTaskForm(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full h-9 rounded-xl px-3 text-xs text-white outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Description</label>
                    <textarea value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))} rows={2}
                      className="w-full rounded-xl px-3 py-2 text-xs text-white outline-none resize-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Reward (EF)', key: 'reward' },
                      { label: 'Token Reward', key: 'tokenReward' },
                      { label: 'Daily Limit', key: 'dailyLimit' },
                      { label: 'Total Limit', key: 'totalCompletionLimit' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">{f.label}</label>
                        <input type="number" value={(taskForm as any)[f.key]} onChange={e => setTaskForm(p => ({ ...p, [f.key]: Number(e.target.value) }))}
                          className="w-full h-9 rounded-xl px-3 text-xs text-white outline-none text-right" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Type</label>
                      <select value={taskForm.type} onChange={e => setTaskForm(p => ({ ...p, type: e.target.value as TaskType }))}
                        className="w-full h-9 rounded-xl px-3 text-xs text-white outline-none cursor-pointer" style={{ background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <option value="channel">Channel</option>
                        <option value="youtube">YouTube</option>
                        <option value="twitter">Twitter</option>
                        <option value="website">Website</option>
                        <option value="daily">Daily</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Expiry Date</label>
                      <input type="date" value={taskForm.expiryDate} onChange={e => setTaskForm(p => ({ ...p, expiryDate: e.target.value }))}
                        className="w-full h-9 rounded-xl px-3 text-xs text-white outline-none" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                    <div className="flex gap-4 items-center pt-4">
                      <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={taskForm.isEnabled} onChange={e => setTaskForm(p => ({ ...p, isEnabled: e.target.checked }))} className="accent-[#FF8A00] w-3.5 h-3.5" />
                        Enabled
                      </label>
                      <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer">
                        <input type="checkbox" checked={taskForm.autoApprove} onChange={e => setTaskForm(p => ({ ...p, autoApprove: e.target.checked }))} className="accent-[#FF8A00] w-3.5 h-3.5" />
                        Auto-approve
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveTask} className="flex-1 h-9 text-white rounded-xl text-xs font-bold cursor-pointer" style={{ background: 'linear-gradient(135deg,#FF8A00,#FFB347)' }}>
                      {editingTask ? 'Update Task' : 'Create Task'}
                    </button>
                    <button onClick={() => { setShowTaskForm(false); setEditingTask(null); }} className="h-9 px-4 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {tasks.map(task => (
                  <div key={task.id} className="rounded-[16px] p-4 flex items-start gap-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${task.isEnabled ? 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.8)]' : 'bg-slate-600'}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-bold text-white block">{task.title}</span>
                      <span className="text-[9px] text-slate-500">{task.type} • {task.reward} EF {task.tokenReward > 0 ? `+ ${task.tokenReward} tokens` : ''}</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => handleToggleTask(task)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {task.isEnabled ? <ToggleRight size={14} className="text-green-400" /> : <ToggleLeft size={14} />}
                      </button>
                      <button onClick={() => startEditTask(task)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Edit3 size={12} />
                      </button>
                      <button onClick={() => handleDeleteTask(task)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-400/20 transition-all cursor-pointer" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && <div className="text-center py-8 text-slate-500 text-xs">No tasks. Create the first one!</div>}
              </div>
            </div>
          )}

          {/* ===== WITHDRAWALS ===== */}
          {activeTab === 'withdrawals' && (
            <div className="flex flex-col gap-4">
              {/* Filter tabs */}
              <div className="flex gap-2 flex-wrap">
                {(['all', 'Pending', 'Approved', 'Rejected', 'Banned'] as const).map(f => (
                  <button key={f} onClick={() => setWithdrawFilter(f)}
                    className={`px-3 h-7 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${withdrawFilter === f ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    style={{ background: withdrawFilter === f ? 'linear-gradient(135deg,#FF8A00,#FFB347)' : 'rgba(255,255,255,0.04)', border: '1px solid ' + (withdrawFilter === f ? 'transparent' : 'rgba(255,255,255,0.08)') }}>
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {withdrawals.filter(w => withdrawFilter === 'all' || w.status === withdrawFilter).map(req => (
                  <div key={req.id} className="rounded-[16px] p-4 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: 'rgba(255,138,0,0.12)', border: '1px solid rgba(255,138,0,0.25)' }}>
                        <DollarSign size={14} className="text-[#FF8A00]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">@{req.username || req.telegramId}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${req.status === 'Pending' ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20' : req.status === 'Approved' ? 'text-green-400 bg-green-400/10 border border-green-400/20' : 'text-red-400 bg-red-400/10 border border-red-400/20'}`}>
                            {req.status}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500">Amount: {req.amount} USDT • BEP-20</span>
                      </div>
                    </div>
                    {req.status === 'Pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleWithdrawAction(req.id, 'Approved')} className="flex-1 h-8 rounded-xl text-[10px] font-bold text-green-400 flex items-center justify-center gap-1.5 cursor-pointer transition-all" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)' }}>
                          <Check size={11} /> Approve
                        </button>
                        <button onClick={() => handleWithdrawAction(req.id, 'Rejected')} className="flex-1 h-8 rounded-xl text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1.5 cursor-pointer transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <X size={11} /> Reject
                        </button>
                        <button onClick={() => handleWithdrawAction(req.id, 'Banned')} className="flex-1 h-8 rounded-xl text-[10px] font-bold text-red-400 flex items-center justify-center gap-1.5 cursor-pointer transition-all" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                          <Ban size={11} /> Ban
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {withdrawals.filter(w => withdrawFilter === 'all' || w.status === withdrawFilter).length === 0 && (
                  <div className="text-center py-10 text-slate-500 text-xs">No {withdrawFilter !== 'all' ? withdrawFilter.toLowerCase() : ''} requests.</div>
                )}
              </div>
            </div>
          )}

          {/* ===== SECURITY ===== */}
          {activeTab === 'security' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Flagged Users', value: kpi.flagged, color: 'text-yellow-400', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)', icon: '🚩' },
                  { label: 'Banned Users', value: kpi.banned, color: 'text-red-400', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', icon: '🚫' },
                  { label: 'Auto Miners', value: kpi.autoMiners, color: 'text-[#FF8A00]', bg: 'rgba(255,138,0,0.08)', border: 'rgba(255,138,0,0.2)', icon: '⛏️' },
                  { label: 'Total Users', value: kpi.total, color: 'text-white', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', icon: '👥' },
                ].map(item => (
                  <div key={item.label} className="rounded-[18px] p-4 flex flex-col gap-1" style={{ background: item.bg, border: `1px solid ${item.border}` }}>
                    <span className="text-sm">{item.icon}</span>
                    <span className={`text-2xl font-black ${item.color}`}>{loadingKpi ? '-' : item.value}</span>
                    <span className="text-[9px] text-slate-500">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-[20px] p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs font-bold text-white block mb-3">Flagged Users</span>
                <div className="flex flex-col gap-2">
                  {usersList.filter(u => u.flagCount > 0).map(u => (
                    <div key={u.telegramId} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(234,179,8,0.04)', border: '1px solid rgba(234,179,8,0.12)' }}>
                      <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center text-xs font-bold text-yellow-400 shrink-0">
                        {(u.firstName?.[0] ?? 'U').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold text-white block">{u.firstName} {u.lastName}</span>
                        <span className="text-[9px] text-slate-500">🚩 {u.flagCount} flags • Risk: <span className="font-bold text-yellow-400 uppercase">{u.riskLevel}</span></span>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleUnbanUser(u)} className="h-7 px-3 rounded-lg text-[9px] font-bold text-green-400 cursor-pointer transition-all" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>Unban</button>
                        <button onClick={() => handleBanUser(u)} className="h-7 px-3 rounded-lg text-[9px] font-bold text-red-400 cursor-pointer transition-all" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>Ban</button>
                      </div>
                    </div>
                  ))}
                  {usersList.filter(u => u.flagCount > 0).length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-xs">✅ No flagged users. System is clean!</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== SETTINGS ===== */}
          {activeTab === 'settings' && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Economy */}
                <div className="rounded-[20px] p-5 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xs font-bold text-white">💰 Economy</span>
                  {[
                    { label: 'Swap Rate (Points per Token)', key: 'swapRate' },
                    { label: 'EForce Token Value (USD)', key: 'eforceTokenValue' },
                    { label: 'Tap Reward (EForce)', key: 'tapReward' },
                    { label: 'Combo Multiplier (x)', key: 'comboReward' },
                    { label: 'Max Energy', key: 'energyMax' },
                  ].map(f => (
                    <div key={f.key} className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
                      <label className="text-xs text-slate-400">{f.label}</label>
                      <input type="number" value={(settings as any)[f.key]} onChange={e => setSettings(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                        className="w-28 h-8 rounded-lg px-3 text-xs text-white outline-none text-right" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-2">
                    <label className="text-xs text-slate-400">Swap Portal Open</label>
                    <button onClick={() => setSettings(prev => ({ ...prev, swapOpen: !prev.swapOpen }))}
                      className={`w-11 h-6 rounded-full transition-all cursor-pointer relative ${settings.swapOpen ? 'bg-green-500' : 'bg-white/10'}`}>
                      <div className={`w-4.5 h-4.5 bg-white rounded-full absolute top-[3px] transition-all ${settings.swapOpen ? 'left-[23px]' : 'left-[3px]'}`} style={{ width: 18, height: 18 }} />
                    </button>
                  </div>
                </div>

                {/* Auto Miner */}
                <div className="rounded-[20px] p-5 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xs font-bold text-white">⛏️ Auto Miner</span>
                  {[
                    { label: 'Duration (seconds)', key: 'autoMinerDuration' },
                    { label: 'Reward per Session (EForce)', key: 'autoMinerReward' },
                    { label: 'Cooldown (seconds)', key: 'autoMinerCooldown' },
                  ].map(f => (
                    <div key={f.key} className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
                      <label className="text-xs text-slate-400">{f.label}</label>
                      <input type="number" value={(settings as any)[f.key]} onChange={e => setSettings(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                        className="w-28 h-8 rounded-lg px-3 text-xs text-white outline-none text-right" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-2">
                    <label className="text-xs text-slate-400">Premium Only</label>
                    <button onClick={() => setSettings(prev => ({ ...prev, autoMinerPremiumOnly: !prev.autoMinerPremiumOnly }))}
                      className={`w-11 h-6 rounded-full transition-all cursor-pointer relative ${settings.autoMinerPremiumOnly ? 'bg-[#00E5FF]' : 'bg-white/10'}`}>
                      <div className={`bg-white rounded-full absolute top-[3px] transition-all`} style={{ width: 18, height: 18, left: settings.autoMinerPremiumOnly ? 23 : 3 }} />
                    </button>
                  </div>
                </div>

                {/* Referral & Withdraw */}
                <div className="rounded-[20px] p-5 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xs font-bold text-white">🔗 Referral & Withdrawal</span>
                  {[
                    { label: 'Referral USDT Reward', key: 'referralRewardUsdt' },
                    { label: 'Referral Token Reward', key: 'referralRewardToken' },
                    { label: 'Min Referrals to Withdraw', key: 'withdrawMinReferrals' },
                    { label: 'Min Withdraw Amount (USDT)', key: 'withdrawMinAmount' },
                  ].map(f => (
                    <div key={f.key} className="flex items-center justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
                      <label className="text-xs text-slate-400">{f.label}</label>
                      <input type="number" value={(settings as any)[f.key]} onChange={e => setSettings(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                        className="w-28 h-8 rounded-lg px-3 text-xs text-white outline-none text-right" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </div>
                  ))}
                </div>

                {/* Daily Check-in */}
                <div className="rounded-[20px] p-5 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xs font-bold text-white">📅 Daily Check-in Rewards</span>
                  <div className="grid grid-cols-4 gap-2">
                    {settings.dailyClaimRewards.map((reward, i) => (
                      <div key={i} className="flex flex-col gap-1 items-center">
                        <label className="text-[9px] text-slate-500 font-bold">Day {i + 1}</label>
                        <input type="number" value={reward}
                          onChange={e => {
                            const nr = [...settings.dailyClaimRewards];
                            nr[i] = Number(e.target.value);
                            setSettings(prev => ({ ...prev, dailyClaimRewards: nr }));
                          }}
                          className="w-full h-8 rounded-lg px-1 text-[10px] text-white outline-none text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={handleSaveSettings} disabled={savingSettings}
                className="w-full h-11 text-white font-bold rounded-[16px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                style={{ background: 'linear-gradient(135deg,#FF8A00,#FFB347)', boxShadow: '0 0 24px rgba(255,138,0,0.35)' }}>
                {savingSettings ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                {savingSettings ? 'Saving to Firestore...' : 'Save All Settings'}
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
