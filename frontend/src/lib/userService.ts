// Firestore User Service
// Handles creating, reading, and updating user documents

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
  getCountFromServer,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { TelegramUser } from './telegramUser';

export interface FirestoreUser {
  telegramId: number;
  username: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  isTelegramPremium: boolean;
  points: number;
  wallet: number;
  referrals: number;
  country: string;
  lastSeen: unknown;        // Firestore ServerTimestamp
  isOnline: boolean;
  createdAt: unknown;
  device: {
    platform: string;
    browser: string;
    os: string;
    resolution: string;
    language: string;
    timezone: string;
  };
  riskLevel: 'safe' | 'medium' | 'high';
  totalDailyPoints: number;
}

const USERS_COLLECTION = 'users';

/**
 * Creates or updates a user document in Firestore on app load.
 * Uses the Telegram user ID as the document ID.
 */
export const upsertUser = async (
  telegramUser: TelegramUser,
  deviceInfo: { platform: string; browser: string; os: string; resolution: string; language: string; timezone: string },
  localPoints: number
): Promise<void> => {
  if (!isFirebaseConfigured()) return;

  const userRef = doc(db, USERS_COLLECTION, String(telegramUser.id));
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    // New user — create document
    await setDoc(userRef, {
      telegramId: telegramUser.id,
      username: telegramUser.username || '',
      firstName: telegramUser.firstName || '',
      lastName: telegramUser.lastName || '',
      photoUrl: telegramUser.photoUrl || '',
      isTelegramPremium: telegramUser.isPremium,
      points: localPoints,
      wallet: 0,
      referrals: 0,
      country: 'Unknown',
      isOnline: true,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      device: deviceInfo,
      riskLevel: 'safe',
      totalDailyPoints: 0,
    } satisfies Partial<FirestoreUser>);
  } else {
    // Existing user — update presence and profile
    await updateDoc(userRef, {
      firstName: telegramUser.firstName || '',
      lastName: telegramUser.lastName || '',
      photoUrl: telegramUser.photoUrl || '',
      isTelegramPremium: telegramUser.isPremium,
      isOnline: true,
      lastSeen: serverTimestamp(),
      device: deviceInfo,
    });
  }
};

/**
 * Sets the user offline (call on window beforeunload).
 */
export const setUserOffline = async (telegramId: number): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  const userRef = doc(db, USERS_COLLECTION, String(telegramId));
  try {
    await updateDoc(userRef, {
      isOnline: false,
      lastSeen: serverTimestamp(),
    });
  } catch { /* ignore — may fail if connection drops */ }
};

/**
 * Syncs local points balance to Firestore.
 * Called after tap events and reward claims.
 */
export const syncPointsToFirestore = async (telegramId: number, points: number): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  const userRef = doc(db, USERS_COLLECTION, String(telegramId));
  try {
    await updateDoc(userRef, { points });
  } catch { /* noop — will sync next time */ }
};

/**
 * Gets the real-time count of online users in Firestore.
 */
export const getOnlineUserCount = async (): Promise<number> => {
  if (!isFirebaseConfigured()) return 0;
  const q = query(collection(db, USERS_COLLECTION), where('isOnline', '==', true));
  const snapshot = await getCountFromServer(q);
  return snapshot.data().count;
};

/**
 * Subscribes to real-time user document updates.
 * Returns the unsubscribe function.
 */
export const subscribeToUser = (
  telegramId: number,
  callback: (data: FirestoreUser | null) => void
): (() => void) => {
  if (!isFirebaseConfigured()) return () => {};
  const userRef = doc(db, USERS_COLLECTION, String(telegramId));
  return onSnapshot(userRef, (snap) => {
    callback(snap.exists() ? (snap.data() as FirestoreUser) : null);
  });
};

/**
 * Updates the risk level of a user (called by anti-cheat system).
 */
export const updateRiskLevel = async (
  telegramId: number,
  riskLevel: 'safe' | 'medium' | 'high'
): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  const userRef = doc(db, USERS_COLLECTION, String(telegramId));
  try {
    await updateDoc(userRef, { riskLevel });
  } catch { /* noop */ }
};

/**
 * Admin: Fetches all registered users from Firestore.
 */
export const getAllUsers = async (): Promise<FirestoreUser[]> => {
  if (!isFirebaseConfigured()) return [];
  try {
    const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users: FirestoreUser[] = [];
    querySnapshot.forEach((docSnap) => {
      users.push(docSnap.data() as FirestoreUser);
    });
    return users;
  } catch {
    return [];
  }
};

/**
 * Admin: Directly updates any user's fields in Firestore.
 */
export const updateUserDatabaseValues = async (
  telegramId: number,
  updates: { points?: number; wallet?: number; referrals?: number; riskLevel?: 'safe' | 'medium' | 'high' }
): Promise<boolean> => {
  if (!isFirebaseConfigured()) return false;
  const userRef = doc(db, USERS_COLLECTION, String(telegramId));
  try {
    await updateDoc(userRef, updates);
    return true;
  } catch {
    return false;
  }
};

/**
 * Fetches top users sorted by points for the leaderboard.
 */
export const getLeaderboardUsers = async (limitCount = 10): Promise<FirestoreUser[]> => {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(
      collection(db, USERS_COLLECTION),
      orderBy('points', 'desc'),
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    const users: FirestoreUser[] = [];
    querySnapshot.forEach((docSnap) => {
      users.push(docSnap.data() as FirestoreUser);
    });
    return users;
  } catch {
    return [];
  }
};


