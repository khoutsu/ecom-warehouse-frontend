'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { updateUserProfile, changeUserPassword, getUserDocument, UserData } from '../../lib/userService';

interface ProfileFormData {
  name: string;
  phone: string;
  address: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function UserProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    name: '',
    phone: '',
    address: ''
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading2, setIsLoading2] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        try {
          const userDoc = await getUserDocument(user.id);
          if (userDoc) {
            setUserData(userDoc);
            setProfileForm({
              name: userDoc.name || '',
              phone: userDoc.phone || '',
              address: userDoc.address || ''
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setMessage('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsLoading2(true);
    setMessage('');

    try {
      await updateUserProfile(user.id, {
        name: profileForm.name,
        phone: profileForm.phone,
        address: profileForm.address
      });
      
      setMessage('✅ บันทึกข้อมูลเรียบร้อยแล้ว');
      setIsEditing(false);
      
      // Refresh user data
      const updatedUserDoc = await getUserDocument(user.id);
      if (updatedUserDoc) {
        setUserData(updatedUserDoc);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setIsLoading2(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage('❌ รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage('❌ รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsLoading2(true);
    setMessage('');

    try {
      // Note: In a real app, you'd verify current password and hash the new one
      // For demo purposes, we'll just update with the new password
      const hashedPassword = btoa(passwordForm.newPassword); // Simple encoding, use proper hashing in production
      
      await changeUserPassword(user.id, hashedPassword);
      
      setMessage('✅ เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
      setIsChangingPassword(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage('❌ เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
    } finally {
      setIsLoading2(false);
    }
  };

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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
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
          👤 จัดการข้อมูลส่วนตัว
        </h1>
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

      {/* Message */}
      {message && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          borderRadius: '8px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          color: message.includes('✅') ? '#155724' : '#721c24'
        }}>
          {message}
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '30px' 
      }}>
        {/* Profile Information Card */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px'
          }}>
            <h2 style={{ 
              color: '#333', 
              margin: 0,
              fontSize: '1.8rem',
            }}>
              ข้อมูลส่วนตัว
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ✏️ แก้ไข
              </button>
            )}
          </div>
          
          {!isEditing ? (
            /* Display Mode */
            <div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '5px'
                }}>
                  อีเมล:
                </label>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '12px', 
                  borderRadius: '6px',
                  color: '#333'
                }}>
                  {user.email}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '5px'
                }}>
                  ชื่อ:
                </label>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '12px', 
                  borderRadius: '6px',
                  color: '#333'
                }}>
                  {userData?.name || 'ยังไม่ได้ระบุ'}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '5px'
                }}>
                  เบอร์โทรศัพท์:
                </label>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '12px', 
                  borderRadius: '6px',
                  color: '#333'
                }}>
                  {userData?.phone || 'ยังไม่ได้ระบุ'}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '5px'
                }}>
                  ที่อยู่:
                </label>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '12px', 
                  borderRadius: '6px',
                  color: '#333'
                }}>
                  {userData?.address || 'ยังไม่ได้ระบุ'}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '5px'
                }}>
                  สถานะ:
                </label>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  padding: '12px', 
                  borderRadius: '6px',
                  color: isAdmin ? '#28a745' : '#007bff',
                  fontWeight: 'bold'
                }}>
                  {isAdmin ? '👑 ผู้ดูแลระบบ (Admin)' : '👤 ลูกค้า (Customer)'}
                </div>
              </div>
            </div>
          ) : (
            /* Edit Mode */
            <form onSubmit={handleProfileSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '5px'
                }}>
                  ชื่อ: *
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="กรอกชื่อของคุณ"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '5px'
                }}>
                  เบอร์โทรศัพท์:
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="กรอกเบอร์โทรศัพท์"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '5px'
                }}>
                  ที่อยู่:
                </label>
                <textarea
                  value={profileForm.address}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="กรอกที่อยู่ของคุณ"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setProfileForm({
                      name: userData?.name || '',
                      phone: userData?.phone || '',
                      address: userData?.address || ''
                    });
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isLoading2}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isLoading2 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isLoading2 ? 0.6 : 1
                  }}
                >
                  {isLoading2 ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Password Change Card */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '30px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '25px'
          }}>
            <h2 style={{ 
              color: '#333', 
              margin: 0,
              fontSize: '1.8rem',
            }}>
              เปลี่ยนรหัสผ่าน
            </h2>
            {!isChangingPassword && (
              <button
                onClick={() => setIsChangingPassword(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔒 เปลี่ยนรหัสผ่าน
              </button>
            )}
          </div>

          {!isChangingPassword ? (
            <div style={{
              textAlign: 'center',
              color: '#6c757d',
              padding: '40px 0'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔐</div>
              <p>คลิกปุ่ม "เปลี่ยนรหัสผ่าน" เพื่อเปลี่ยนรหัสผ่านของคุณ</p>
            </div>
          ) : (
            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '5px'
                }}>
                  รหัสผ่านปัจจุบัน: *
                </label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  required
                  placeholder="กรอกรหัสผ่านปัจจุบัน"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '5px'
                }}>
                  รหัสผ่านใหม่: *
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  required
                  placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontWeight: 'bold', 
                  color: '#495057',
                  marginBottom: '5px'
                }}>
                  ยืนยันรหัสผ่านใหม่: *
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isLoading2}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: isLoading2 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    opacity: isLoading2 ? 0.6 : 1
                  }}
                >
                  {isLoading2 ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}