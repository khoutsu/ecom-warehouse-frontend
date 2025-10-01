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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              รีเซ็ตรหัสผ่าน / Reset Password
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-6">
            กรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน / Enter your email to receive a password reset link
          </p>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล / Email
              </label>
              <input
                type="email"
                id="resetEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your.email@gmail.com"
                disabled={isLoading}
                required
              />
            </div>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-md text-sm ${
                isSuccess 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {isSuccess ? (
                      <svg className="w-4 h-4 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-2">
                    {message}
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                ยกเลิก / Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังส่ง... / Sending...
                  </>
                ) : (
                  'ส่งลิงก์รีเซ็ต / Send Reset Link'
                )}
              </button>
            </div>
          </form>

          {/* Gmail Note */}
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-4 h-4 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-2 text-xs text-blue-700">
                <p className="font-medium">คำแนะนำ / Tips:</p>
                <ul className="mt-1 space-y-1">
                  <li>• ตรวจสอบกล่องจดหมายและโฟลเดอร์ Spam / Check inbox and spam folder</li>
                  <li>• ลิงก์จะหมดอายุใน 1 ชั่วโมง / Link expires in 1 hour</li>
                  <li>• แนะนำให้ใช้ Gmail เพื่อความรวดเร็ว / Gmail recommended for faster delivery</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}