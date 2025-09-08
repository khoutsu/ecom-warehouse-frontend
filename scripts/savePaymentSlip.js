// Simple script to save the payment slip information from your image
// You can run this in the browser console after importing the necessary functions

const saveYourPaymentSlip = async () => {
  // Import the necessary function (you might need to adjust the import path)
  const { savePaymentSlipInfo } = await import('../lib/paymentSlipService');
  
  try {
    // Payment slip data extracted from your image
    const slipData = {
      orderId: 'ORDER_ID_HERE', // Replace with actual order ID
      customerId: 'CUSTOMER_ID_HERE', // Replace with actual customer ID
      customerEmail: 'customer@example.com', // Replace with actual email
      customerName: 'ลูกค้า', // Replace with actual name
      slipImageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', // Your image as base64
      amount: 1000.00, // Amount from your slip
      transferDate: '8/9/2025', // Converted from Buddhist year
      transferTime: undefined, // Time not clearly visible
      fromAccount: undefined, // Not visible in the slip
      toAccount: undefined, // Not visible in the slip
      bankName: 'กสิกรไทย', // Kasikorn Bank
      referenceNumber: 'slip_175734716760', // From your slip
      transactionId: 'slip_175734716760', // Same as reference
      notes: 'รายละเอียดการชำระเงิน - วันที่ 8/9/2568 - โอนผ่าน K PLUS'
    };

    const slipId = await savePaymentSlipInfo(slipData);
    console.log('✅ Payment slip saved successfully!');
    console.log('Slip ID:', slipId);
    console.log('Data saved:', slipData);
    
    return slipId;
  } catch (error) {
    console.error('❌ Error saving payment slip:', error);
    throw error;
  }
};

// Console instructions for manual execution
console.log(`
🔧 Payment Slip Saver Instructions:

1. Open browser dev tools (F12)
2. Go to Console tab
3. Run: saveYourPaymentSlip()
4. Check the console for success message

Or you can directly copy and run this code:

const slipData = {
  orderId: 'your-order-id',
  customerId: 'your-customer-id', 
  customerEmail: 'customer@example.com',
  customerName: 'Customer Name',
  slipImageUrl: 'base64-image-data',
  amount: 1000.00,
  transferDate: '8/9/2025',
  bankName: 'กสิกรไทย',
  referenceNumber: 'slip_175734716760',
  transactionId: 'slip_175734716760',
  notes: 'Payment slip - K PLUS transfer'
};

// Then call: await savePaymentSlipInfo(slipData);
`);

export { saveYourPaymentSlip };
