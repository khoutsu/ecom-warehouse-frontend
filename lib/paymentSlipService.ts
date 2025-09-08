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

export interface PaymentSlip {
  id: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
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
  status: 'pending_verification' | 'verified' | 'rejected';
  createdAt: any;
  verifiedAt?: any;
  verifiedBy?: string;
  rejectionReason?: string;
}

export interface CreatePaymentSlipData {
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
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
}

// Save payment slip with extracted information
export const savePaymentSlipInfo = async (slipData: CreatePaymentSlipData): Promise<string> => {
  try {
    const slipRecord = {
      ...slipData,
      status: 'pending_verification' as const,
      createdAt: Timestamp.now(),
      verifiedAt: null,
      verifiedBy: null
    };

    console.log('Saving payment slip record:', slipRecord);
    
    const docRef = await addDoc(collection(db, 'payment_slips'), slipRecord);
    return docRef.id;
  } catch (error) {
    console.error('Error saving payment slip record:', error);
    throw error;
  }
};

// Parse payment slip information from image (manual input for now)
export const createPaymentSlipFromImageData = async (imageData: {
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  slipImageUrl: string;
  // Extracted from the slip image you provided
  amount: number; // 1,000.00
  transferDate: string; // "8/9/2568" (Thai date)
  transferTime?: string; // Optional time
  referenceNumber: string; // "slip_175734716760"
  bankName?: string; // "กสิกร" (Kasikorn Bank)
  notes?: string;
}): Promise<string> => {
  try {
    // Convert Thai Buddhist year to Gregorian if needed
    let processedDate = imageData.transferDate;
    if (imageData.transferDate.includes('2568')) {
      // Convert Buddhist year 2568 to Gregorian 2025
      processedDate = imageData.transferDate.replace('2568', '2025');
    }

    const slipData: CreatePaymentSlipData = {
      orderId: imageData.orderId,
      customerId: imageData.customerId,
      customerEmail: imageData.customerEmail,
      customerName: imageData.customerName,
      slipImageUrl: imageData.slipImageUrl,
      amount: imageData.amount,
      transferDate: processedDate,
      transferTime: imageData.transferTime,
      referenceNumber: imageData.referenceNumber,
      bankName: imageData.bankName || 'กสิกรไทย',
      transactionId: imageData.referenceNumber,
      notes: imageData.notes || 'อัปโหลดจากสลิปโอนเงิน'
    };

    return await savePaymentSlipInfo(slipData);
  } catch (error) {
    console.error('Error creating payment slip from image data:', error);
    throw error;
  }
};

// Get all payment slips (admin)
export const getAllPaymentSlips = async (): Promise<PaymentSlip[]> => {
  try {
    const slipsRef = collection(db, 'payment_slips');
    const q = query(slipsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const slips: PaymentSlip[] = [];
    querySnapshot.forEach((doc) => {
      slips.push({ id: doc.id, ...doc.data() } as PaymentSlip);
    });
    
    return slips;
  } catch (error) {
    console.error('Error fetching payment slips:', error);
    throw error;
  }
};

// Get payment slips for a specific order
export const getPaymentSlipsByOrder = async (orderId: string): Promise<PaymentSlip[]> => {
  try {
    const slipsRef = collection(db, 'payment_slips');
    const q = query(slipsRef, where('orderId', '==', orderId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const slips: PaymentSlip[] = [];
    querySnapshot.forEach((doc) => {
      slips.push({ id: doc.id, ...doc.data() } as PaymentSlip);
    });
    
    return slips;
  } catch (error) {
    console.error('Error fetching payment slips for order:', error);
    throw error;
  }
};

// Verify payment slip (admin)
export const verifyPaymentSlip = async (slipId: string, verifiedBy: string): Promise<void> => {
  try {
    const slipRef = doc(db, 'payment_slips', slipId);
    await updateDoc(slipRef, {
      status: 'verified',
      verifiedAt: Timestamp.now(),
      verifiedBy: verifiedBy
    });
  } catch (error) {
    console.error('Error verifying payment slip:', error);
    throw error;
  }
};

// Reject payment slip (admin)
export const rejectPaymentSlip = async (slipId: string, rejectionReason: string, rejectedBy: string): Promise<void> => {
  try {
    const slipRef = doc(db, 'payment_slips', slipId);
    await updateDoc(slipRef, {
      status: 'rejected',
      verifiedAt: Timestamp.now(),
      verifiedBy: rejectedBy,
      rejectionReason: rejectionReason
    });
  } catch (error) {
    console.error('Error rejecting payment slip:', error);
    throw error;
  }
};

// Example function to save the specific slip data you provided
export const saveThaiPaymentSlip = async (orderId: string, customerId: string, customerEmail: string, customerName: string, slipImageUrl: string): Promise<string> => {
  // Based on the image you provided
  const slipData = {
    orderId,
    customerId,
    customerEmail,
    customerName,
    slipImageUrl,
    amount: 1000.00, // From the slip
    transferDate: '8/9/2025', // Converted from Thai Buddhist year
    transferTime: undefined, // Not visible in the slip
    referenceNumber: 'slip_175734716760',
    bankName: 'กสิกรไทย',
    transactionId: 'slip_175734716760',
    notes: 'โอนผ่านแอพ K PLUS - รายละเอียดการชำระเงิน'
  };

  return await savePaymentSlipInfo(slipData);
};
