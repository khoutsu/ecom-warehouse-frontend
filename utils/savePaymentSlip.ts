// Utility function to save the specific payment slip from the provided image
// This can be called from the browser console or integrated into the UI

import { savePaymentSlipInfo } from '../lib/paymentSlipService';

export const saveSpecificPaymentSlip = async (orderId: string, customerId: string) => {
  try {
    // Data extracted from the provided payment slip image
    const slipData = {
      orderId: orderId,
      customerId: customerId,
      customerEmail: 'customer@example.com', // Replace with actual email
      customerName: 'ลูกค้า', // Replace with actual name
      slipImageUrl: 'data:image/jpeg;base64,...', // Replace with actual image URL
      amount: 1000.00, // Amount from the slip
      transferDate: '8/9/2025', // Converted from Buddhist year 2568
      transferTime: undefined, // Time not clearly visible in slip
      fromAccount: undefined, // Sender account not visible
      toAccount: undefined, // Receiver account not visible  
      bankName: 'กสิกรไทย', // Kasikorn Bank
      referenceNumber: 'slip_175734716760',
      transactionId: 'slip_175734716760',
      notes: 'รายละเอียดการชำระเงิน - วันที่: 8/9/2568 - โอนผ่าน K PLUS'
    };

    const slipId = await savePaymentSlipInfo(slipData);
    console.log('Payment slip saved successfully with ID:', slipId);
    return slipId;
  } catch (error) {
    console.error('Error saving payment slip:', error);
    throw error;
  }
};

// Function to save with user input
export const savePaymentSlipWithUserData = async (
  orderId: string, 
  customerId: string, 
  customerEmail: string, 
  customerName: string,
  imageBase64: string
) => {
  try {
    const slipData = {
      orderId,
      customerId,
      customerEmail,
      customerName,
      slipImageUrl: imageBase64,
      amount: 1000.00, // From your slip
      transferDate: '8/9/2025',
      transferTime: undefined,
      fromAccount: undefined,
      toAccount: undefined,
      bankName: 'กสิกรไทย',
      referenceNumber: 'slip_175734716760',
      transactionId: 'slip_175734716760',
      notes: 'รายละเอียดการชำระเงิน - วันที่: 8/9/2568 - อัปโหลดจากสลิป'
    };

    const slipId = await savePaymentSlipInfo(slipData);
    console.log('Payment slip saved with ID:', slipId);
    return slipId;
  } catch (error) {
    console.error('Error saving payment slip:', error);
    throw error;
  }
};

// To use these functions, you can call them like this:
// await saveSpecificPaymentSlip('your-order-id', 'your-customer-id');
// or
// await savePaymentSlipWithUserData('order-id', 'customer-id', 'email@example.com', 'Customer Name', 'base64-image-data');
