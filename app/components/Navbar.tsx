'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NotificationBell from '../../components/NotificationBell';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    router.push('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-brand" >
          ร้านค้าวิสาหกิจชุมชนป่าต้นผี้ง
        </Link>
        {/* Mobile menu button */}
        <button 
          className="mobile-menu-button"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-line ${isMenuOpen ? 'open' : ''}`}></span>
        </button>

        {/* Desktop navigation */}
        <ul className="navbar-nav desktop-nav">
          <li>
            <Link href="/">หน้าหลัก</Link>
          </li>
          {user && (
            <>
              <li>
                <Link href="/products">
                  {user.role === 'admin' ? 'จัดการสินค้า' : 'ร้านค้า'}
                </Link>
              </li>
              <li>
                <Link href="/orders">คำสั่งซื้อ</Link>
              </li>
              <li>
                <Link href="/profile">ข้อมูลผู้ใช้</Link>
              </li>
              {user.role === 'admin' && (
                <>
                  <li>
                    <Link href="/inventory">คลังสินค้า</Link>
                  </li>
                   <li>
                     <Link href="/dashboard">แดชบอร์ด</Link>
                  </li>
                </>
              )}
            </>
          )}
          {user ? (
            <>
              <li>
                <NotificationBell />
              </li>
              <li>
                <span className="navbar-user">สวัสดี, {user.name}</span>
              </li>
              <li>
                <button onClick={handleLogout} className="navbar-logout">ออกจากระบบ</button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login">เข้าสู่ระบบ</Link>
              </li>
              <li>
                <Link href="/register">สมัครสมาชิก</Link>
              </li>
            </>
          )}
        </ul>

        {/* Mobile navigation */}
        <ul className={`navbar-nav mobile-nav ${isMenuOpen ? 'open' : ''}`}>
          <li>
            <Link href="/" onClick={() => setIsMenuOpen(false)}>หน้าหลัก</Link>
          </li>
          {user && (
            <>
              <li>
                <Link href="/products" onClick={() => setIsMenuOpen(false)}>
                  {user.role === 'admin' ? 'จัดการสินค้า' : 'ร้านค้า'}
                </Link>
              </li>
              <li>
                <Link href="/orders" onClick={() => setIsMenuOpen(false)}>คำสั่งซื้อ</Link>
              </li>
           
              <li>
                <Link href="/profile" onClick={() => setIsMenuOpen(false)}>ข้อมูลผู้ใช้</Link>
              </li>
              {user.role === 'admin' && (
                <>
                  <li>
                     <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>แดชบอร์ด</Link>
                  </li>
                  <li>
                    <Link href="/inventory" onClick={() => setIsMenuOpen(false)}>คลังสินค้า</Link>
                  </li>
                  <li>
                    <Link href="/users" onClick={() => setIsMenuOpen(false)}>ผู้ใช้</Link>
                  </li>
                </>
              )}
            </>
          )}
          {user ? (
            <>
              <li>
                <div className="mobile-notification-wrapper">
                  <NotificationBell />
                  <span className="mobile-notification-label">การแจ้งเตือน</span>
                </div>
              </li>
              <li>
                <span className="navbar-user">สวัสดี, {user.name}</span>
              </li>
              <li>
                <button onClick={handleLogout} className="navbar-logout">ออกจากระบบ</button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>เข้าสู่ระบบ</Link>
              </li>
              <li>
                <Link href="/register" onClick={() => setIsMenuOpen(false)}>สมัครสมาชิก</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
