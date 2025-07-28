'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

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
          E-commerce Warehouse
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
            <Link href="/">Home</Link>
          </li>
          {user && (
            <>
              <li>
                <Link href="/products">Products</Link>
              </li>
              <li>
                <Link href="/inventory">Inventory</Link>
              </li>
              <li>
                <Link href="/orders">Orders</Link>
              </li>
              <li>
                <Link href="/dashboard">Dashboard</Link>
              </li>
            </>
          )}
          {user ? (
            <>
              <li>
                <span className="navbar-user">Hello, {user.name}</span>
              </li>
              <li>
                <button onClick={handleLogout} className="navbar-logout">Logout</button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login">Login</Link>
              </li>
              <li>
                <Link href="/register">Register</Link>
              </li>
            </>
          )}
        </ul>

        {/* Mobile navigation */}
        <ul className={`navbar-nav mobile-nav ${isMenuOpen ? 'open' : ''}`}>
          <li>
            <Link href="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
          </li>
          {user && (
            <>
              <li>
                <Link href="/products" onClick={() => setIsMenuOpen(false)}>Products</Link>
              </li>
              <li>
                <Link href="/inventory" onClick={() => setIsMenuOpen(false)}>Inventory</Link>
              </li>
              <li>
                <Link href="/orders" onClick={() => setIsMenuOpen(false)}>Orders</Link>
              </li>
              <li>
                <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
              </li>
            </>
          )}
          {user ? (
            <>
              <li>
                <span className="navbar-user">Hello, {user.name}</span>
              </li>
              <li>
                <button onClick={handleLogout} className="navbar-logout">Logout</button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
              </li>
              <li>
                <Link href="/register" onClick={() => setIsMenuOpen(false)}>Register</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}
