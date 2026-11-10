import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromServer, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { UserProfile, DonorProfile, UserRole } from './types.ts';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Test connection to Firestore on initialization as mandated by Firebase Skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network connection.");
    }
  }
}
testConnection();

// Skill-mandated error handling structure
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Current logged in user cache
export let currentUserProfile: UserProfile | null = null;
export let currentDonorProfile: DonorProfile | null = null;
const authListeners: Array<(user: FirebaseUser | null, profile: UserProfile | null) => void> = [];

export function subscribeAuth(listener: (user: FirebaseUser | null, profile: UserProfile | null) => void) {
  authListeners.push(listener);
  // Call immediately with current state
  listener(auth.currentUser, currentUserProfile);
  return () => {
    const idx = authListeners.indexOf(listener);
    if (idx !== -1) authListeners.splice(idx, 1);
  };
}

// Check if user is system admin
export function isUserAdmin(email?: string | null, role?: UserRole): boolean {
  if (email && email.toLowerCase() === 'ganesh276c@gmail.com') return true;
  return role === 'admin';
}

// Listen to auth state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        currentUserProfile = userSnap.data() as UserProfile;
        // If user is donor, also fetch donor profile
        if (currentUserProfile.role === 'donor') {
          const donorDocRef = doc(db, 'donors', user.uid);
          const donorSnap = await getDoc(donorDocRef);
          if (donorSnap.exists()) {
            currentDonorProfile = donorSnap.data() as DonorProfile;
          }
        }
      } else {
        // If logged in via Google and no profile yet, check if admin
        const isAdmin = user.email?.toLowerCase() === 'ganesh276c@gmail.com';
        currentUserProfile = {
          id: user.uid,
          email: user.email || '',
          fullName: user.displayName || (isAdmin ? 'System Administrator' : 'Community Member'),
          role: isAdmin ? 'admin' : 'receiver',
          phone: '',
          city: '',
          pinCode: '',
          createdAt: new Date().toISOString()
        };
        // Auto-save admin profile if admin
        if (isAdmin) {
          await setDoc(userDocRef, currentUserProfile);
          await setDoc(doc(db, 'admins', user.uid), {
            email: user.email,
            role: 'admin',
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      // Fallback profile if Firestore read failed during init
      currentUserProfile = {
        id: user.uid,
        email: user.email || '',
        fullName: user.displayName || 'User',
        role: user.email?.toLowerCase() === 'ganesh276c@gmail.com' ? 'admin' : 'receiver',
        phone: '',
        city: '',
        pinCode: '',
        createdAt: new Date().toISOString()
      };
    }
  } else {
    currentUserProfile = null;
    currentDonorProfile = null;
  }

  // Notify listeners
  authListeners.forEach(fn => fn(user, currentUserProfile));
});

export {
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  limit
};
