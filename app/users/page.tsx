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
      if (user) {
        try {
          setLoading(true);
          const allUsers = await getAllUsers();
          setUsers(allUsers);
        } catch (error: any) {
          console.error('Error fetching users:', error);
          setError('Failed to load users');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUsers();
  }, [user]);

  const handleRoleChange = async (targetUserId: string, newRole: 'admin' | 'customer') => {
    if (!user || user.role !== 'admin') {
      setError('Unauthorized: Only admins can change user roles');
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
      setError(error.message || 'Failed to update user role');
    } finally {
      setUpdatingRole(null);
    }
  };

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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>User Management</h1>
        <p>Manage registered users</p>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading">Loading users...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="users-table-container">
            <h2>Registered Users ({users.length})</h2>
            <div className="users-table">
              <div className="table-header">
                <div className="table-cell">Name</div>
                <div className="table-cell">Email</div>
                <div className="table-cell">Role</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Created</div>
                <div className="table-cell">Last Login</div>
                <div className="table-cell">Actions</div>
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
                      {userData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="table-cell">
                    {userData.createdAt?.seconds 
                      ? new Date(userData.createdAt.seconds * 1000).toLocaleDateString()
                      : 'N/A'
                    }
                  </div>
                  <div className="table-cell">
                    {userData.lastLogin?.seconds 
                      ? new Date(userData.lastLogin.seconds * 1000).toLocaleString()
                      : 'Never'
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
                          <option value="customer">Customer</option>
                          <option value="admin">Admin</option>
                        </select>
                        {updatingRole === userData.uid && (
                          <span className="updating-indicator">Updating...</span>
                        )}
                      </div>
                    )}
                    {userData.uid === user?.id && (
                      <span className="current-user-badge">You</span>
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
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
