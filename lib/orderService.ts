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
import { reduceInventoryForOrder, restoreInventoryForOrder } from './inventoryService';
import { reduceProductStockForOrder, restoreProductStockForOrder } from './productService';
import { notifyNewOrder, notifyOrderStatusChange } from './notificationService';

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

    // Create the order first
    const docRef = await addDoc(collection(db, 'orders'), optimizedOrderData);
    
    // Reduce inventory and product stock after order is successfully created
    try {
      const orderItems = orderData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));
      
      console.log('Order created successfully, reducing inventory...');
      
      // Reduce both inventory and product stock
      await Promise.all([
        reduceInventoryForOrder(orderItems),
        reduceProductStockForOrder(orderItems)
      ]);
      
      console.log('Inventory and product stock reduced successfully');
      
      // Send notifications for new order (URS-14)
      try {
        await notifyNewOrder(docRef.id, orderData.userName, orderData.totalAmount);
        console.log('New order notifications sent successfully');
      } catch (notificationError) {
        console.error('Error sending new order notifications:', notificationError);
        // Don't fail the order creation if notifications fail
      }
    } catch (stockError) {
      console.error('Error reducing stock after order creation:', stockError);
      // Note: Order is already created, stock reduction failed
      // You might want to implement compensation logic here
      console.warn('Order was created but stock reduction failed. Manual adjustment may be needed.');
    }
    
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
    
    // Get the order details first to access customer info and old status
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) {
      throw new Error('Order not found');
    }
    
    const orderData = orderDoc.data() as Order;
    const oldStatus = orderData.status;
    
    // If order is being cancelled, restore inventory
    if (status === 'cancelled') {
      try {
        // Only restore if the order was not already cancelled
        if (orderData.status !== 'cancelled') {
          const orderItems = orderData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }));
          
          console.log('Order being cancelled, restoring inventory...');
          
          // Restore both inventory and product stock
          await Promise.all([
            restoreInventoryForOrder(orderItems),
            restoreProductStockForOrder(orderItems)
          ]);
          
          console.log('Inventory and product stock restored successfully');
        }
      } catch (restoreError) {
        console.error('Error restoring stock after order cancellation:', restoreError);
        console.warn('Order status updated but stock restoration failed. Manual adjustment may be needed.');
      }
    }
    
    await updateDoc(orderRef, {
      status,
      updatedAt: Timestamp.now()
    });
    
    // Send status change notification to customer (URS-15)
    try {
      await notifyOrderStatusChange(orderData.userId, orderId, status, oldStatus);
      console.log('Order status change notification sent successfully');
    } catch (notificationError) {
      console.error('Error sending order status change notification:', notificationError);
      // Don't fail the status update if notifications fail
    }
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

// Upload payment slip with detailed information (customer)
export const uploadPaymentSlip = async (
  orderId: string, 
  slipImageUrl: string,
  transactionId?: string,
  slipDetails?: {
    amount?: number;
    transferDate?: string;
    transferTime?: string;
    fromAccount?: string;
    toAccount?: string;
    bankName?: string;
    referenceNumber?: string;
    notes?: string;
  }
): Promise<void> => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    
    const updateData: any = {
      'paymentDetails.slipImageUrl': slipImageUrl,
      'paymentDetails.transactionId': transactionId || '',
      'paymentDetails.method': 'transfer',
      'paymentDetails.uploadedAt': Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Add slip details if provided
    if (slipDetails) {
      if (slipDetails.amount) updateData['paymentDetails.amount'] = slipDetails.amount;
      if (slipDetails.transferDate) updateData['paymentDetails.transferDate'] = slipDetails.transferDate;
      if (slipDetails.transferTime) updateData['paymentDetails.transferTime'] = slipDetails.transferTime;
      if (slipDetails.fromAccount) updateData['paymentDetails.fromAccount'] = slipDetails.fromAccount;
      if (slipDetails.toAccount) updateData['paymentDetails.toAccount'] = slipDetails.toAccount;
      if (slipDetails.bankName) updateData['paymentDetails.bankName'] = slipDetails.bankName;
      if (slipDetails.referenceNumber) updateData['paymentDetails.referenceNumber'] = slipDetails.referenceNumber;
      if (slipDetails.notes) updateData['paymentDetails.notes'] = slipDetails.notes;
    }

    await updateDoc(orderRef, updateData);
  } catch (error) {
    console.error('Error uploading payment slip:', error);
    throw error;
  }
};

// Save payment slip information to a separate collection for record keeping
export const savePaymentSlipRecord = async (slipData: {
  orderId: string;
  customerId: string;
  customerEmail: string;
  slipImageUrl: string;
  amount: number;
  transferDate: string;
  transferTime?: string;
  fromAccount?: string;
  toAccount?: string;
  bankName?: string;
  referenceNumber?: string;
  transactionId?: string;
  notes?: string;
}): Promise<string> => {
  try {
    const slipRecord = {
      ...slipData,
      createdAt: Timestamp.now(),
      status: 'pending_verification' as const,
      verifiedAt: null,
      verifiedBy: null
    };

    const docRef = await addDoc(collection(db, 'payment_slips'), slipRecord);
    return docRef.id;
  } catch (error) {
    console.error('Error saving payment slip record:', error);
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
    // Get order details before deletion to check if inventory should be restored
    const orderRef = doc(db, 'orders', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (orderDoc.exists()) {
      const orderData = orderDoc.data() as Order;
      
      // Only restore inventory if:
      // 1. Order was not cancelled (cancelled orders already restored inventory)
      // 2. Order was not paid (paid orders mean products were actually sold)
      const shouldRestoreInventory = orderData.status !== 'cancelled' && 
                                   orderData.paymentStatus !== 'paid';
      
      if (shouldRestoreInventory) {
        try {
          const orderItems = orderData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }));
          
          console.log('Order being deleted (unpaid), restoring inventory...');
          
          // Restore both inventory and product stock
          await Promise.all([
            restoreInventoryForOrder(orderItems),
            restoreProductStockForOrder(orderItems)
          ]);
          
          console.log('Inventory and product stock restored successfully');
        } catch (restoreError) {
          console.error('Error restoring stock after order deletion:', restoreError);
          console.warn('Order will be deleted but stock restoration failed. Manual adjustment may be needed.');
        }
      } else {
        if (orderData.paymentStatus === 'paid') {
          console.log('Order being deleted (paid) - inventory will NOT be restored as products were sold');
        } else if (orderData.status === 'cancelled') {
          console.log('Order being deleted (cancelled) - inventory already restored when cancelled');
        }
      }
    }
    
    await deleteDoc(orderRef);
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