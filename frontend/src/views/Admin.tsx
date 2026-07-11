import { useState, useEffect } from 'react';
import {
  TrendingUp, Users, Check, X, Search, Ban, Edit3, Save,
  RefreshCw, Shield, Plus, Trash2, ToggleLeft, ToggleRight,
  Settings, DollarSign, Zap, Star,
} from 'lucide-react';
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

type AdminTab = 'dashboard' | 'users' | 'tasks' | 'withdrawals' | 'security' | 'settings';

interface AdminProps {
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  liveUserCount: number;
}

export const Admin: React.FC<AdminProps> = ({ showToast, liveUserCount }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // --- Dashboard KPIs ---
  const [kpi, setKpi] = useState({
    total: 0, online: 0, premium: 0, normal: 0,
    newToday: 0, flagged: 0, banned: 0, autoMiners: 0,
  });
  const [loadingKpi, setLoadingKpi] = useState(true);

  const fetchKpis = async () => {
    setLoadingKpi(true);
    const [total, online, premium, newToday, flagged, banned, autoMiners] = await Promise.all([
      getTotalUserCount(),
      getOnlineUserCount(),
      getPremiumUsersCount(),
      getTodayNewUsersCount(),
      getFlaggedUsersCount(),
      getBannedUsersCount(),
      getAutoMinerUsersCount(),
    ]);
    setKpi({
      total,
      online,
      premium,
      normal: Math.max(0, total - premium),
      newToday,
      flagged,
      banned,
      autoMiners,
    });
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
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setSavingUser(true);
    const ok = await updateUserDatabaseValues(editingUser.telegramId, {
      points: editPoints,
      tokens: editTokens,
      wallet: editWallet,
      referrals: editReferrals,
      riskLevel: editRiskLevel,
    });
    setSavingUser(false);
    if (ok) {
      showToast(`✅ ${editingUser.firstName} updated.`, 'success');
      setUsersList(prev => prev.map(u => u.telegramId === editingUser.telegramId
        ? { ...u, points: editPoints, tokens: editTokens, wallet: editWallet, referrals: editReferrals, riskLevel: editRiskLevel }
        : u
      ));
      setEditingUser(null);
    } else {
      showToast('Error updating user.', 'error');
    }
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

  useEffect(() => {
    const unsub = subscribeToTasks(setTasks);
    return unsub;
  }, []);

  const handleSaveTask = async () => {
    const taskData = {
      ...taskForm,
      expiryDate: taskForm.expiryDate || null,
    };
    if (editingTask) {
      const ok = await updateTask(editingTask.id, taskData);
      ok ? showToast('Task updated.', 'success') : showToast('Failed to update.', 'error');
    } else {
      const id = await createTask(taskData);
      id ? showToast('Task created.', 'success') : showToast('Failed to create.', 'error');
    }
    setShowTaskForm(false);
    setEditingTask(null);
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
    setTaskForm({
      title: task.title,
      description: task.description,
      type: task.type,
      reward: task.reward,
      tokenReward: task.tokenReward,
      url: task.url,
      dailyLimit: task.dailyLimit,
      totalCompletionLimit: task.totalCompletionLimit,
      expiryDate: task.expiryDate || '',
      isEnabled: task.isEnabled,
      autoApprove: task.autoApprove,
    });
    setShowTaskForm(true);
  };

  // --- Withdrawals ---
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawFilter, setWithdrawFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected' | 'Banned'>('Pending');

  useEffect(() => {
    const unsub = subscribeToWithdrawRequests(setWithdrawals);
    return unsub;
  }, []);

  const handleWithdrawAction = async (reqId: string, status: 'Approved' | 'Rejected' | 'Banned') => {
    const ok = await updateWithdrawRequest(reqId, status);
    ok ? showToast(`Request ${status}.`, status === 'Approved' ? 'success' : 'warning') : showToast('Update failed.', 'error');
  };

  // --- Settings ---
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAdminSettings(setSettings);
    return unsub;
  }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const ok = await saveAdminSettings(settings);
    setSavingSettings(false);
    ok ? showToast('⚙️ Settings saved to Firestore.', 'success') : showToast('Failed to save settings.', 'error');
  };

  // ============ RENDER ============

  const tabConfig: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp size={12} /> },
    { id: 'users', label: 'Users', icon: <Users size={12} /> },
    { id: 'tasks', label: 'Tasks', icon: <Zap size={12} /> },
    { id: 'withdrawals', label: 'Withdrawals', icon: <DollarSign size={12} /> },
    { id: 'security', label: 'Security', icon: <Shield size={12} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={12} /> },
  ];

  return (
    <div className="flex flex-col gap-5 pb-28">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white">Console</h1>
        <p className="text-xs md:text-sm text-slate-400 mt-1.5">Global ecosystem parameters and management.</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {tabConfig.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#FF8A00] border-[#FF8A00] text-white'
                : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============ DASHBOARD TAB ============ */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Real-Time KPIs</span>
            <button onClick={fetchKpis} disabled={loadingKpi} className="flex items-center gap-1 text-[9px] text-slate-400 hover:text-accent-cyan transition-colors">
              <RefreshCw size={10} className={loadingKpi ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: kpi.total, color: 'text-white', icon: '👥' },
              { label: 'Online Now', value: liveUserCount || kpi.online, color: 'text-accent-success', icon: '🟢' },
              { label: 'Premium Users', value: kpi.premium, color: 'text-accent-cyan', icon: '⭐' },
              { label: 'Normal Users', value: kpi.normal, color: 'text-slate-300', icon: '👤' },
              { label: "Today's New", value: kpi.newToday, color: 'text-accent-blue', icon: '📈' },
              { label: 'Auto Miners', value: kpi.autoMiners, color: 'text-accent-purple', icon: '⛏️' },
              { label: 'Flagged Users', value: kpi.flagged, color: 'text-accent-warning', icon: '🚩' },
              { label: 'Banned Users', value: kpi.banned, color: 'text-accent-danger', icon: '🚫' },
            ].map((item) => (
              <div key={item.label} className="glass-panel p-4 md:p-6 rounded-[22px] border-white/5 flex flex-col gap-1.5 md:gap-2 shadow-lg">
                <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <span>{item.icon}</span> {item.label}
                </span>
                <span className={`text-xl md:text-3xl font-black font-display ${item.color}`}>
                  {loadingKpi ? '...' : item.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Pending Withdrawals Quick View */}
          <div className="glass-panel p-5 md:p-8 rounded-[24px] border-white/6 flex flex-col gap-1.5 shadow-lg">
            <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-bold block mb-1">
              💰 Pending Withdrawals
            </span>
            <span className="text-2xl md:text-4xl font-black text-[#FF8A00]">
              {withdrawals.filter(w => w.status === 'Pending').length}
            </span>
            <p className="text-[10px] md:text-xs text-slate-400">awaiting approval</p>
          </div>
        </div>
      )}

      {/* ============ USERS TAB ============ */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
              User Database ({usersList.length})
            </span>
            <button onClick={fetchUsers} disabled={loadingUsers} className="flex items-center gap-1 text-[9px] text-slate-400 hover:text-accent-cyan transition-colors">
              <RefreshCw size={10} className={loadingUsers ? 'animate-spin' : ''} />
              {loadingUsers ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-xl px-2.5 py-1.5">
            <Search size={12} className="text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search by name, username or Telegram ID..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-[11px] text-slate-300 w-full placeholder-slate-500"
            />
          </div>

          {/* User List */}
          <div className="flex flex-col gap-2 max-h-[360px] md:max-h-[600px] overflow-y-auto pr-0.5">
            {usersList
              .filter(u =>
                (u.firstName + ' ' + u.lastName).toLowerCase().includes(userSearch.toLowerCase()) ||
                u.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
                String(u.telegramId).includes(userSearch)
              )
              .map((u) => (
                <div key={u.telegramId} className="glass-panel p-3 rounded-[16px] border-white/5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-[#1A1F37] border border-white/10 shrink-0 flex items-center justify-center text-xs font-bold text-slate-300 overflow-hidden">
                      {u.photoUrl
                        ? <img src={u.photoUrl} alt="" className="w-full h-full object-cover" />
                        : (u.firstName?.[0] ?? 'E').toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-white truncate">{u.firstName} {u.lastName}</span>
                        {u.isTelegramPremium && <Star size={9} className="text-accent-cyan shrink-0" />}
                        {u.banStatus !== 'none' && <span className="text-[8px] text-accent-danger font-bold">BANNED</span>}
                        {u.flagCount > 0 && <span className="text-[8px] text-accent-warning font-bold">🚩{u.flagCount}</span>}
                      </div>
                      <span className="text-[9px] text-slate-500">@{u.username || 'no_username'} • {u.telegramId}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-[9px] font-black text-accent-cyan">{(u.points || 0).toLocaleString()} EF</span>
                      <span className="text-[8px] text-slate-500">${u.wallet ?? 0} USDT</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-1.5 mt-2.5">
                    <button
                      onClick={() => startEditUser(u)}
                      className="flex-1 h-7 rounded-lg bg-white/5 border border-white/8 text-[9px] font-bold text-slate-300 hover:text-white flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Edit3 size={9} /> Edit
                    </button>
                    <button
                      onClick={() => handleFlagUser(u)}
                      className="flex-1 h-7 rounded-lg bg-accent-warning/10 border border-accent-warning/20 text-[9px] font-bold text-accent-warning hover:bg-accent-warning/20 flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      🚩 Flag
                    </button>
                    {u.banStatus !== 'none' ? (
                      <button
                        onClick={() => handleUnbanUser(u)}
                        className="flex-1 h-7 rounded-lg bg-accent-success/10 border border-accent-success/20 text-[9px] font-bold text-accent-success hover:bg-accent-success/20 flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Check size={9} /> Unban
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBanUser(u)}
                        className="flex-1 h-7 rounded-lg bg-accent-danger/10 border border-accent-danger/20 text-[9px] font-bold text-accent-danger hover:bg-accent-danger/20 flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Ban size={9} /> Ban
                      </button>
                    )}
                  </div>
                </div>
              ))}

            {usersList.length === 0 && !loadingUsers && (
              <div className="text-center py-8 text-slate-500 text-xs">No registered users found.</div>
            )}
          </div>

          {/* Edit User Modal */}
          {editingUser && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
              <div className="glass-panel p-5 rounded-[24px] border-white/8 w-full max-w-[420px] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white">Edit: {editingUser.firstName}</h3>
                  <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
                {[
                  { label: 'EForce Points', value: editPoints, set: setEditPoints },
                  { label: 'EForce Tokens', value: editTokens, set: setEditTokens },
                  { label: 'USDT Balance', value: editWallet, set: setEditWallet },
                  { label: 'Referrals', value: editReferrals, set: setEditReferrals },
                ].map(field => (
                  <div key={field.label} className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">{field.label}</label>
                    <input
                      type="number"
                      value={field.value}
                      onChange={e => field.set(Number(e.target.value))}
                      className="bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-accent-cyan"
                    />
                  </div>
                ))}
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Risk Level</label>
                  <select
                    value={editRiskLevel}
                    onChange={e => setEditRiskLevel(e.target.value as 'safe' | 'medium' | 'high')}
                    className="bg-[#12182D] border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-accent-cyan"
                  >
                    <option value="safe">🟢 Safe</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High Risk</option>
                  </select>
                </div>
                <button
                  onClick={handleSaveUser}
                  disabled={savingUser}
                  className="w-full h-10 bg-[#FF8A00] hover:bg-[#FF8A00]/90 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingUser ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  {savingUser ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ TASKS TAB ============ */}
      {activeTab === 'tasks' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Task Management</span>
            <button
              onClick={() => { setEditingTask(null); setShowTaskForm(true); }}
              className="flex items-center gap-1 text-[9px] bg-[#FF8A00] text-white px-3 py-1.5 rounded-xl font-bold cursor-pointer hover:bg-[#FF8A00]/90 transition-all"
            >
              <Plus size={10} /> New Task
            </button>
          </div>

          {/* Task Form Modal */}
          {showTaskForm && (
            <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center p-4">
              <div className="glass-panel p-5 rounded-[24px] border-white/8 w-full max-w-[420px] flex flex-col gap-3 max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-white">{editingTask ? 'Edit Task' : 'New Task'}</h3>
                  <button onClick={() => setShowTaskForm(false)} className="text-slate-400 hover:text-white cursor-pointer"><X size={16} /></button>
                </div>

                {[
                  { label: 'Title', key: 'title', type: 'text' },
                  { label: 'Description', key: 'description', type: 'text' },
                  { label: 'URL (optional)', key: 'url', type: 'text' },
                  { label: 'EForce Reward', key: 'reward', type: 'number' },
                  { label: 'Daily Limit (0 = unlimited)', key: 'dailyLimit', type: 'number' },
                  { label: 'Total Limit (0 = unlimited)', key: 'totalCompletionLimit', type: 'number' },
                  { label: 'Expiry Date (optional)', key: 'expiryDate', type: 'date' },
                ].map(f => (
                  <div key={f.key} className="flex flex-col gap-1">
                    <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">{f.label}</label>
                    <input
                      type={f.type}
                      value={(taskForm as any)[f.key]}
                      onChange={e => setTaskForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                      className="bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-accent-cyan"
                    />
                  </div>
                ))}

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Task Type</label>
                  <select
                    value={taskForm.type}
                    onChange={e => setTaskForm(prev => ({ ...prev, type: e.target.value as TaskType }))}
                    className="bg-[#12182D] border border-white/8 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="channel">Telegram Channel</option>
                    <option value="group">Telegram Group</option>
                    <option value="x">Follow on X</option>
                    <option value="website">Visit Website</option>
                    <option value="video">Watch Video</option>
                    <option value="daily">Daily Mission</option>
                    <option value="ad">Reward Ad</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  {[
                    { label: 'Enabled', key: 'isEnabled' },
                    { label: 'Auto Approve', key: 'autoApprove' },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setTaskForm(prev => ({ ...prev, [f.key]: !(prev as any)[f.key] }))}
                      className={`flex-1 h-8 rounded-xl border text-[9px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                        (taskForm as any)[f.key]
                          ? 'bg-accent-success/15 border-accent-success/25 text-accent-success'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      {(taskForm as any)[f.key] ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                      {f.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleSaveTask}
                  className="w-full h-10 bg-[#FF8A00] hover:bg-[#FF8A00]/90 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save size={14} /> {editingTask ? 'Update Task' : 'Create Task'}
                </button>
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="flex flex-col gap-2">
            {tasks.map(task => (
              <div key={task.id} className={`glass-panel p-3.5 rounded-[18px] border-white/5 ${!task.isEnabled ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-bold text-white block truncate">{task.title}</span>
                    <span className="text-[9px] text-slate-500">{task.type} • +{task.reward} EF • {task.completedCount} completions</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => handleToggleTask(task)} className="text-slate-400 hover:text-accent-cyan cursor-pointer">
                      {task.isEnabled ? <ToggleRight size={14} className="text-accent-success" /> : <ToggleLeft size={14} />}
                    </button>
                    <button onClick={() => startEditTask(task)} className="text-slate-400 hover:text-white cursor-pointer">
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => handleDeleteTask(task)} className="text-slate-400 hover:text-accent-danger cursor-pointer">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs">No tasks yet. Create your first task!</div>
            )}
          </div>
        </div>
      )}

      {/* ============ WITHDRAWALS TAB ============ */}
      {activeTab === 'withdrawals' && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Withdrawal Queue</span>

          {/* Filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {(['all', 'Pending', 'Approved', 'Rejected', 'Banned'] as const).map(f => (
              <button
                key={f}
                onClick={() => setWithdrawFilter(f)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-all ${
                  withdrawFilter === f ? 'bg-[#FF8A00] border-[#FF8A00] text-white' : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                {f} {f !== 'all' && `(${withdrawals.filter(w => w.status === f).length})`}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {withdrawals
              .filter(w => withdrawFilter === 'all' || w.status === withdrawFilter)
              .map((req) => (
                <div key={req.id} className="glass-panel p-3.5 rounded-[18px] border-white/5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-white block">@{req.username || 'Unknown'}</span>
                      <span className="text-[9px] text-slate-500">{req.walletAddress?.slice(0, 10)}...{req.walletAddress?.slice(-6)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-black text-accent-success">${req.amount} USDT</span>
                      <span className={`block text-[8px] font-bold ${
                        req.status === 'Pending' ? 'text-accent-warning' :
                        req.status === 'Approved' ? 'text-accent-success' :
                        req.status === 'Banned' ? 'text-accent-danger' : 'text-slate-400'
                      }`}>{req.status}</span>
                    </div>
                  </div>

                  {req.status === 'Pending' && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleWithdrawAction(req.id, 'Approved')}
                        className="flex-1 h-7 bg-accent-success/15 border border-accent-success/25 text-accent-success text-[9px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer">
                        <Check size={9} /> Approve
                      </button>
                      <button onClick={() => handleWithdrawAction(req.id, 'Rejected')}
                        className="flex-1 h-7 bg-white/5 border border-white/10 text-slate-400 text-[9px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer">
                        <X size={9} /> Reject
                      </button>
                      <button onClick={() => handleWithdrawAction(req.id, 'Banned')}
                        className="flex-1 h-7 bg-accent-danger/10 border border-accent-danger/20 text-accent-danger text-[9px] font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer">
                        <Ban size={9} /> Ban
                      </button>
                    </div>
                  )}
                </div>
              ))}
            {withdrawals.filter(w => withdrawFilter === 'all' || w.status === withdrawFilter).length === 0 && (
              <div className="text-center py-8 text-slate-500 text-xs">No {withdrawFilter !== 'all' ? withdrawFilter.toLowerCase() : ''} requests.</div>
            )}
          </div>
        </div>
      )}

      {/* ============ SECURITY TAB ============ */}
      {activeTab === 'security' && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Security Overview</span>

          <div className="grid grid-cols-2 gap-3">
            <div className="glass-panel p-3.5 rounded-[18px] border-white/5">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">🚩 Flagged</span>
              <span className="text-xl font-black text-accent-warning">{kpi.flagged}</span>
            </div>
            <div className="glass-panel p-3.5 rounded-[18px] border-white/5">
              <span className="text-[9px] text-slate-500 uppercase font-bold block">🚫 Banned</span>
              <span className="text-xl font-black text-accent-danger">{kpi.banned}</span>
            </div>
          </div>

          {/* Flagged Users List */}
          <div className="glass-panel p-4 rounded-[20px] border-white/6">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold block mb-3">Flagged Users</span>
            <div className="flex flex-col gap-2">
              {usersList.filter(u => u.flagCount > 0).map(u => (
                <div key={u.telegramId} className="flex items-center justify-between bg-white/[0.02] border border-accent-warning/15 rounded-xl p-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-white">{u.firstName} {u.lastName}</span>
                    <span className="text-[9px] text-slate-500 block">🚩 {u.flagCount} flags • Risk: {u.riskLevel}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleUnbanUser(u)}
                      className="h-6 px-2 bg-accent-success/10 border border-accent-success/20 text-accent-success text-[8px] font-bold rounded-lg cursor-pointer">
                      Unban
                    </button>
                    <button onClick={() => handleBanUser(u)}
                      className="h-6 px-2 bg-accent-danger/10 border border-accent-danger/20 text-accent-danger text-[8px] font-bold rounded-lg cursor-pointer">
                      Ban
                    </button>
                  </div>
                </div>
              ))}
              {usersList.filter(u => u.flagCount > 0).length === 0 && (
                <div className="text-center py-4 text-slate-500 text-xs">No flagged users. System is clean ✅</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============ SETTINGS TAB ============ */}
      {activeTab === 'settings' && (
        <div className="flex flex-col gap-6">
          <div>
            <span className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-bold">Global Configuration</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Economy & Auto Miner */}
            <div className="flex flex-col gap-6">
              {/* Economy */}
              <div className="glass-panel p-5 md:p-6 rounded-[24px] border-white/6 flex flex-col gap-4 shadow-lg">
                <span className="text-xs md:text-sm text-slate-300 font-bold uppercase tracking-wider block mb-1">💰 Economy</span>
                <div className="flex flex-col gap-1">
                  {[
                    { label: 'Swap Rate (EForce Points per 1 EForce Token)', key: 'swapRate' },
                    { label: 'EForce Token Value (USD)', key: 'eforceTokenValue' },
                    { label: 'Tap Reward (EForce)', key: 'tapReward' },
                    { label: 'Combo Multiplier (x)', key: 'comboReward' },
                    { label: 'Max Energy', key: 'energyMax' },
                  ].map(f => (
                    <div key={f.key} className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.03] last:border-0">
                      <label className="text-xs md:text-sm text-slate-400 font-medium">{f.label}</label>
                      <input
                        type="number"
                        value={(settings as any)[f.key]}
                        onChange={e => setSettings(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                        className="w-28 md:w-32 bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-xs md:text-sm text-white outline-none focus:border-accent-cyan text-right transition-all"
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-3">
                    <label className="text-xs md:text-sm text-slate-400 font-medium">Swap Portal Open</label>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, swapOpen: !prev.swapOpen }))}
                      className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${settings.swapOpen ? 'bg-accent-success' : 'bg-white/10'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-all absolute top-0.5 left-0.5 ${settings.swapOpen ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Auto Miner */}
              <div className="glass-panel p-5 md:p-6 rounded-[24px] border-white/6 flex flex-col gap-4 shadow-lg">
                <span className="text-xs md:text-sm text-slate-300 font-bold uppercase tracking-wider block mb-1">⛏️ Auto Miner</span>
                <div className="flex flex-col gap-1">
                  {[
                    { label: 'Duration (seconds)', key: 'autoMinerDuration' },
                    { label: 'Reward per Session (EForce)', key: 'autoMinerReward' },
                    { label: 'Cooldown (seconds)', key: 'autoMinerCooldown' },
                  ].map(f => (
                    <div key={f.key} className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.03] last:border-0">
                      <label className="text-xs md:text-sm text-slate-400 font-medium">{f.label}</label>
                      <input
                        type="number"
                        value={(settings as any)[f.key]}
                        onChange={e => setSettings(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                        className="w-28 md:w-32 bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-xs md:text-sm text-white outline-none focus:border-accent-cyan text-right transition-all"
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-3">
                    <label className="text-xs md:text-sm text-slate-400 font-medium">Premium Only</label>
                    <button
                      onClick={() => setSettings(prev => ({ ...prev, autoMinerPremiumOnly: !prev.autoMinerPremiumOnly }))}
                      className={`w-12 h-6 rounded-full transition-all cursor-pointer relative ${settings.autoMinerPremiumOnly ? 'bg-accent-cyan' : 'bg-white/10'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-all absolute top-0.5 left-0.5 ${settings.autoMinerPremiumOnly ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Referral & Daily Check-in */}
            <div className="flex flex-col gap-6">
              {/* Referral & Withdraw */}
              <div className="glass-panel p-5 md:p-6 rounded-[24px] border-white/6 flex flex-col gap-4 shadow-lg">
                <span className="text-xs md:text-sm text-slate-300 font-bold uppercase tracking-wider block mb-1">🔗 Referral & Withdrawal</span>
                <div className="flex flex-col gap-1">
                  {[
                    { label: 'Referral USDT Reward', key: 'referralRewardUsdt' },
                    { label: 'Referral Token Reward', key: 'referralRewardToken' },
                    { label: 'Min Referrals to Withdraw', key: 'withdrawMinReferrals' },
                    { label: 'Min Withdraw Amount (USDT)', key: 'withdrawMinAmount' },
                  ].map(f => (
                    <div key={f.key} className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.03] last:border-0">
                      <label className="text-xs md:text-sm text-slate-400 font-medium">{f.label}</label>
                      <input
                        type="number"
                        value={(settings as any)[f.key]}
                        onChange={e => setSettings(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                        className="w-28 md:w-32 bg-white/5 border border-white/8 rounded-xl px-3 py-1.5 text-xs md:text-sm text-white outline-none focus:border-accent-cyan text-right transition-all"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Claim Rewards */}
              <div className="glass-panel p-5 md:p-6 rounded-[24px] border-white/6 flex flex-col gap-4 shadow-lg">
                <span className="text-xs md:text-sm text-slate-300 font-bold uppercase tracking-wider block mb-1">📅 Daily Check-in Rewards</span>
                <div className="grid grid-cols-4 gap-3">
                  {settings.dailyClaimRewards.map((reward, i) => (
                    <div key={i} className="flex flex-col gap-1 bg-white/[0.02] border border-white/5 rounded-xl p-2 items-center">
                      <label className="text-[10px] text-slate-500 text-center font-bold">Day {i + 1}</label>
                      <input
                        type="number"
                        value={reward}
                        onChange={e => {
                          const newRewards = [...settings.dailyClaimRewards];
                          newRewards[i] = Number(e.target.value);
                          setSettings(prev => ({ ...prev, dailyClaimRewards: newRewards }));
                        }}
                        className="w-full bg-white/5 border border-white/8 rounded-lg px-1 py-1 text-xs text-white outline-none text-center focus:border-accent-cyan"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="w-full h-12 bg-[#FF8A00] hover:bg-[#FF8A00]/90 text-white font-bold rounded-[18px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-md mt-2"
          >
            {savingSettings ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {savingSettings ? 'Saving to Firestore...' : 'Save All Settings'}
          </button>
        </div>
      )}
    </div>
  );
};
