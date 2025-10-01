'use client';

import React, { useState } from 'react';
import { sendPasswordReset, validateEmailForReset } from '../../lib/passwordResetService';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccess?: () => void;
}

export default function PasswordResetModal({
  isOpen,
  onClose,
  initialEmail = '',
  onSuccess
}: PasswordResetModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage('กรุณากรอกอีเมล / Please enter your email');
      setIsSuccess(false);
      return;
    }

    // Validate email format
    const validation = validateEmailForReset(email);
    if (!validation.isValid) {
      setMessage(validation.message || 'อีเมลไม่ถูกต้อง / Invalid email');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const result = await sendPasswordReset(email);
      
      if (result.success) {
        setMessage(result.message);
        setIsSuccess(true);
        
        // Auto close modal after 3 seconds on success
        setTimeout(() => {
          onClose();
          if (onSuccess) {
            onSuccess();
          }
        }, 3000);
      } else {
        setMessage(result.message);
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setMessage('เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน กรุณาลองใหม่ ');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail(initialEmail);
    setMessage('');
    setIsSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full" style={{ maxWidth: '400px' }}>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold" style={{ color: '#2d5016' }}>
              รีเซ็ตรหัสผ่าน
            </h2>
            <button
              onClick={handleClose}
              className="hover:opacity-70 transition-opacity"
              style={{ color: '#666' }}
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Description */}
          <p className="text-sm mb-6" style={{ color: '#666' }}>
            กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
          </p>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="resetEmail" className="block text-sm font-medium mb-1" style={{ color: '#2d5016' }}>
                อีเมล
              </label>
              <input
                type="email"
                id="resetEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border-2 rounded focus:outline-none transition-colors"
                style={{ 
                  borderColor: '#ddd', 
                  fontSize: '1rem'
                }}
                onFocus={(e) => e.target.style.borderColor = '#90EE90'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
                placeholder="your.email@gmail.com"
                disabled={isLoading}
                required
              />
            </div>

            {/* Message */}
            {message && (
              <div 
                className="p-3 rounded text-sm text-center"
                style={{
                  backgroundColor: isSuccess ? '#d4edda' : '#ffeaa7',
                  color: isSuccess ? '#155724' : '#d63031'
                }}
              >
                {message}
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded transition-colors"
                style={{
                  color: '#666',
                  backgroundColor: '#f5f5f5',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#e5e5e5'}
                onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#f5f5f5'}
                disabled={isLoading}
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="px-4 py-2 rounded transition-colors flex items-center"
                style={{
                  backgroundColor: isLoading || !email.trim() ? '#ccc' : '#90EE90',
                  color: isLoading || !email.trim() ? '#666' : '#2d5016',
                  border: 'none',
                  cursor: isLoading || !email.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => {
                  if (!isLoading && email.trim()) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#7dd87d';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isLoading && email.trim()) {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#90EE90';
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 mr-2" style={{ borderColor: '#666' }}></div>
                    กำลังส่ง...
                  </>
                ) : (
                  'ส่งลิงก์รีเซ็ต'
                )}
              </button>
            </div>
          </form>

          {/* Tips Section */}
          <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#f0f8f0' }}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 mt-0.5" fill="#90EE90" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2 text-xs" style={{ color: '#2d5016' }}>
                <p className="font-medium">คำแนะนำ:</p>
                <ul className="mt-1 space-y-1">
                  <li>• ตรวจสอบกล่องจดหมายและโฟลเดอร์ Spam</li>
                  <li>• ลิงก์จะหมดอายุใน 1 ชั่วโมง</li>
                  <li>• แนะนำให้ใช้ Gmail เพื่อความรวดเร็ว</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}