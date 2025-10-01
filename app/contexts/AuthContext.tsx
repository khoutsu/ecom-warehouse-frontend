'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser 
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { createUserDocument, getUserDocument, updateLastLogin } from '../../lib/userService';

interface User {
  id: string;
  email: string;
  name: string;
  role?: 'admin' | 'customer';
  isActive?: boolean;
  createdAt?: any;
  lastLogin?: any;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Fetch user data from Firestore using utility function
          const userData = await getUserDocument(firebaseUser.uid);
          
          if (userData) {
            // User data exists in Firestore
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: userData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              role: userData.role || 'admin',
              isActive: userData.isActive || true,
              createdAt: userData.createdAt,
              lastLogin: userData.lastLogin
            };
            setUser(user);
          } else {
            // User data doesn't exist in Firestore, create basic user object
            const user: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
            };
            setUser(user);
          }
        } catch (error) {
          console.error('Error fetching user data from Firestore:', error);
          // Fallback to basic user data
          const user: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
          };
          setUser(user);
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // Save user data to Firestore database using utility function
      await createUserDocument({
        uid: userCredential.user.uid,
        name: name,
        email: email,
        password: btoa(password), // Simple encoding for demo
        role: 'customer', // Default role for new registrations
        isActive: true
      });

      console.log('User registered and saved to database successfully');
      
      // User data will be automatically set by onAuthStateChanged
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('อีเมลนี้ถูกใช้งานแล้ว');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('รหัสผ่านควรมีความยาวอย่างน้อย 6 ตัวอักษร');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('อีเมลไม่ถูกต้อง');
      }
      
      throw new Error('Registration failed. Please try again.');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update lastLogin timestamp using utility function
      try {
        await updateLastLogin(userCredential.user.uid);
        console.log('User login timestamp updated');
      } catch (dbError) {
        console.error('Error updating login timestamp:', dbError);
        // Don't throw error for this, as login was successful
      }
      
      // User data will be automatically set by onAuthStateChanged
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific Firebase auth errors
      if (error.code === 'auth/user-not-found') {
        throw new Error('ไม่พบบัญชีผู้ใช้ด้วยอีเมลนี้');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('รหัสผ่านไม่ถูกต้อง');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('อีเมลไม่ถูกต้อง');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('ลองเข้าสู่ระบบผิดพลาดหลายครั้งเกินไป กรุณาลองใหม่อีกครั้งในภายหลัง');
      }
      
      throw new Error('Login failed. Please check your credentials.');
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      // User state will be automatically cleared by onAuthStateChanged
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Logout failed. Please try again.');
    }
  };



  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
