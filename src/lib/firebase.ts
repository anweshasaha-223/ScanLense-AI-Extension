import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDocFromServer,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with custom databaseId if configured
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot per Firebase skill guidelines
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
    return false;
  }
}
testFirestoreConnection();

// Unified User representation supporting both Firebase Auth and Portable Cross-Domain Sessions
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isPortableSession?: boolean;
}

const PORTABLE_USER_STORAGE_KEY = 'scamlens_portable_user_v1';
const authListeners = new Set<(user: AppUser | null) => void>();

function getStoredPortableUser(): AppUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PORTABLE_USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppUser;
  } catch {
    return null;
  }
}

function notifyAuthListeners(user: AppUser | null) {
  for (const cb of authListeners) {
    try {
      cb(user);
    } catch {
      // ignore listener error
    }
  }
}

export function onAuthStateChanged(
  _authInstance: any,
  callback: (user: AppUser | null) => void
): () => void {
  authListeners.add(callback);

  // Immediately check portable user if Firebase hasn't resolved yet
  const portable = getStoredPortableUser();
  if (portable && !auth.currentUser) {
    callback(portable);
  }

  const unsub = firebaseOnAuthStateChanged(auth, (fbUser) => {
    if (fbUser) {
      const mapped: AppUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        isPortableSession: false,
      };
      callback(mapped);
    } else {
      const fallbackPortable = getStoredPortableUser();
      callback(fallbackPortable);
    }
  });

  // Also check redirect result if returning from mobile Google sign-in redirect
  getRedirectResult(auth)
    .then(async (result) => {
      if (result?.user) {
        await persistFirebaseUserProfile(result.user);
      }
    })
    .catch(() => {
      // ignore redirect check errors on normal page load
    });

  return () => {
    authListeners.delete(callback);
    unsub();
  };
}

async function persistFirebaseUserProfile(user: FirebaseUser) {
  const path = `users/${user.uid}`;
  try {
    await setDoc(
      doc(db, 'users', user.uid),
      {
        uid: user.uid.slice(0, 128),
        email: (user.email || '').slice(0, 256),
        displayName: (user.displayName || 'User').slice(0, 120),
        photoURL: (user.photoURL || '').slice(0, 1024),
        lastLogin: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export interface SignInResult {
  user: AppUser | null;
  errorCode?: string;
  errorMessage?: string;
  requiresModal?: boolean;
}

/**
 * Attempts Google Sign-In via Firebase Popup.
 * Outside localhost (e.g. on Netlify or mobile webviews where auth/unauthorized-domain or popup block can happen),
 * returns structured diagnostic details so the Portable Sign-In Modal can seamlessly authenticate the user.
 */
export async function signInWithGoogle(): Promise<SignInResult> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await persistFirebaseUserProfile(user);

    const appUser: AppUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isPortableSession: false,
    };
    notifyAuthListeners(appUser);
    return { user: appUser };
  } catch (error: any) {
    const code = error?.code || 'auth/unknown';
    const message = error?.message || 'Google sign-in popup could not complete.';
    console.warn('Firebase Google popup notice:', code, message);
    return {
      user: null,
      errorCode: code,
      errorMessage: message,
      requiresModal: true,
    };
  }
}

export async function signInWithGoogleRedirect(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Signs in using a portable session account (works on any external host like Netlify,
 * mobile webviews, or custom domains without requiring Firebase Console domain whitelisting).
 */
export function signInWithPortableProfile(params: {
  name: string;
  email: string;
}): AppUser {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.name.trim() || cleanEmail.split('@')[0] || 'ScamLens User';
  const safeId = 'usr_' + cleanEmail.replace(/[^a-z0-9]/g, '_').slice(0, 48);

  const portableUser: AppUser = {
    uid: safeId,
    email: cleanEmail,
    displayName: cleanName,
    photoURL: null,
    isPortableSession: true,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(PORTABLE_USER_STORAGE_KEY, JSON.stringify(portableUser));
  }
  notifyAuthListeners(portableUser);
  return portableUser;
}

export async function signOutUser() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PORTABLE_USER_STORAGE_KEY);
  }
  try {
    if (auth.currentUser) {
      await firebaseSignOut(auth);
    }
  } catch {
    // ignore
  }
  notifyAuthListeners(null);
}

export type { FirebaseUser };

// Persistence for Analyses (syncs to both localStorage and Firestore when Firebase Auth is active)
export interface StoredAnalysis {
  id: string;
  userId: string;
  risk: string;
  scamTypeName: string;
  summary: string;
  threatScore: number;
  evidenceCount: number;
  linkCount: number;
  userAction: string;
  createdAt: string;
}

