'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getAllUsers, UserData, updateUserRole } from '../../lib/userService';

export default function UsersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user && user.role !== 'admin') {
      // Only admins can access user management
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (user && user.role === 'admin') {
        try {
          setLoading(true);
          const allUsers = await getAllUsers();
          setUsers(allUsers);
        } catch (error: any) {
          console.error('Error fetching users:', error);
          setError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUsers();
  }, [user]);

  const handleRoleChange = async (targetUserId: string, newRole: 'admin' | 'customer') => {
    if (!user || user.role !== 'admin') {
      setError('ไม่ได้รับอนุญาต: เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเปลี่ยนบทบาทผู้ใช้ได้');
      return;
    }

    try {
      setUpdatingRole(targetUserId);
      await updateUserRole(targetUserId, newRole, user.id);
      
      // Update the local state
      setUsers(users.map(userData => 
        userData.uid === targetUserId 
          ? { ...userData, role: newRole }
          : userData
      ));
      
      setError('');
    } catch (error: any) {
      console.error('Error updating user role:', error);
      setError(error.message || 'ไม่สามารถอัปเดตบทบาทผู้ใช้ได้');
    } finally {
      setUpdatingRole(null);
    }
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">กำลังโหลด...</div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>จัดการผู้ใช้</h1>
        <p>จัดการผู้ใช้ที่ลงทะเบียนและบทบาทของพวกเขา</p>
      </div>

      <div className="dashboard-content">
        {error && (
          <div className="error-message">{error}</div>
        )}
        
        {loading ? (
          <div className="loading">กำลังโหลดข้อมูลผู้ใช้...</div>
        ) : (
          <div className="users-table-container">
            <h2>ผู้ใช้ที่ลงทะเบียน ({users.length})</h2>
            <div className="users-table">
              <div className="table-header">
                <div className="table-cell">ชื่อ</div>
                <div className="table-cell">อีเมล</div>
                <div className="table-cell">บทบาท</div>
                <div className="table-cell">สถานะ</div>
                <div className="table-cell">สร้างเมื่อ</div>
                <div className="table-cell">เข้าสู่ระบบล่าสุด</div>
                <div className="table-cell">การดำเนินการ</div>
              </div>
              {users.map((userData) => (
                <div key={userData.uid} className="table-row">
                  <div className="table-cell">{userData.name}</div>
                  <div className="table-cell">{userData.email}</div>
                  <div className="table-cell">
                    <span className={`role-badge role-${userData.role}`}>
                      {userData.role}
                    </span>
                  </div>
                  <div className="table-cell">
                    <span className={`status-badge ${userData.isActive ? 'status-active' : 'status-inactive'}`}>
                      {userData.isActive ? 'ใช้งานอยู่' : 'ไม่ได้ใช้งาน'}
                    </span>
                  </div>
                  <div className="table-cell">
                    {userData.createdAt?.seconds 
                      ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString('th-TH')
                      : 'ไม่มีข้อมูล'
                    }
                  </div>
                  <div className="table-cell">
                    {userData.lastLogin?.seconds 
                      ? new Date(userData.lastLogin.seconds * 1000).toLocaleString('th-TH')
                      : 'ไม่เคยเข้าสู่ระบบ'
                    }
                  </div>
                  <div className="table-cell">
                    {user && user.role === 'admin' && userData.uid !== user.id && (
                      <div className="role-controls">
                        <select
                          value={userData.role}
                          onChange={(e) => handleRoleChange(userData.uid, e.target.value as 'admin' | 'customer')}
                          disabled={updatingRole === userData.uid}
                          className="role-select"
                        >
                          <option value="customer">ลูกค้า</option>
                          <option value="admin">ผู้ดูแลระบบ</option>
                        </select>
                        {updatingRole === userData.uid && (
                          <span className="updating-indicator">กำลังอัปเดต...</span>
                        )}
                      </div>
                    )}
                    {userData.uid === user?.id && (
                      <span className="current-user-badge">คุณ</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-footer">
        <button onClick={() => router.push('/dashboard')} className="action-button">
          กลับไปยังแดชบอร์ด
        </button>
      </div>
    </div>
  );
}
