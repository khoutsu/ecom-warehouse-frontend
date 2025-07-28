'use client';

import { useAuth } from './contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If loading is done and no user is found, redirect to register
    if (!isLoading && !user) {
      router.push('/register');
    }
  }, [user, isLoading, router]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading">
          <h2>กำลังโหลดระบบคลังสินค้าอีคอมเมิร์ซ...</h2>
          <p>กรุณารอสักครู่ขณะที่เราตรวจสอบสถานะการเข้าสู่ระบบของคุณ</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show the main content
  if (user) {
    return (
      <div className="min-h-screen">
        <div className="welcome-container">
          <div className="welcome-content">
            <h1>ยินดีต้อนรับสู่ระบบคลังสินค้าอีคอมเมิร์ซ</h1>
            <p>สวัสดี {user.name}! คุณเข้าสู่ระบบเรียบร้อยแล้ว</p>
            
            <div className="welcome-actions">
              <button 
                onClick={() => router.push('/dashboard')}
                className="welcome-button primary"
              >
                ไปยังแดชบอร์ด
              </button>
              <button 
                onClick={() => router.push('/products')}
                className="welcome-button secondary"
              >
                ดูสินค้า
              </button>
              <button 
                onClick={() => router.push('/inventory')}
                className="welcome-button secondary"
              >
                จัดการสต็อกสินค้า
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This should not be reached due to the useEffect redirect, but just in case
  return null;
}
