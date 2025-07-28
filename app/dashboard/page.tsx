'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardPage() {
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
        <h1>ยินดีต้อนรับสู่แดชบอร์ดของคุณ</h1>
        <p>สวัสดี, {user.name}!</p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>ข้อมูลบัญชี</h2>
          <p><strong>ชื่อ:</strong> {user.name}</p>
          <p><strong>อีเมล:</strong> {user.email}</p>
          <p><strong>รหัสผู้ใช้:</strong> {user.id}</p>
          {user.role && <p><strong>บทบาท:</strong> {user.role}</p>}
          {user.isActive !== undefined && (
            <p><strong>สถานะ:</strong> {user.isActive ? 'ใช้งานอยู่' : 'ไม่ได้ใช้งาน'}</p>
          )}
          {user.createdAt && (
            <p><strong>สมาชิกตั้งแต่:</strong> {new Date(user.createdAt.seconds * 1000).toLocaleDateString('th-TH')}</p>
          )}
          {user.lastLogin && (
            <p><strong>เข้าสู่ระบบล่าสุด:</strong> {new Date(user.lastLogin.seconds * 1000).toLocaleString('th-TH')}</p>
          )}
        </div>

        <div className="dashboard-card">
          <h2>การดำเนินการด่วน</h2>
          <div className="action-buttons">
            {user.role === 'admin' && (
              <button 
                className="action-button"
                onClick={() => router.push('/users')}
              >
                จัดการผู้ใช้
              </button>
            )}
            <button 
              className="action-button"
              onClick={() => router.push('/products')}
            >
              ดูสินค้า
            </button>
            <button className="action-button">จัดการคลังสินค้า</button>
            <button className="action-button">ดูคำสั่งซื้อ</button>
            <button className="action-button">สร้างรายงาน</button>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>กิจกรรมล่าสุด</h2>
          <p>ไม่มีกิจกรรมล่าสุดให้แสดง</p>
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
