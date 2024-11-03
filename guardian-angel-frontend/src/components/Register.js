import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({ name: '', surname: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState({ name: '', surname: '', email: '', password: '', confirmPassword: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError({ ...error, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError({ ...error, confirmPassword: 'Passwords do not match!' });
      return;
    }
    try {
      const response = await axios.post('http://localhost:5000/register', {
        name: formData.name,
        surname: formData.surname,
        email: formData.email,
        password: formData.password
      });
      
      // Save the JWT token in localStorage if registration is successful
      localStorage.setItem('token', response.data.token);
      setError({});
      navigate('/home');
    } catch (err) {
      console.error('Registration error:', err); // Log the error for debugging
      setError({ confirmPassword: 'Registration failed. Please try again.' });
    }
  };

  return (
    <div className="full-page-container">
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <h2>Register</h2>
          <input type="text" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required />
          {error.name && <p style={{ color: 'red' }}>{error.name}</p>}
          <input type="text" name="surname" placeholder="Surname" value={formData.surname} onChange={handleChange} required />
          {error.surname && <p style={{ color: 'red' }}>{error.surname}</p>}
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          {error.email && <p style={{ color: 'red' }}>{error.email}</p>}
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
          {error.password && <p style={{ color: 'red' }}>{error.password}</p>}
          <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
          {error.confirmPassword && <p style={{ color: 'red' }}>{error.confirmPassword}</p>}
          <button type="submit">Register</button>
          <div className="link-text">
            <p>Already have an account? <Link to="/login">Login here</Link>.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;