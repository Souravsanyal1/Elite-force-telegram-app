// Referral Service — Elite Force (EForce)
// Handles referral tracking, validation, and reward logic

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

export interface ReferralRecord {
  id: string;
  referrerId: number;      // Telegram ID who referred
  referredId: number;      // Telegram ID who was referred
  createdAt: unknown;
  isValid: boolean;
  rewardPaid: boolean;
  deviceMatch: boolean;    // true = same device fingerprint (suspicious)
  networkSuspicion: boolean; // true = flagged for network-level issues
  rewardUsdt: number;
  rewardTokens: number;
}

const REFERRALS_COLLECTION = 'referrals';

/**
 * Generates the referral link for a user.
 */
export const getReferralLink = (telegramId: number, botUsername = 'EliteForceBot'): string => {
  return `https://t.me/${botUsername}?start=ref_${telegramId}`;
};

/**
 * Parses the referrer ID from Telegram WebApp start param.
 * Returns null if no referral param found.
 */
export const parseReferralFromStartParam = (): number | null => {
  try {
    const tg = (window as any).Telegram?.WebApp;
    const startParam = tg?.initDataUnsafe?.start_param || '';
    if (startParam.startsWith('ref_')) {
      const id = parseInt(startParam.replace('ref_', ''), 10);
      return isNaN(id) ? null : id;
    }
  } catch { /* noop */ }
  return null;
};

/**
 * Records a referral relationship in Firestore after multi-signal validation.
 */
export const recordReferral = async (
  referrerId: number,
  referredId: number,
  deviceFingerprint: string,
  referrerDeviceFingerprint?: string
): Promise<{ recorded: boolean; valid: boolean; reason?: string }> => {
  if (!isFirebaseConfigured()) return { recorded: false, valid: false };
  if (referrerId === referredId) return { recorded: false, valid: false, reason: 'Self-referral detected.' };

  const docId = `${referrerId}_${referredId}`;
  const ref = doc(db, REFERRALS_COLLECTION, docId);

  // Check if already recorded
  const existing = await getDoc(ref);
  if (existing.exists()) return { recorded: false, valid: false, reason: 'Referral already recorded.' };

  // Check if referred user already has a referrer
  const existingReferral = await getDocs(
    query(collection(db, REFERRALS_COLLECTION), where('referredId', '==', referredId))
  );
  if (!existingReferral.empty) {
    return { recorded: false, valid: false, reason: 'User already has a referrer.' };
  }

  // Check device fingerprint match (suspicious if same)
  const deviceMatch = !!(referrerDeviceFingerprint && deviceFingerprint === referrerDeviceFingerprint);

  // Mark as suspicious if device matches but don't outright block
  // (legitimate family members may share a device)
  const isValid = !deviceMatch; // Auto-invalid only on exact device match

  await setDoc(ref, {
    referrerId,
    referredId,
    createdAt: serverTimestamp(),
    isValid,
    rewardPaid: false,
    deviceMatch,
    networkSuspicion: false,
    rewardUsdt: isValid ? 0.05 : 0,
    rewardTokens: isValid ? 10 : 0,
  } satisfies Omit<ReferralRecord, 'id'>);

  // Update referrer's referral count in users collection
  if (isValid) {
    try {
      const userRef = doc(db, 'users', String(referrerId));
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const current = (userSnap.data().referrals as number) || 0;
        await updateDoc(userRef, { referrals: current + 1 });
      }
    } catch { /* noop */ }
  }

  return { recorded: true, valid: isValid };
};

/**
 * Gets all referrals made by a specific user.
 */
export const getUserReferrals = async (telegramId: number): Promise<ReferralRecord[]> => {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(
      collection(db, REFERRALS_COLLECTION),
      where('referrerId', '==', telegramId)
    );
    const snap = await getDocs(q);
    const records: ReferralRecord[] = [];
    snap.forEach((d) => records.push({ id: d.id, ...d.data() } as ReferralRecord));
    return records;
  } catch {
    return [];
  }
};

/**
 * Subscribe to real-time referral count for a user.
 */
export const subscribeToReferralCount = (
  telegramId: number,
  callback: (count: number, validCount: number) => void
): (() => void) => {
  if (!isFirebaseConfigured()) return () => {};
  const q = query(
    collection(db, REFERRALS_COLLECTION),
    where('referrerId', '==', telegramId)
  );
  return onSnapshot(q, (snap) => {
    let total = 0;
    let valid = 0;
    snap.forEach((d) => {
      total++;
      if ((d.data() as ReferralRecord).isValid) valid++;
    });
    callback(total, valid);
  });
};

/**
 * Admin: Get all referrals (for fraud detection).
 */
export const getAllReferrals = async (): Promise<ReferralRecord[]> => {
  if (!isFirebaseConfigured()) return [];
  try {
    const snap = await getDocs(collection(db, REFERRALS_COLLECTION));
    const records: ReferralRecord[] = [];
    snap.forEach((d) => records.push({ id: d.id, ...d.data() } as ReferralRecord));
    return records;
  } catch {
    return [];
  }
};
