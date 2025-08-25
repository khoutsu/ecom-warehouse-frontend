import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserData {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
  lastLogin: any;
}

// Create a new user document in Firestore
export const createUserDocument = async (userData: Omit<UserData, 'createdAt' | 'updatedAt' | 'lastLogin'>) => {
  try {
    const userDocRef = doc(db, 'users', userData.uid);
    const newUserData = {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };
    
    await setDoc(userDocRef, newUserData);
    console.log('User document created successfully');
    return newUserData;
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

// Get user document from Firestore
export const getUserDocument = async (uid: string) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error('Error getting user document:', error);
    throw error;
  }
};

// Update user document in Firestore
export const updateUserDocument = async (uid: string, updates: Partial<UserData>) => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(userDocRef, updateData);
    console.log('User document updated successfully');
  } catch (error) {
    console.error('Error updating user document:', error);
    throw error;
  }
};

// Update user last login timestamp
export const updateLastLogin = async (uid: string) => {
  try {
    await updateUserDocument(uid, {
      lastLogin: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
};

// Get all users (for admin purposes)
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const users: UserData[] = [];
    querySnapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() } as UserData);
    });
    
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

// Get users by role
export const getUsersByRole = async (role: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    const querySnapshot = await getDocs(q);
    
    const users: UserData[] = [];
    querySnapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() } as UserData);
    });
    
    return users;
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};

// Check if email already exists (useful for validation)
export const checkEmailExists = async (email: string) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking email existence:', error);
    throw error;
  }
};

// Update user role (admin only)
export const updateUserRole = async (uid: string, newRole: 'admin' | 'customer', adminUid: string) => {
  try {
    // First check if the requesting user is an admin
    const adminData = await getUserDocument(adminUid);
    if (!adminData || adminData.role !== 'admin') {
      throw new Error('Unauthorized: Only admins can change user roles');
    }

    // Prevent admins from demoting themselves
    if (uid === adminUid && newRole === 'customer') {
      throw new Error('Cannot demote yourself from admin role');
    }

    await updateUserDocument(uid, {
      role: newRole
    });

    console.log(`User role updated to ${newRole} by admin ${adminUid}`);
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// Delete user (admin only)
export const deleteUser = async (uid: string, adminUid: string) => {
  try {
    // First check if the requesting user is an admin
    const adminData = await getUserDocument(adminUid);
    if (!adminData || adminData.role !== 'admin') {
      throw new Error('ไม่ได้รับอนุญาต: เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบผู้ใช้ได้');
    }

    // Prevent admins from deleting themselves
    if (uid === adminUid) {
      throw new Error('ไม่สามารถลบบัญชีของตัวเองได้');
    }

    // Check if user exists
    const userData = await getUserDocument(uid);
    if (!userData) {
      throw new Error('ไม่พบผู้ใช้ที่ต้องการลบ');
    }

    // Delete user document from Firestore
    const userDocRef = doc(db, 'users', uid);
    await deleteDoc(userDocRef);

    console.log(`User ${uid} deleted by admin ${adminUid}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Check if user is admin
export const isUserAdmin = async (uid: string): Promise<boolean> => {
  try {
    const userData = await getUserDocument(uid);
    return userData?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Get user role
export const getUserRole = async (uid: string): Promise<'admin' | 'customer' | null> => {
  try {
    const userData = await getUserDocument(uid);
    return userData?.role || null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};
