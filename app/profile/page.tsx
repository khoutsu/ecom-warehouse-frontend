'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile, getUserDocument } from '../../lib/userService';

interface UserData {
  name?: string;
  phone?: string;
  address?: string;
  role?: string;
}

interface ProfileForm {
  name: string;
  phone: string;
  address: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoading2, setIsLoading2] = useState(false);
  const [message, setMessage] = useState('');
  
  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: '',
    phone: '',
    address: ''
  });

  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    const fetchUserData = async () => {
      if (user?.id) {
        try {
          const data = await getUserDocument(user.id);
          setUserData(data);
          setProfileForm({
            name: data?.name || '',
            phone: data?.phone || '',
            address: data?.address || ''
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          setMessage('เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
          setIsLoading(false);
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
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim()
      });

      const updatedData = await getUserDocument(user.id);
      setUserData(updatedData);
      setIsEditing(false);
      setMessage('อัปเดตข้อมูลสำเร็จ!');
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
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
        minHeight: '60vh',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '16px'
        }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            ⚙️ ตั้งค่าบัญชี
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: '16px',
            margin: 0
          }}>
            จัดการข้อมูลส่วนตัวและการตั้งค่าความปลอดภัย
          </p>
        </div>

        {message && (
          <div style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: message.includes('สำเร็จ') ? '#dcfce7' : '#fef2f2',
            border: `1px solid ${message.includes('สำเร็จ') ? '#bbf7d0' : '#fecaca'}`,
            color: message.includes('สำเร็จ') ? '#166534' : '#dc2626',
            textAlign: 'center',
            fontWeight: '500'
          }}>
            {message}
          </div>
        )}

        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '16px', 
          border: '1px solid #e1e5e9',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px 32px',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#fafbfc'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ 
                  color: '#1e293b', 
                  margin: '0 0 4px 0',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  👤 ข้อมูลส่วนตัว
                </h2>
                <p style={{
                  margin: 0,
                  color: '#64748b',
                  fontSize: '14px'
                }}>
                  จัดการข้อมูลส่วนตัวของคุณ
                </p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563eb';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  ✏️ แก้ไข
                </button>
              )}
            </div>
          </div>

          <div style={{ padding: '32px' }}>
            {!isEditing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '500', 
                      color: '#374151',
                      fontSize: '15px',
                      marginBottom: '4px'
                    }}>
                      อีเมล
                    </label>
                    <div style={{ 
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      {user?.email}
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    ไม่สามารถแก้ไขได้
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '500', 
                      color: '#374151',
                      fontSize: '15px',
                      marginBottom: '4px'
                    }}>
                      ชื่อ
                    </label>
                    <div style={{ 
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      {userData?.name || 'ยังไม่ได้ระบุ'}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '500', 
                      color: '#374151',
                      fontSize: '15px',
                      marginBottom: '4px'
                    }}>
                      เบอร์โทรศัพท์
                    </label>
                    <div style={{ 
                      color: '#6b7280',
                      fontSize: '14px'
                    }}>
                      {userData?.phone || 'ยังไม่ได้ระบุ'}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid #f1f5f9'
                }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '500', 
                      color: '#374151',
                      fontSize: '15px',
                      marginBottom: '4px'
                    }}>
                      ที่อยู่
                    </label>
                    <div style={{ 
                      color: '#6b7280',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {userData?.address || 'ยังไม่ได้ระบุ'}
                    </div>
                  </div>
                </div>

                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0' 
                }}>
                  <div>
                    <label style={{ 
                      display: 'block', 
                      fontWeight: '500', 
                      color: '#374151',
                      fontSize: '15px',
                      marginBottom: '4px'
                    }}>
                      สถานะบัญชี
                    </label>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      backgroundColor: isAdmin ? '#ecfdf5' : '#eff6ff',
                      color: isAdmin ? '#059669' : '#2563eb',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      {isAdmin ? '👑 ผู้ดูแลระบบ' : '👤 ลูกค้า'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '500', 
                    color: '#374151',
                    fontSize: '15px',
                    marginBottom: '8px'
                  }}>
                    ชื่อ *
                  </label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="กรอกชื่อของคุณ"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '15px',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '500', 
                    color: '#374151',
                    fontSize: '15px',
                    marginBottom: '8px'
                  }}>
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="กรอกเบอร์โทรศัพท์"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '15px',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    fontWeight: '500', 
                    color: '#374151',
                    fontSize: '15px',
                    marginBottom: '8px'
                  }}>
                    ที่อยู่
                  </label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="กรอกที่อยู่ของคุณ"
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '15px',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                <div style={{ 
                  display: 'flex', 
                  gap: '12px',
                  marginTop: '8px'
                }}>
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
                      flex: 1,
                      padding: '12px 24px',
                      backgroundColor: '#f8fafc',
                      color: '#475569',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = '#e2e8f0';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading2}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      backgroundColor: isLoading2 ? '#94a3b8' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: isLoading2 ? 'not-allowed' : 'pointer',
                      fontSize: '15px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      if (!isLoading2) {
                        e.currentTarget.style.backgroundColor = '#059669';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isLoading2) {
                        e.currentTarget.style.backgroundColor = '#10b981';
                      }
                    }}
                  >
                    {isLoading2 ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
