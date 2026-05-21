// components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar-auth">
      <div className="nav-container">
        <Link to="/" className="logo">
          <i className="fas fa-heart-pulse"></i>
          <span>PMOS<span className="logo-pcos"> | Pulse</span></span>
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              {/* Home is available to everyone when logged in */}
              <Link to="/" className="nav-link">
                <i className="fas fa-home"></i> Home
              </Link>

              {user.is_admin ? (
                <Link to="/admin" className="nav-link admin-link">
                  <i className="fas fa-shield-alt"></i> Admin Dashboard
                </Link>
              ) : (
                <Link to="/dashboard" className="nav-link">
                  <i className="fas fa-chart-pie"></i> Dashboard
                </Link>
              )}

              <div className="user-menu">
                <span className="user-email">
                  <i className="fas fa-user-circle"></i> {user.username || user.email}
                </span>
                <button onClick={handleLogout} className="logout-btn">
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="nav-btn-login">Log in</Link>
              <Link to="/signup" className="nav-btn-signup">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;