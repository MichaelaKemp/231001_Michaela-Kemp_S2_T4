import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';  // Import toast

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      // Show success notification
      toast.success('Registration successful! Redirecting to home page...', {
        position: "top-right",
        autoClose: 3000,  // Automatically close after 3 seconds
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Redirect to the home page after 3 seconds
      setTimeout(() => navigate('/home'), 3000);
    } catch (error) {
      console.error('Error registering user:', error);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <h2>Register</h2>
        <input
          type="text"
          name="name"
          placeholder="Name"
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          onChange={handleChange}
          required
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit">Register</button>

        <div className="link-text">
          <p>Already have an account? <Link to="/login">Login here</Link>.</p>
        </div>
      </form>
    </div>
  );
};

export default Register;