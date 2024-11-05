import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Login.css';
import logo from '../assets/guardian-angel-logo_pink.png';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const storedError = localStorage.getItem('loginError');
    if (storedError) setError(storedError);
    window.addEventListener('beforeunload', () => localStorage.removeItem('loginError'));
    return () => window.removeEventListener('beforeunload', () => localStorage.removeItem('loginError'));
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const response = await axios.post('http://localhost:5000/login', formData);
        
        // Store user details in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('name', response.data.name);
        localStorage.setItem('userId', response.data.userId);

        setError('');
        localStorage.removeItem('loginError');
        toast.success('Login successful! Redirecting...', { autoClose: 1500 });
        
        setTimeout(() => navigate('/home'), 2200);
    } catch {
        const errorMessage = 'Invalid email or password. Please try again.';
        setError(errorMessage);
        localStorage.setItem('loginError', errorMessage);
        setFormData({ email: '', password: '' });
    }
  };

  return (
    <div className="full-page-container">
      <div className="form-container">
      <img src={logo} alt="Guardian Angel Logo" className="auth-logo" />
        <form onSubmit={handleSubmit} noValidate>
          <h2>Login</h2>
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          {error && <p>{error}</p>}
          <button type="submit">Login</button>
          <div className="link-text">
            <p>Don't have an account? <Link to="/register">Register here</Link>.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;