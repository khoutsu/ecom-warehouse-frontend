import { 
  collection, 
  addDoc, 
  query, 
  where,
  getDocs, 
  orderBy, 
  updateDoc, 
  deleteDoc,
  doc, 
  serverTimestamp,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface NotificationData {
  id?: string;
  type: 'order_new' | 'order_status_change' | 'inventory_low' | 'system';
  title: string;
  message: string;
  userId: string; // Who should receive this notification
  userRole: 'admin' | 'customer';
  isRead: boolean;
  relatedId?: string; // Order ID, Product ID, etc.
  relatedType?: 'order' | 'product' | 'inventory';
  createdAt: any;
  readAt?: any;
}

// Create a new notification
export const createNotification = async (notificationData: Omit<NotificationData, 'id' | 'createdAt' | 'isRead'>) => {
  try {
    const notification = {
      ...notificationData,
      isRead: false,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'notifications'), notification);
    console.log('Notification created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for a specific user
export const getUserNotifications = async (userId: string, limit: number = 20) => {
  try {
    // Use simple query and sort on client side to avoid index requirement
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications: NotificationData[] = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as NotificationData);
    });
    
    // Sort on client side by createdAt desc
    notifications.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      const aTime = a.createdAt.seconds || 0;
      const bTime = b.createdAt.seconds || 0;
      return bTime - aTime;
    });
    
    return notifications.slice(0, limit);
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Get notifications for user role (admin only)
export const getNotificationsByRole = async (userRole: 'admin', limit: number = 20) => {
  try {
    // Use simple query and sort on client side to avoid index requirement
    const q = query(
      collection(db, 'notifications'),
      where('userRole', '==', userRole)
    );
    
    const querySnapshot = await getDocs(q);
    const notifications: NotificationData[] = [];
    
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as NotificationData);
    });
    
    // Sort on client side by createdAt desc
    notifications.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      const aTime = a.createdAt.seconds || 0;
      const bTime = b.createdAt.seconds || 0;
      return bTime - aTime;
    });
    
    return notifications.slice(0, limit);
  } catch (error) {
    console.error('Error getting notifications by role:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true,
      readAt: serverTimestamp()
    });
    console.log('Notification marked as read');
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map(docSnapshot => 
      updateDoc(doc(db, 'notifications', docSnapshot.id), {
        isRead: true,
        readAt: serverTimestamp()
      })
    );
    
    await Promise.all(updatePromises);
    console.log('All notifications marked as read');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a single notification
export const deleteNotification = async (notificationId: string) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notificationRef);
    console.log('Notification deleted');
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Delete all notifications for a user
export const deleteAllNotifications = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(docSnapshot => 
      deleteDoc(doc(db, 'notifications', docSnapshot.id))
    );
    
    await Promise.all(deletePromises);
    console.log('All notifications deleted for user');
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

// Real-time subscription to notifications for a user
export const subscribeToUserNotifications = (
  userId: string, 
  callback: (notifications: NotificationData[]) => void
) => {
  // Use simple query and sort on client side to avoid index requirement
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const notifications: NotificationData[] = [];
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as NotificationData);
    });
    
    // Sort on client side by createdAt desc
    notifications.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      const aTime = a.createdAt.seconds || 0;
      const bTime = b.createdAt.seconds || 0;
      return bTime - aTime;
    });
    
    callback(notifications);
  });
};

// Real-time subscription to notifications by role
export const subscribeToRoleNotifications = (
  userRole: 'admin',
  callback: (notifications: NotificationData[]) => void
) => {
  // Use simple query and sort on client side to avoid index requirement
  const q = query(
    collection(db, 'notifications'),
    where('userRole', '==', userRole)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const notifications: NotificationData[] = [];
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as NotificationData);
    });
    
    // Sort on client side by createdAt desc
    notifications.sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      const aTime = a.createdAt.seconds || 0;
      const bTime = b.createdAt.seconds || 0;
      return bTime - aTime;
    });
    
    callback(notifications);
  });
};

// Helper functions for specific notification types

// URS-14: Notify admin/inventory staff of new orders
export const notifyNewOrder = async (orderId: string, customerName: string, totalAmount: number) => {
  try {
    // Get all admin users
    const adminQuery = query(
      collection(db, 'users'),
      where('role', '==', 'admin'),
      where('isActive', '==', true)
    );
    
    const adminSnapshot = await getDocs(adminQuery);
    const notifications: Promise<string>[] = [];
    
    // Create notification for each admin
    adminSnapshot.forEach((userDoc) => {
      notifications.push(createNotification({
        type: 'order_new',
        title: '🔔 คำสั่งซื้อใหม่',
        message: `มีคำสั่งซื้อใหม่จาก ${customerName} มูลค่า ฿${totalAmount.toLocaleString()}`,
        userId: userDoc.id,
        userRole: 'admin',
        relatedId: orderId,
        relatedType: 'order'
      }));
    });
    
    await Promise.all(notifications);
    console.log('New order notifications sent');
  } catch (error) {
    console.error('Error sending new order notifications:', error);
    throw error;
  }
};

// URS-15: Notify customer of order status changes
export const notifyOrderStatusChange = async (
  customerId: string, 
  orderId: string, 
  newStatus: string, 
  oldStatus: string
) => {
  try {
    const statusMessages: { [key: string]: string } = {
      pending: 'รอการยืนยัน',
      confirmed: 'ยืนยันแล้ว',
      processing: 'กำลังจัดเตรียม',
      shipped: 'จัดส่งแล้ว',
      delivered: 'ส่งถึงแล้ว',
      cancelled: 'ยกเลิกแล้ว'
    };
    
    const statusEmojis: { [key: string]: string } = {
      pending: '⏳',
      confirmed: '✅',
      processing: '📦',
      shipped: '🚚',
      delivered: '🎉',
      cancelled: '❌'
    };
    
    await createNotification({
      type: 'order_status_change',
      title: `${statusEmojis[newStatus]} สถานะคำสั่งซื้อเปลี่ยนแปลง`,
      message: `คำสั่งซื้อ #${orderId.slice(-8)} เปลี่ยนสถานะเป็น "${statusMessages[newStatus]}"`,
      userId: customerId,
      userRole: 'customer',
      relatedId: orderId,
      relatedType: 'order'
    });
    
    console.log('Order status change notification sent');
  } catch (error) {
    console.error('Error sending order status change notification:', error);
    throw error;
  }
};

// Helper to notify low inventory
export const notifyLowInventory = async (productName: string, currentStock: number, minStock: number) => {
  try {
    const adminQuery = query(
      collection(db, 'users'),
      where('role', '==', 'admin'),
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(adminQuery);
    const notifications: Promise<string>[] = [];
    
    snapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      notifications.push(createNotification({
        type: 'inventory_low',
        title: '⚠️ สต็อกสินค้าต่ำ',
        message: `สินค้า "${productName}" เหลือเพียง ${currentStock} ชิ้น (ขั้นต่ำ ${minStock} ชิ้น)`,
        userId: userDoc.id,
        userRole: userData.role,
        relatedType: 'inventory'
      }));
    });
    
    await Promise.all(notifications);
    console.log('Low inventory notifications sent');
  } catch (error) {
    console.error('Error sending low inventory notifications:', error);
    throw error;
  }
};