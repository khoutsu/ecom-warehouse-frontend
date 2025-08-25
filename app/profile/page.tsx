'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function UserProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        กำลังโหลด...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        borderBottom: '2px solid #007bff',
        paddingBottom: '20px'
      }}>
        <h1 style={{ 
          color: '#333', 
          margin: 0, 
          fontSize: '2.5rem',
          fontWeight: 'bold'
        }}>
          👤 ข้อมูลผู้ใช้
        </h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          {isAdmin && (
            <button 
              onClick={() => router.push('/users')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500'
              }}
            >
              จัดการผู้ใช้
            </button>
          )}
          <button 
            onClick={() => router.push('/dashboard')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            กลับไปแดชบอร์ด
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr', 
        gap: '30px' 
      }}>
        {/* User Profile Card */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            color: '#333', 
            marginBottom: '25px',
            fontSize: '1.8rem',
            borderBottom: '1px solid #e9ecef',
            paddingBottom: '10px'
          }}>
            ข้อมูลส่วนตัว
          </h2>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <label style={{ 
                display: 'block', 
                fontWeight: 'bold', 
                color: '#495057',
                marginBottom: '5px'
              }}>
                อีเมล:
              </label>
              <span style={{ color: '#333', fontSize: '16px' }}>{user.email}</span>
            </div>

            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <label style={{ 
                display: 'block', 
                fontWeight: 'bold', 
                color: '#495057',
                marginBottom: '5px'
              }}>
                บทบาท:
              </label>
              <span style={{ 
                color: isAdmin ? '#28a745' : '#007bff', 
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {isAdmin ? '👑 ผู้ดูแลระบบ (Admin)' : '👤 ผู้ใช้ทั่วไป (Customer)'}
              </span>
            </div>

            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px', 
              borderRadius: '8px'
            }}>
              <label style={{ 
                display: 'block', 
                fontWeight: 'bold', 
                color: '#495057',
                marginBottom: '5px'
              }}>
                รหัสผู้ใช้:
              </label>
              <span style={{ color: '#666', fontSize: '14px', fontFamily: 'monospace' }}>
                {user.id}
              </span>
            </div>
          </div>

          {/* Role-specific information */}
          <div style={{ 
            padding: '20px',
            backgroundColor: isAdmin ? '#d4edda' : '#e7f3ff',
            borderRadius: '8px',
            border: `2px solid ${isAdmin ? '#28a745' : '#007bff'}`
          }}>
            <h4 style={{ 
              color: isAdmin ? '#155724' : '#004085', 
              margin: '0 0 10px 0',
              fontSize: '1.2rem'
            }}>
              {isAdmin ? '🔧 สิทธิ์ผู้ดูแลระบบ' : '📋 สิทธิ์ผู้ใช้ทั่วไป'}
            </h4>
            <ul style={{ 
              color: isAdmin ? '#155724' : '#004085', 
              margin: 0, 
              paddingLeft: '20px',
              lineHeight: '1.6'
            }}>
              {isAdmin ? (
                <>
                  <li>จัดการข้อมูลผู้ใช้ทั้งหมด</li>
                  <li>เข้าถึงระบบคลังสินค้า</li>
                  <li>จัดการสินค้าและหมวดหมู่</li>
                  <li>ดูรายงานและสถิติระบบ</li>
                  <li>จัดการคำสั่งซื้อทั้งหมด</li>
                </>
              ) : (
                <>
                  <li>ดูข้อมูลส่วนตัว</li>
                  <li>เรียกดูรายการสินค้า</li>
                  <li>สั่งซื้อสินค้า</li>
                  <li>ตรวจสอบประวัติการสั่งซื้อ</li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Admin Quick Access Panel */}
        {isAdmin && (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '30px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ 
              color: '#333', 
              marginBottom: '25px',
              fontSize: '1.8rem',
              borderBottom: '1px solid #e9ecef',
              paddingBottom: '10px'
            }}>
              🔧 เครื่องมือผู้ดูแลระบบ
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <button 
                onClick={() => router.push('/users')}
                style={{
                  padding: '15px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span>👥</span>
                <div>
                  <div>จัดการผู้ใช้</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>เพิ่ม แก้ไข ลบผู้ใช้</div>
                </div>
              </button>

              <button 
                onClick={() => router.push('/inventory')}
                style={{
                  padding: '15px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span>📦</span>
                <div>
                  <div>ระบบคลังสินค้า</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>จัดการสต็อกและสินค้า</div>
                </div>
              </button>

              <button 
                onClick={() => router.push('/products')}
                style={{
                  padding: '15px 20px',
                  backgroundColor: '#ffc107',
                  color: '#212529',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span>🛍️</span>
                <div>
                  <div>จัดการสินค้า</div>
                  <div style={{ fontSize: '12px', opacity: 0.8 }}>เพิ่ม แก้ไข สินค้าใหม่</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
