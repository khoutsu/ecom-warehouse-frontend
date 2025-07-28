'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProductsPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">กำลังโหลด...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>สินค้า</h1>
        <p>ยินดีต้อนรับ, {user.name}! เลือกดูสินค้าของเรา</p>
      </div>

        <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>การดำเนินการ</h2>
          <div className="action-buttons">
            <button className="action-button">ตะกร้าสินค้า</button>
            <button className="action-button">ประวัติการสั่งซื้อ</button>
            <button className="action-button">รายการโปรด</button>
            {user.role === 'admin' && (
              <button 
                className="action-button"
                onClick={() => router.push('/dashboard')}
              >
                ไปยังแดชบอร์ดผู้ดูแล
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-footer">
        <button onClick={handleLogout} className="logout-button">
          ออกจากระบบ
        </button>
      </div>
    </div>
  );
}
