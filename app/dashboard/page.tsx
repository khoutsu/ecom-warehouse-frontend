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
        <div className="loading">Loading...</div>
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
        <h1>ข้อมูลผู้ใช้</h1>
        <p>สวัสดี, {user.name}!</p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h2>ข้อมูลบัญชี</h2>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>
          {user.role && <p><strong>Role:</strong> {user.role}</p>}
          {user.isActive !== undefined && (
            <p><strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}</p>
          )}
          {user.createdAt && (
            <p><strong>Member Since:</strong> {new Date(user.createdAt.seconds * 1000).toLocaleDateString()}</p>
          )}
          {user.lastLogin && (
            <p><strong>Last Login:</strong> {new Date(user.lastLogin.seconds * 1000).toLocaleString()}</p>
          )}
        </div>

        <div className="dashboard-card">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            {user.role === 'admin' && (
              <button 
                className="action-button"
                onClick={() => router.push('/users')}
              >
                Manage Users
              </button>
            )}
            <button className="action-button">View Products</button>
            <button className="action-button">Manage Inventory</button>
            <button className="action-button">View Orders</button>
            <button className="action-button">Generate Reports</button>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Recent Activity</h2>
          <p>No recent activity to display.</p>
        </div>
      </div>

      <div className="dashboard-footer">
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
}