function getLocalAnalysesKey(userId: string) {
  return `scamlens_analyses_${userId}`;
}

function saveAnalysisLocally(userId: string, record: StoredAnalysis) {
  if (typeof window === 'undefined') return;
  try {
    const key = getLocalAnalysesKey(userId);
    const existingRaw = localStorage.getItem(key);
    const list: StoredAnalysis[] = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [record, ...list.filter((i) => i.id !== record.id)].slice(0, 25);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // ignore storage quota errors
  }
}

function getLocalAnalyses(userId: string): StoredAnalysis[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getLocalAnalysesKey(userId));
    return raw ? (JSON.parse(raw) as StoredAnalysis[]) : [];
  } catch {
    return [];
  }
}

export async function saveAnalysisToFirestore(
  userId: string,
  analysis: Omit<StoredAnalysis, 'id' | 'userId' | 'createdAt'>
) {
  const createdAt = new Date().toISOString();
  const localId = `loc_${Date.now()}`;
  const sanitizedPayload = {
    userId: userId.slice(0, 128),
    risk: String(analysis.risk || 'UNCERTAIN').slice(0, 32),
    scamTypeName: String(analysis.scamTypeName || 'Scam Assessment').slice(0, 200),
    summary: String(analysis.summary || '').slice(0, 2000),
    threatScore: Number(analysis.threatScore || 0),
    evidenceCount: Number(analysis.evidenceCount || 0),
    linkCount: Number(analysis.linkCount || 0),
    userAction: String(analysis.userAction || 'RECEIVED_ONLY').slice(0, 64),
    createdAt,
  };

  // Always save locally so history works on every domain immediately
  saveAnalysisLocally(userId, { id: localId, ...sanitizedPayload });

  // If authenticated with real Firebase Auth, also persist to Firestore
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return localId;
  }

  const path = `users/${userId}/analyses`;
  try {
    const colRef = collection(db, 'users', userId, 'analyses');
    const docRef = await addDoc(colRef, sanitizedPayload);
    return docRef.id;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
    console.warn('Firestore analysis sync fell back to local storage:', err);
    return localId;
  }
}

export async function getUserAnalyses(userId: string): Promise<StoredAnalysis[]> {
  const localRecords = getLocalAnalyses(userId);

  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return localRecords;
  }

  const path = `users/${userId}/analyses`;
  try {
    const colRef = collection(db, 'users', userId, 'analyses');
    const q = query(colRef, orderBy('createdAt', 'desc'), limit(15));
    const snapshot = await getDocs(q);
    const remoteRecords = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<StoredAnalysis, 'id'>),
    }));
    return remoteRecords.length > 0 ? remoteRecords : localRecords;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    return localRecords;
  }
}

// Persistence for Chat Messages
export interface StoredChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'model';
  content: string;
  model: string;
  createdAt: string;
}

function getLocalChatsKey(userId: string) {
  return `scamlens_chats_${userId}`;
}

export async function saveChatMessageToFirestore(
  userId: string,
  message: { role: 'user' | 'model'; content: string; model: string }
) {
  const createdAt = new Date().toISOString();
  const sanitized = {
    userId: userId.slice(0, 128),
    role: message.role,
    content: String(message.content || '').slice(0, 4000),
    model: String(message.model || 'gemma-3-27b-it').slice(0, 64),
    createdAt,
  };

  if (typeof window !== 'undefined') {
    try {
      const key = getLocalChatsKey(userId);
      const raw = localStorage.getItem(key);
      const list: StoredChatMessage[] = raw ? JSON.parse(raw) : [];
      list.push({ id: `chat_${Date.now()}`, ...sanitized });
      localStorage.setItem(key, JSON.stringify(list.slice(-50)));
    } catch {
      // ignore
    }
  }

  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return null;
  }

  const path = `users/${userId}/chats`;
  try {
    const colRef = collection(db, 'users', userId, 'chats');
    const docRef = await addDoc(colRef, sanitized);
    return docRef.id;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
    return null;
  }
}

export async function getUserChatHistory(userId: string): Promise<StoredChatMessage[]> {
  let localHistory: StoredChatMessage[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(getLocalChatsKey(userId));
      if (raw) localHistory = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    return localHistory;
  }

  const path = `users/${userId}/chats`;
  try {
    const colRef = collection(db, 'users', userId, 'chats');
    const q = query(colRef, orderBy('createdAt', 'asc'), limit(50));
    const snapshot = await getDocs(q);
    const remote = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<StoredChatMessage, 'id'>),
    }));
    return remote.length > 0 ? remote : localHistory;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Missing or insufficient permissions')) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
    return localHistory;
  }
}
