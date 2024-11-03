import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Navbar.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Navbar = () => {
  const [userName, setUserName] = useState('Guest');
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token on logout
    navigate('/login'); // Redirect to login page
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get('http://localhost:5000/user/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUserName(response.data.name); // Assumes response has 'name' field
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            handleLogout(); // Logs out if token is invalid or expired
          } else {
            console.warn('Failed to load profile data. Please try again later.');
          }
        });
    }
  }, [navigate]); // Dependencies updated to include `navigate`

  // Prevent Navbar from rendering on login or register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/home">Guardian Angel</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/home">Home</Link></li>
        <li><Link to="/view-requests">View Requests</Link></li>
        <li><Link to="/create-request">Create Request</Link></li>
      </ul>
      <div className="navbar-user">
        {localStorage.getItem('token') ? (
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