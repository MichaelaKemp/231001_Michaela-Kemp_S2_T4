import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify'; // Make sure to import your notification library

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve error from localStorage if it exists
    const storedError = localStorage.getItem('loginError');
    if (storedError) {
      setError(storedError);
    }

    // Clear the error from localStorage on the first page load
    window.addEventListener('beforeunload', () => {
      localStorage.removeItem('loginError');
    });

    return () => {
      window.removeEventListener('beforeunload', () => {
        localStorage.removeItem('loginError');
      });
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submission
    console.log('Form submitted with:', formData); // Debugging: log form submission

    try {
      const response = await axios.post('http://localhost:5000/login', formData);

      // Save the JWT token and the user's name in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('name', response.data.name);

      // Clear any existing error message
      setError('');
      localStorage.removeItem('loginError');

      // Show a success notification
      toast.success('Login successful! Redirecting...');

      // Delay the navigation to allow the user to see the notification
      setTimeout(() => {
        console.log('Navigating to /home'); // Debugging: log successful login
        navigate('/home');
      }, 5800); 
    } catch (error) {
      // Set the error message and clear the form fields
      console.error('Login error:', error); // Debugging: log the error
      const errorMessage = 'Invalid email or password. Please try again.';
      setError(errorMessage);
      localStorage.setItem('loginError', errorMessage);

      // Clear the form fields
      setFormData({
        email: '',
        password: ''
      });

      // Do not show any pop-up for failed login attempts
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} noValidate>
        <h2>Login</h2>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {/* Display error message if it exists */}
        {error && <p style={{ color: 'red', marginTop: '5px' }}>{error}</p>}

        <button type="submit">Login</button>

        <div className="link-text">
          <p>Don't have an account? <Link to="/register">Register here</Link>.</p>
        </div>
      </form>
    </div>
  );
};

export default Login;