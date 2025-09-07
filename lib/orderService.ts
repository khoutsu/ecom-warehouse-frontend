import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid' | 'refunded' | 'failed';
  paymentDetails?: {
    method: string;
    transactionId?: string;
    paidAt?: Timestamp;
    confirmedBy?: string; // Admin who confirmed payment
    bankAccount?: string; // For transfer payments
    slipImageUrl?: string; // Payment slip image
    notes?: string; // Payment notes
  };
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  paymentMethod: string;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateOrderData {
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
  };
  paymentMethod: string;
  notes?: string;
}

// Create a new order
export const createOrder = async (orderData: CreateOrderData): Promise<string> => {
  try {
    const now = Timestamp.now();
    
    // Optimize order data to prevent size issues
    const optimizedOrderData = {
      ...orderData,
      // Keep original image URLs for order display
      items: orderData.items.map(item => ({
        ...item,
        // Preserve image URLs for order display
        imageUrl: item.imageUrl || '',
      })),
      status: 'pending' as const,
      paymentStatus: 'unpaid' as const,
      paymentDetails: {
        method: orderData.paymentMethod,
        transactionId: '',
        bankAccount: '',
        slipImageUrl: '',
        notes: ''
      },
      createdAt: now,
      updatedAt: now
    };

    // Calculate approximate size (rough estimation)
    const estimatedSize = JSON.stringify(optimizedOrderData).length;
    console.log('Estimated order size:', estimatedSize, 'bytes');
    
    if (estimatedSize > 900000) { // 900KB safety margin
      throw new Error('ข้อมูลคำสั่งซื้อมีขนาดใหญ่เกินไป กรุณาลองใหม่อีกครั้ง');
    }

    const docRef = await addDoc(collection(db, 'orders'), optimizedOrderData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    if (error instanceof Error && error.message.includes('maximum allowed size')) {
      throw new Error('ข้อมูลคำสั่งซื้อมีขนาดใหญ่เกินไป กรุณาลดจำนวนสินค้าหรือลองใหม่อีกครั้ง');
    }
    throw error;
  }
};

// Get all orders (admin only)
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'orders');
    const querySnapshot = await getDocs(ordersRef);
    
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    
    // Sort on the client side by creation date (newest first)
    orders.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0;
    });
    
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw error;
  }
};

// Get orders for a specific user
export const getUserOrders = async (userId: string): Promise<Order[]> => {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const orders: Order[] = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() } as Order);
    });
    
    // Sort on the client side by creation date (newest first)
    orders.sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.seconds - a.createdAt.seconds;
      }
      return 0;
    });
    
    return orders;
  } catch (error) {
    console.error('Error fetching user orders:', error);
    throw error;
  }
};

// Get order by ID
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    const orderDoc = await getDoc(doc(db, 'orders', orderId));
    
    if (orderDoc.exists()) {
      return { id: orderDoc.id, ...orderDoc.data() } as Order;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
};

// Update order status (admin only)
export const updateOrderStatus = async (orderId: string, status: Order['status']): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

// Confirm payment (admin only)
export const confirmPayment = async (
  orderId: string, 
  paymentDetails: {
    transactionId?: string;
    confirmedBy: string;
    bankAccount?: string;
    slipImageUrl?: string;
    notes?: string;
  }
): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      paymentStatus: 'paid',
      'paymentDetails.paidAt': Timestamp.now(),
      'paymentDetails.confirmedBy': paymentDetails.confirmedBy,
      'paymentDetails.transactionId': paymentDetails.transactionId || '',
      'paymentDetails.bankAccount': paymentDetails.bankAccount || '',
      'paymentDetails.slipImageUrl': paymentDetails.slipImageUrl || '',
      'paymentDetails.notes': paymentDetails.notes || '',
      status: 'confirmed', // Auto-confirm order when payment is confirmed
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

// Update payment status (admin only)
export const updatePaymentStatus = async (
  orderId: string, 
  paymentStatus: Order['paymentStatus'],
  adminId: string
): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const updateData: any = {
      paymentStatus,
      updatedAt: Timestamp.now()
    };

    if (paymentStatus === 'paid') {
      updateData['paymentDetails.paidAt'] = Timestamp.now();
      updateData['paymentDetails.confirmedBy'] = adminId;
      updateData.status = 'confirmed'; // Auto-confirm when paid
    }

    await updateDoc(orderRef, updateData);
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

// Upload payment slip (customer)
export const uploadPaymentSlip = async (
  orderId: string, 
  slipImageUrl: string,
  transactionId?: string
): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      'paymentDetails.slipImageUrl': slipImageUrl,
      'paymentDetails.transactionId': transactionId || '',
      'paymentDetails.method': 'transfer',
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error uploading payment slip:', error);
    throw error;
  }
};

// Update order details (admin only)
export const updateOrder = async (orderId: string, orderData: Partial<Order>): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      ...orderData,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
};

// Delete order (admin only)
export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'orders', orderId));
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

// Get order statistics
export const getOrderStats = async (): Promise<{
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
}> => {
  try {
    const orders = await getAllOrders();
    
    const stats = {
      totalOrders: orders.length,
      pendingOrders: orders.filter(order => order.status === 'pending').length,
      completedOrders: orders.filter(order => order.status === 'delivered').length,
      totalRevenue: orders
        .filter(order => order.status === 'delivered')
        .reduce((sum, order) => sum + order.totalAmount, 0)
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching order stats:', error);
    throw error;
  }
};