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
      <div className="welcome-container">
        {/* Background slideshow elements */}
          <div className="welcome-bg-2"></div>
          <div className="welcome-bg-3"></div>
          <div className="welcome-content">
                       {user.role === 'admin' ? (
              // Admin welcome
              <>
                <h1>ยินดีต้อนรับสู่ระบบจัดการคลังและผลิตภัณฑ์จานใบไม้</h1>
                <p>สวัสดี คุณ{user.name}! ผู้ดูแลระบบ</p>
              </>
            ) : (
              // Customer welcome
              <>
                <h1>ยินดีต้อนรับสู่ร้านค้าผลิตภัณฑ์จานใบไม้ วิสาหกิจชุมชนป่าต้นผึ้ง</h1>
                <p>สวัสดี คุณ{user.name}ลูกค้า</p>
                <p className="welcome-subtitle">เลือกซื้อผลิตภัณฑ์จานใบไม้คุณภาพดีจากชุมชนของเรา</p>
              </>
            )}     
            <div className="welcome-actions">
              {user.role === 'admin' ? (
                // Admin buttons
                <>
                  <button 
                    onClick={() => router.push('/inventory')}
                    className="welcome-button primary"
                  >
                    จัดการสินค้าคงคลัง
                  </button>
                  <button 
                    onClick={() => router.push('/products')}
                    className="welcome-button secondary"
                  >
                    จัดการสินค้า
                  </button>
                  <button 
                    onClick={() => router.push('/dashboard')}
                    className="welcome-button secondary"
                  >
                    ไปยังแดชบอร์ด
                  </button>
                  <button 
                    onClick={() => router.push('/users')}
                    className="welcome-button secondary"
                  >
                    จัดการผู้ใช้
                  </button>
                </>
              ) : (
                // Customer buttons
                <>
                  <button 
                    onClick={() => router.push('/products')}
                    className="welcome-button primary"
                  >
                    เลือกซื้อสินค้า
                  </button>
                  <button 
                    onClick={() => router.push('/orders')}
                    className="welcome-button secondary"
                  >
                    คำสั่งซื้อของฉัน
                  </button>
                  <button 
                    onClick={() => router.push('/profile')}
                    className="welcome-button secondary"
                  >
                    ข้อมูลส่วนตัว
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
    );
  }

  // This should not be reached due to the useEffect redirect, but just in case
  return null;
}
