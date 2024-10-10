import React, { useState } from 'react';
import axios from 'axios';

const CreateRequest = () => {
  const [formData, setFormData] = useState({
    user_id: '',  // Get from login session or state
    start_location: '',
    end_location: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/request', formData);
      alert(response.data.message);
    } catch (error) {
      console.error('Error creating request:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create Request</h2>
      <input
        type="text"
        name="start_location"
        placeholder="Start Location"
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="end_location"
        placeholder="End Location"
        onChange={handleChange}
        required
      />
      <button type="submit">Create Request</button>
    </form>
  );
};

export default CreateRequest;