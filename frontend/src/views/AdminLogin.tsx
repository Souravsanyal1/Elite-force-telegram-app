import React, { useState } from 'react';
import { Shield, Key, ArrowRight, Eye, EyeOff, Hash } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

// Authorized admin Telegram IDs — these users can access the console
const AUTHORIZED_ADMIN_IDS = ['3504353451'];

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, showToast }) => {
  const [telegramId, setTelegramId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId || !password) {
      showToast("Please fill in all credentials.", "warning");
      return;
    }

    setLoading(true);

    // ── Method 1: Telegram ID based auth (primary) ──────────────────────────
    if (AUTHORIZED_ADMIN_IDS.includes(telegramId.trim())) {
      if (!isFirebaseConfigured()) {
        // Dev mode fallback
        setTimeout(() => {
          setLoading(false);
          if (password === 'admin123') {
            showToast("Dev mode: Admin session authorized.", "success");
            onLoginSuccess();
          } else {
            showToast("Invalid password. Access Denied.", "error");
          }
        }, 800);
        return;
      }

      // Verify password stored in Firestore adminSettings
      try {
        const settingsRef = doc(db, 'adminSettings', 'config');
        const settingsSnap = await getDoc(settingsRef);

        let storedPassword = 'admin123'; // default password
        if (settingsSnap.exists()) {
          storedPassword = settingsSnap.data()?.adminPassword ?? 'admin123';
        } else {
          // First time: create admin settings with default password
          await setDoc(settingsRef, { adminPassword: 'admin123' }, { merge: true });
        }

        if (password === storedPassword) {
          // Store admin session in localStorage
          localStorage.setItem('admin_session', JSON.stringify({
            telegramId: telegramId.trim(),
            loginTime: Date.now(),
            expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
          }));
          showToast("✅ Admin session authorized.", "success");
          setLoading(false);
          onLoginSuccess();
        } else {
          showToast("Invalid password. Access Denied.", "error");
          setLoading(false);
        }
      } catch (err) {
        console.error("Admin auth error:", err);
        showToast("Authentication error. Please try again.", "error");
        setLoading(false);
      }
      return;
    }

    // ── Method 2: Firebase Email Auth fallback (for old email-based login) ──
    if (!isFirebaseConfigured()) {
      setLoading(false);
      showToast("Unauthorized ID. Access Denied.", "error");
      return;
    }

    // Try as email/password with Firebase Auth
    try {
      await signInWithEmailAndPassword(auth, telegramId, password);
      showToast("Firebase Auth ✓ — Authorized Admin session.", "success");
      setLoading(false);
      onLoginSuccess();
    } catch {
      setLoading(false);
      showToast("Unauthorized ID. Access Denied.", "error");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] px-4 select-none">
      <div className="w-full max-w-[340px] glass-panel p-6 rounded-[28px] border-white/8 relative overflow-hidden shadow-[0_20px_50px_rgba(179,136,255,0.05)]">
        {/* Lights */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-accent-purple/10 rounded-full filter blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-cyan/10 rounded-full filter blur-xl"></div>

        {/* Shield Icon */}
        <div className="w-14 h-14 rounded-full bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center mx-auto mb-4 text-accent-purple">
          <Shield size={26} className="animate-pulse" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-lg font-black text-white tracking-wide uppercase">EForce Console</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Ecosystem Authorization</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Telegram ID field */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider pl-1">Admin Telegram ID</span>
            <div className="flex items-center gap-2 bg-[#12182D] border border-white/8 rounded-xl px-3.5 py-2 focus-within:border-accent-cyan transition-all">
              <Hash size={14} className="text-slate-500 shrink-0" />
              <input
                type="text"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Your Telegram ID"
                className="bg-transparent border-none outline-none text-xs text-white w-full placeholder-slate-600"
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider pl-1">Security Password</span>
            <div className="flex items-center gap-2 bg-[#12182D] border border-white/8 rounded-xl px-3.5 py-2 focus-within:border-accent-cyan transition-all">
              <Key size={14} className="text-slate-500 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent border-none outline-none text-xs text-white w-full placeholder-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-gradient-to-r from-accent-purple to-accent-blue hover:shadow-[0_0_20px_rgba(179,136,255,0.25)] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
            ) : (
              <>
                <span>Sign In to Console</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="text-[10px] text-slate-600 mt-6 text-center leading-normal uppercase font-bold tracking-widest">
        🔐 Controlled node environment. Unauthorized access is recorded.
      </div>
    </div>
  );
};
