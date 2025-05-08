import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const { isAuthenticated, logout, currentUser } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Handle body scroll locking when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('mobile-menu-open');
    } else {
      document.body.classList.remove('mobile-menu-open');
    }
    
    // Cleanup function
    return () => {
      document.body.classList.remove('mobile-menu-open');
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="logo">
        <Link to="/">
          DocuDino
        </Link>
      </div>

      <button 
        className="mobile-menu-button" 
        onClick={toggleMenu}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        {menuOpen ? '✕' : '☰'}
      </button>

      {menuOpen && (
        <div className="mobile-menu-overlay active" onClick={closeMenu}></div>
      )}

      <nav className={menuOpen ? 'mobile-menu-open' : ''} role="navigation">
        <ul>
          {isAuthenticated ? (
            <>
              <li>
                <NavLink to="/dashboard" className={isActive('/dashboard') ? 'active' : ''} onClick={closeMenu}>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink to="/verify" className={isActive('/verify') ? 'active' : ''} onClick={closeMenu}>
                  Verify
                </NavLink>
              </li>
              {currentUser?.isAdmin && (
                <li>
                  <NavLink to="/admin" className={isActive('/admin') ? 'active' : ''} onClick={closeMenu}>
                    Admin
                  </NavLink>
                </li>
              )}
              <li>
                <NavLink to="/profile" className={isActive('/profile') ? 'active' : ''} onClick={closeMenu}>
                  Profile
                </NavLink>
              </li>
              <li>
                <button onClick={handleLogout} className="logout-button">
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/features" className={isActive('/features') ? 'active' : ''} onClick={closeMenu}>
                  Features
                </NavLink>
              </li>
              <li>
                <NavLink to="/login" className={isActive('/login') ? 'active' : ''} onClick={closeMenu}>
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink to="/register" className="register-button" onClick={closeMenu}>
                  Sign Up
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
