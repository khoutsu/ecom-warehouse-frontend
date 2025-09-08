import React, { useState } from 'react';
import { savePaymentSlipInfo } from '../lib/paymentSlipService';

interface PaymentSlipFormProps {
  orderId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  onSave?: (slipId: string) => void;
}

export const PaymentSlipForm: React.FC<PaymentSlipFormProps> = ({
  orderId,
  customerId,
  customerEmail,
  customerName,
  onSave
}) => {
  const [formData, setFormData] = useState({
    amount: 1000.00,
    transferDate: '8/9/2025',
    transferTime: '',
    bankName: 'กสิกรไทย',
    referenceNumber: 'slip_175734716760',
    notes: 'รายละเอียดการชำระเงิน - โอนผ่าน K PLUS'
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      alert('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    setSaving(true);
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          
          const slipData = {
            orderId,
            customerId,
            customerEmail,
            customerName,
            slipImageUrl: base64,
            amount: formData.amount,
            transferDate: formData.transferDate,
            transferTime: formData.transferTime || undefined,
            bankName: formData.bankName,
            referenceNumber: formData.referenceNumber,
            transactionId: formData.referenceNumber,
            notes: formData.notes
          };

          const slipId = await savePaymentSlipInfo(slipData);
          setSuccess(true);
          if (onSave) onSave(slipId);
          
          alert(`บันทึกข้อมูลสลิปสำเร็จ! ID: ${slipId}`);
        } catch (error) {
          console.error('Error saving payment slip:', error);
          alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
          setSaving(false);
        }
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('เกิดข้อผิดพลาดในการประมวลผลไฟล์');
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="payment-slip-success">
        <h3>✅ บันทึกข้อมูลสลิปสำเร็จ!</h3>
        <p>ข้อมูลการชำระเงินได้บันทึกเข้าระบบเรียบร้อยแล้ว</p>
      </div>
    );
  }

  return (
    <div className="payment-slip-form">
      <h3>📄 บันทึกข้อมูลสลิปการโอนเงิน</h3>
      
      <form onSubmit={handleSubmit} className="slip-form">
        <div className="form-group">
          <label>จำนวนเงิน (บาท)</label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({...prev, amount: parseFloat(e.target.value)}))}
            required
          />
        </div>

        <div className="form-group">
          <label>วันที่โอน</label>
          <input
            type="text"
            value={formData.transferDate}
            onChange={(e) => setFormData(prev => ({...prev, transferDate: e.target.value}))}
            placeholder="เช่น 8/9/2025"
            required
          />
        </div>

        <div className="form-group">
          <label>เวลาโอน (ถ้ามี)</label>
          <input
            type="text"
            value={formData.transferTime}
            onChange={(e) => setFormData(prev => ({...prev, transferTime: e.target.value}))}
            placeholder="เช่น 14:30"
          />
        </div>

        <div className="form-group">
          <label>ธนาคาร</label>
          <input
            type="text"
            value={formData.bankName}
            onChange={(e) => setFormData(prev => ({...prev, bankName: e.target.value}))}
            required
          />
        </div>

        <div className="form-group">
          <label>หมายเลขอ้างอิง</label>
          <input
            type="text"
            value={formData.referenceNumber}
            onChange={(e) => setFormData(prev => ({...prev, referenceNumber: e.target.value}))}
            required
          />
        </div>

        <div className="form-group">
          <label>หมายเหตุ</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>ไฟล์รูปภาพสลิป</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            required
          />
        </div>

        <button type="submit" disabled={saving || !imageFile} className="save-button">
          {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลสลิป'}
        </button>
      </form>

      <style jsx>{`
        .payment-slip-form {
          max-width: 500px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
        }

        .slip-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .form-group label {
          font-weight: 500;
          color: #333;
        }

        .form-group input,
        .form-group textarea {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }

        .save-button {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 10px;
        }

        .save-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .save-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .payment-slip-success {
          max-width: 500px;
          margin: 20px auto;
          padding: 20px;
          border: 1px solid #d4edda;
          border-radius: 8px;
          background: #d4edda;
          color: #155724;
          text-align: center;
        }
      `}</style>
    </div>
  );
};
