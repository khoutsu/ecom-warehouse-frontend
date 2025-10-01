import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

interface LoginAttempt {
  email: string;
  attempts: number;
  lastAttempt: any;
  lockedUntil?: any;
  isLocked: boolean;
}

// Collection name for login attempts
const COLLECTION_NAME = 'loginAttempts';
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Local storage key for tracking attempts (backup/immediate response)
const LOCAL_STORAGE_KEY = 'loginAttempts';

/**
 * Get login attempt data for an email from Firestore
 */
export const getLoginAttempts = async (email: string): Promise<LoginAttempt | null> => {
  try {
    const attemptDocRef = doc(db, COLLECTION_NAME, email);
    const attemptDoc = await getDoc(attemptDocRef);
    
    if (attemptDoc.exists()) {
      const data = attemptDoc.data() as LoginAttempt;
      
      // Check if lockout has expired
      if (data.lockedUntil && data.lockedUntil.toDate() < new Date()) {
        // Lockout expired, reset attempts
        await resetLoginAttempts(email);
        return null;
      }
      
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting login attempts:', error);
    // Fallback to localStorage
    return getLocalLoginAttempts(email);
  }
};

/**
 * Record a failed login attempt
 */
export const recordFailedAttempt = async (email: string): Promise<LoginAttempt> => {
  try {
    const attemptDocRef = doc(db, COLLECTION_NAME, email);
    const existingAttempt = await getLoginAttempts(email);
    
    const currentAttempts = existingAttempt ? existingAttempt.attempts + 1 : 1;
    const isLocked = currentAttempts >= MAX_ATTEMPTS;
    const lockedUntil = isLocked ? new Date(Date.now() + LOCKOUT_DURATION) : null;
    
    const attemptData: LoginAttempt = {
      email,
      attempts: currentAttempts,
      lastAttempt: serverTimestamp(),
      lockedUntil: lockedUntil ? serverTimestamp() : null,
      isLocked
    };
    
    // Update Firestore
    await setDoc(attemptDocRef, attemptData);
    
    // Also update localStorage as backup
    saveLocalLoginAttempts(email, {
      ...attemptData,
      lastAttempt: new Date(),
      lockedUntil: lockedUntil
    });
    
    console.log(`Failed login attempt recorded for ${email}. Attempts: ${currentAttempts}`);
    
    return attemptData;
  } catch (error) {
    console.error('Error recording failed attempt:', error);
    // Fallback to localStorage
    return recordLocalFailedAttempt(email);
  }
};

/**
 * Reset login attempts after successful login or password reset
 */
export const resetLoginAttempts = async (email: string): Promise<void> => {
  try {
    const attemptDocRef = doc(db, COLLECTION_NAME, email);
    await setDoc(attemptDocRef, {
      email,
      attempts: 0,
      lastAttempt: serverTimestamp(),
      lockedUntil: null,
      isLocked: false
    });
    
    // Clear localStorage backup
    clearLocalLoginAttempts(email);
    
    console.log(`Login attempts reset for ${email}`);
  } catch (error) {
    console.error('Error resetting login attempts:', error);
    // Fallback to localStorage
    clearLocalLoginAttempts(email);
  }
};

/**
 * Check if account is currently locked
 */
export const isAccountLocked = async (email: string): Promise<{ isLocked: boolean; remainingTime?: number; attempts: number }> => {
  try {
    const attemptData = await getLoginAttempts(email);
    
    if (!attemptData) {
      return { isLocked: false, attempts: 0 };
    }
    
    if (attemptData.isLocked && attemptData.lockedUntil) {
      const lockoutEnd = attemptData.lockedUntil.toDate ? attemptData.lockedUntil.toDate() : attemptData.lockedUntil;
      const now = new Date();
      
      if (lockoutEnd > now) {
        const remainingTime = Math.ceil((lockoutEnd.getTime() - now.getTime()) / 1000 / 60); // minutes
        return { isLocked: true, remainingTime, attempts: attemptData.attempts };
      } else {
        // Lockout expired, reset attempts
        await resetLoginAttempts(email);
        return { isLocked: false, attempts: 0 };
      }
    }
    
    return { isLocked: false, attempts: attemptData.attempts };
  } catch (error) {
    console.error('Error checking account lock status:', error);
    // Fallback to localStorage
    const localData = getLocalLoginAttempts(email);
    if (localData && localData.isLocked && localData.lockedUntil) {
      const now = new Date();
      if (localData.lockedUntil > now) {
        const remainingTime = Math.ceil((localData.lockedUntil.getTime() - now.getTime()) / 1000 / 60);
        return { isLocked: true, remainingTime, attempts: localData.attempts };
      }
    }
    return { isLocked: false, attempts: localData?.attempts || 0 };
  }
};

// Local Storage Fallback Functions
function getLocalLoginAttempts(email: string): LoginAttempt | null {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const attempts = JSON.parse(stored);
      const attemptData = attempts[email];
      if (attemptData) {
        return {
          ...attemptData,
          lastAttempt: new Date(attemptData.lastAttempt),
          lockedUntil: attemptData.lockedUntil ? new Date(attemptData.lockedUntil) : null
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting local login attempts:', error);
    return null;
  }
}

function saveLocalLoginAttempts(email: string, attemptData: LoginAttempt): void {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    const attempts = stored ? JSON.parse(stored) : {};
    
    attempts[email] = {
      ...attemptData,
      lastAttempt: attemptData.lastAttempt instanceof Date ? attemptData.lastAttempt.toISOString() : attemptData.lastAttempt,
      lockedUntil: attemptData.lockedUntil instanceof Date ? attemptData.lockedUntil.toISOString() : attemptData.lockedUntil
    };
    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(attempts));
  } catch (error) {
    console.error('Error saving local login attempts:', error);
  }
}

function recordLocalFailedAttempt(email: string): LoginAttempt {
  const existingAttempt = getLocalLoginAttempts(email);
  const currentAttempts = existingAttempt ? existingAttempt.attempts + 1 : 1;
  const isLocked = currentAttempts >= MAX_ATTEMPTS;
  const lockedUntil = isLocked ? new Date(Date.now() + LOCKOUT_DURATION) : null;
  
  const attemptData: LoginAttempt = {
    email,
    attempts: currentAttempts,
    lastAttempt: new Date(),
    lockedUntil,
    isLocked
  };
  
  saveLocalLoginAttempts(email, attemptData);
  return attemptData;
}

function clearLocalLoginAttempts(email: string): void {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const attempts = JSON.parse(stored);
      delete attempts[email];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(attempts));
    }
  } catch (error) {
    console.error('Error clearing local login attempts:', error);
  }
}

export { MAX_ATTEMPTS, LOCKOUT_DURATION };