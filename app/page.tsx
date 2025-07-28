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
          <h2>Loading E-commerce Warehouse...</h2>
          <p>Please wait while we check your authentication status.</p>
        </div>
      </div>
    );
  }

  // If user is logged in, show the main content
  if (user) {
    return (
      <div className="min-h-screen">
        <div className="welcome-container">
          <div className="welcome-content">
            <h1>Welcome to E-commerce Warehouse</h1>
            <p>Hello {user.name}! You're successfully logged in.</p>
            
            <div className="welcome-actions">
              <button 
                onClick={() => router.push('/dashboard')}
                className="welcome-button primary"
              >
                Go to Dashboard
              </button>
              <button 
                onClick={() => router.push('/products')}
                className="welcome-button secondary"
              >
                View Products
              </button>
              <button 
                onClick={() => router.push('/inventory')}
                className="welcome-button secondary"
              >
                Manage Inventory
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // This should not be reached due to the useEffect redirect, but just in case
  return null;
}
