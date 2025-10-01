'use client';

import { useState } from 'react';
import { sendPasswordReset, validateEmailForReset } from '../../lib/passwordResetService';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('กรุณากรอกอีเมล');
      setIsSuccess(false);
      return;
    }

    // Validate email format
    const validation = validateEmailForReset(email);
    if (!validation.isValid) {
      setMessage(validation.message || 'อีเมลไม่ถูกต้อง');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await sendPasswordReset(email);
      
      if (result.success) {
        setMessage('ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบอีเมล');
        setIsSuccess(true);
      } else {
        setMessage(result.message || 'เกิดข้อผิดพลาดในการส่งอีเมล');
        setIsSuccess(false);
      }
    } catch (error: any) {
      setMessage('เกิดข้อผิดพลาดในการส่งอีเมล กรุณาลองใหม่อีกครั้ง');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">รีเซ็ตรหัสผ่าน</h1>
        <p className="auth-subtitle">กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>
        
        {!isSuccess ? (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">อีเมล</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="กรอกอีเมลของคุณ"
                className="form-input"
                required
              />
            </div>

            {message && (
              <div className={`message ${isSuccess ? 'success-message' : 'error-message'}`}>
                {message}
              </div>
            )}

            <button 
              type="submit" 
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต'}
            </button>
          </form>
        ) : (
          <div className="success-container">
            <div className="success-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#10b981"/>
                <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="success-message">
              {message}
            </div>
            <div className="reset-tips">
              <h3>คำแนะนำ:</h3>
              <ul>
                <li>• ตรวจสอบกล่องจดหมายและโฟลเดอร์ Spam</li>
                <li>• ลิงก์จะหมดอายุใน 1 ชั่วโมง</li>
                <li>• แนะนำให้ใช้ Gmail เพื่อความรวดเร็ว</li>
              </ul>
            </div>
            <button 
              onClick={() => router.push('/login')}
              className="auth-button"
              style={{ marginTop: '1rem' }}
            >
              กลับไปเข้าสู่ระบบ
            </button>
          </div>
        )}

        <div className="auth-footer">
          <p>จำรหัสผ่านได้แล้ว? <Link href="/login" className="auth-link">เข้าสู่ระบบ</Link></p>
        </div>
      </div>
    </div>
  );
}