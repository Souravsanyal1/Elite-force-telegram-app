// Anti-Cheat System for EForce Tap-to-Earn
// Tracks tap rate, daily limits, and suspicious patterns

const DAILY_TAP_CAP = 50000;          // max EForce points per day from tapping
const SUSPICIOUS_RATE_THRESHOLD = 8;  // taps/sec that triggers medium risk
const BOT_RATE_THRESHOLD = 10;        // taps/sec that triggers high risk

export type RiskLevel = 'safe' | 'medium' | 'high';

interface TapWindow {
  timestamps: number[];
  dailyPoints: number;
  dailyResetDate: string; // "YYYY-MM-DD"
  consecutiveMaxRateCount: number;
  riskLevel: RiskLevel;
}

const STATE_KEY = 'eforce_anticheat';

const getTodayDate = (): string => new Date().toISOString().slice(0, 10);

const loadState = (): TapWindow => {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TapWindow;
      // Reset daily points if it's a new day
      if (parsed.dailyResetDate !== getTodayDate()) {
        return {
          timestamps: [],
          dailyPoints: 0,
          dailyResetDate: getTodayDate(),
          consecutiveMaxRateCount: 0,
          riskLevel: 'safe',
        };
      }
      return parsed;
    }
  } catch { /* noop */ }
  return {
    timestamps: [],
    dailyPoints: 0,
    dailyResetDate: getTodayDate(),
    consecutiveMaxRateCount: 0,
    riskLevel: 'safe',
  };
};

const saveState = (state: TapWindow): void => {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
};

/**
 * Records a tap and returns:
 * - `allowed`: whether this tap should be credited
 * - `riskLevel`: updated risk assessment
 * - `reason`: human-readable rejection reason if not allowed
 */
export const recordTap = (pointsToAdd: number): {
  allowed: boolean;
  riskLevel: RiskLevel;
  reason?: string;
} => {
  const state = loadState();
  const now = Date.now();

  // Prune timestamps older than 1 second
  const recentWindow = state.timestamps.filter(t => now - t < 1000);
  recentWindow.push(now);

  const tapsPerSec = recentWindow.length;

  // Check bot-level tapping
  if (tapsPerSec >= BOT_RATE_THRESHOLD) {
    state.consecutiveMaxRateCount++;
    state.riskLevel = 'high';
    state.timestamps = recentWindow;
    saveState(state);
    return { allowed: false, riskLevel: 'high', reason: 'Auto-tap detected. Slow down.' };
  }

  // Check suspicious tapping
  if (tapsPerSec >= SUSPICIOUS_RATE_THRESHOLD) {
    state.consecutiveMaxRateCount++;
    state.riskLevel = state.consecutiveMaxRateCount > 10 ? 'high' : 'medium';
    state.timestamps = recentWindow;
    state.dailyPoints += pointsToAdd;
    saveState(state);
    return { allowed: true, riskLevel: state.riskLevel };
  }

  // Gradually reduce risk if tapping normally
  if (state.consecutiveMaxRateCount > 0) {
    state.consecutiveMaxRateCount = Math.max(0, state.consecutiveMaxRateCount - 1);
  }
  if (state.riskLevel === 'medium' && state.consecutiveMaxRateCount === 0) {
    state.riskLevel = 'safe';
  }

  // Check daily cap
  if (state.dailyPoints >= DAILY_TAP_CAP) {
    saveState(state);
    return { allowed: false, riskLevel: state.riskLevel, reason: 'Daily EForce mining limit reached. Resets at 00:00 UTC.' };
  }

  state.timestamps = recentWindow;
  state.dailyPoints += pointsToAdd;
  saveState(state);
  return { allowed: true, riskLevel: state.riskLevel };
};

/**
 * Returns the current risk level without recording a tap.
 */
export const getRiskLevel = (): RiskLevel => {
  return loadState().riskLevel;
};

/**
 * Returns today's total points earned from tapping.
 */
export const getDailyPoints = (): number => {
  return loadState().dailyPoints;
};

/**
 * Returns how many points remain before the daily cap.
 */
export const getRemainingDailyPoints = (): number => {
  return Math.max(0, DAILY_TAP_CAP - loadState().dailyPoints);
};

/**
 * Gets an emoji + color class for the risk level (for Admin UI).
 */
export const getRiskDisplay = (risk: RiskLevel): { emoji: string; colorClass: string; label: string } => {
  switch (risk) {
    case 'safe':   return { emoji: '🟢', colorClass: 'text-accent-success', label: 'Safe' };
    case 'medium': return { emoji: '🟡', colorClass: 'text-accent-warning', label: 'Medium' };
    case 'high':   return { emoji: '🔴', colorClass: 'text-accent-danger',  label: 'High Risk' };
  }
};
