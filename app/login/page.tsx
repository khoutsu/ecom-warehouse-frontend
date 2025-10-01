'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccessful, setLoginSuccessful] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const { login, user } = useAuth();
  const router = useRouter();

  // Handle redirect after successful login and user context update
  useEffect(() => {
    if (loginSuccessful && user) {
      if (user.role === 'customer') {
        router.push('/');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, loginSuccessful, router]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      setIsLoading(false);
      return;
    }

    try {
      await login(email, password);
      setLoginSuccessful(true);
      // Reset failed attempts on successful login
      setFailedAttempts(0);
    } catch (error: any) {
      const newFailedAttempts = failedAttempts + 1;
      setFailedAttempts(newFailedAttempts);
      setError(error.message || 'การเข้าสู่ระบบล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">เข้าสู่ระบบ</h1>
        <p className="auth-subtitle">ยินดีต้อนรับสู่ระบบคลังสินค้าอีคอมเมิร์ซ</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">อีเมล</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="กรอกอีเมลของคุณ"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">รหัสผ่าน</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านของคุณ"
              className="form-input"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div className="auth-footer">
          <p>ยังไม่มีบัญชี? <Link href="/register" className="auth-link">สมัครสมาชิกที่นี่</Link></p>
          <p style={{ marginTop: '0.5rem' }}>
            <Link href="/reset-password" className="auth-link">
              ลืมรหัสผ่าน? (Forgot Password?)
            </Link>
          </p>
        </div>
      </div>


    </div>
  );
}
