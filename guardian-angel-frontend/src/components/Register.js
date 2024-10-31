import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    // Clear the individual field error when the user starts typing
    setError({
      ...error,
      [e.target.name]: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation before making the API request
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

      // Save the JWT token in localStorage
      localStorage.setItem('token', response.data.token);

      // Clear any existing error messages
      setError({
        name: '',
        surname: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      // Redirect to the home page
      navigate('/home');
    } catch (err) {
      console.error('Error registering user:', err);

      // Clear the input fields and set error messages
      setFormData({
        name: '',
        surname: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      // Set error messages based on the failed fields
      setError({
        name: formData.name ? '' : 'Name is required.',
        surname: formData.surname ? '' : 'Surname is required.',
        email: formData.email ? '' : 'Email is required.',
        password: formData.password ? '' : 'Password is required.',
        confirmPassword: 'Registration failed. Please try again.'
      });
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <h2>Register</h2>
        <div>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          {error.name && <p style={{ color: 'red', marginTop: '5px' }}>{error.name}</p>}
        </div>
        <div>
          <input
            type="text"
            name="surname"
            placeholder="Surname"
            value={formData.surname}
            onChange={handleChange}
            required
          />
          {error.surname && <p style={{ color: 'red', marginTop: '5px' }}>{error.surname}</p>}
        </div>
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          {error.email && <p style={{ color: 'red', marginTop: '5px' }}>{error.email}</p>}
        </div>
        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          {error.password && <p style={{ color: 'red', marginTop: '5px' }}>{error.password}</p>}
        </div>
        <div>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          {error.confirmPassword && (
            <p style={{ color: 'red', marginTop: '5px' }}>{error.confirmPassword}</p>
          )}
        </div>

        <button type="submit">Register</button>

        <div className="link-text">
          <p>Already have an account? <Link to="/login">Login here</Link>.</p>
        </div>
      </form>
    </div>
  );
};

export default Register;