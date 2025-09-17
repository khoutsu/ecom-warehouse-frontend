'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../app/contexts/AuthContext';
import { 
  getUserNotifications, 
  getNotificationsByRole, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  subscribeToUserNotifications,
  subscribeToRoleNotifications,
  NotificationData 
} from '../lib/notificationService';

interface NotificationBellProps {
  onClick?: () => void;
}

export function NotificationBell({ onClick }: NotificationBellProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!user) return;

    const isAdmin = user.role === 'admin';

    let unsubscribe: (() => void) | undefined;

    if (isAdmin) {
      // Subscribe to role-based notifications for admin
      unsubscribe = subscribeToRoleNotifications(
        'admin',
        (newNotifications) => {
          setNotifications(newNotifications);
          setUnreadCount(newNotifications.filter(n => !n.isRead).length);
        }
      );
    } else {
      // Subscribe to user-specific notifications for customers
      unsubscribe = subscribeToUserNotifications(user.id, (newNotifications) => {
        setNotifications(newNotifications);
        setUnreadCount(newNotifications.filter(n => !n.isRead).length);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (onClick) onClick();
  };

  const handleNotificationClick = async (notification: NotificationData) => {
    if (!notification.isRead && notification.id) {
      try {
        await markNotificationAsRead(notification.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await markAllNotificationsAsRead(user.id);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the notification click
    
    setIsLoading(true);
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      await deleteAllNotifications(user.id);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const notificationTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - notificationTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'เมื่อสักครู่';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
    return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_new': return '🔔';
      case 'order_status_change': return '📋';
      case 'inventory_low': return '⚠️';
      default: return '';
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleBellClick}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '6px',
          borderRadius: '50%',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f0f0f0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              backgroundColor: '#dc3545',
              color: 'white',
              borderRadius: '50%',
              width: '16px',
              height: '16px',
              fontSize: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Mobile backdrop */}
          {isMobile && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 999
              }}
              onClick={() => setIsOpen(false)}
            />
          )}
          
          <div
            style={{
              position: isMobile ? 'fixed' : 'absolute',
              top: isMobile ? '0' : '100%',
              right: isMobile ? '0' : '0',
              left: isMobile ? '0' : 'auto',
              bottom: isMobile ? '0' : 'auto',
              width: isMobile ? '100vw' : '400px',
              maxHeight: isMobile ? '100vh' : '500px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: isMobile ? '0' : '8px',
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              zIndex: 1000,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
          {/* Header */}
          <div
            style={{
              padding: '15px',
              borderBottom: '1px solid #eee',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
              การแจ้งเตือน
            </h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#007bff',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    opacity: isLoading ? 0.6 : 1
                  }}
                >
                  {isLoading ? 'กำลังอัปเดต...' : 'อ่านทั้งหมด'}
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleDeleteAllNotifications}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc3545',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    opacity: isLoading ? 0.6 : 1
                  }}
                >
                  {isLoading ? 'กำลังลบ...' : 'ลบทั้งหมด'}
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div style={{ 
            maxHeight: isMobile ? 'calc(100vh - 120px)' : '400px', 
            overflowY: 'auto',
            flex: 1
          }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#6c757d'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '10px' }}>🔕</div>
                <p>ไม่มีการแจ้งเตือน</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  style={{
                    padding: isMobile ? '20px 15px' : '15px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    backgroundColor: notification.isRead ? 'white' : '#f8f9ff',
                    transition: 'background-color 0.2s',
                    position: 'relative',
                    minHeight: isMobile ? '60px' : 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (notification.isRead) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    } else {
                      e.currentTarget.style.backgroundColor = '#f0f0ff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.isRead ? 'white' : '#f8f9ff';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{ fontSize: '20px', marginTop: '2px' }}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: notification.isRead ? 'normal' : 'bold',
                          fontSize: '14px',
                          marginBottom: '4px',
                          color: '#333'
                        }}
                      >
                        {notification.title}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#666',
                          marginBottom: '6px',
                          lineHeight: '1.4'
                        }}
                      >
                        {notification.message}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#999'
                        }}
                      >
                        {formatTimeAgo(notification.createdAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      {!notification.isRead && (
                        <div
                          style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#007bff',
                            borderRadius: '50%'
                          }}
                        />
                      )}
                      <button
                        onClick={(e) => handleDeleteNotification(notification.id!, e)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          fontSize: '14px',
                          cursor: 'pointer',
                          padding: '2px',
                          borderRadius: '2px',
                          lineHeight: 1,
                          opacity: 0.7,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.7';
                        }}
                        title="ลบการแจ้งเตือน"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: '10px',
                borderTop: '1px solid #eee',
                backgroundColor: '#f8f9fa',
                textAlign: 'center'
              }}
            >
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                ปิด
              </button>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;