import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';
import logo from '../assets/guardian-angel-logo.png';
import '@fortawesome/fontawesome-free/css/all.min.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Navbar = () => {
  const [userName, setUserName] = useState('Guest');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation();

  // Get userId from localStorage
  const userId = localStorage.getItem('userId');

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    setUserName('Guest');
    setIsLoggedIn(false);
    navigate('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get(`${API_BASE_URL}/api/user/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUserName(response.data.name);
          setIsLoggedIn(true);
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            handleLogout();
          }
        });
    }
  }, [isLoggedIn]);

  // Prevent Navbar from rendering on login or register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to={`/home/${userId}`}>
          <img src={logo} alt="Guardian Angel Logo" className="navbar-logo" />
          Guardian Angel
        </Link>
      </div>
      <div className="burger-menu" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        <i className="fas fa-bars"></i>
      </div>
      <ul className={`navbar-links ${isMenuOpen ? 'active' : ''}`}>
        <li><Link to={`/home/${userId}`}>Home</Link></li>
        <li><Link to="/view-requests">View Requests</Link></li>
        <li><Link to="/create-request">Create Request</Link></li>
      </ul>
      <div className="navbar-user">
        {isLoggedIn ? (
          <>
            <Link to="/profile" className="navbar-user-link">
              <i className="fas fa-user navbar-user-icon"></i>
              <span className="navbar-username">Hello, {userName}</span>
            </Link>
            <button onClick={handleLogout} className="navbar-logout">
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;