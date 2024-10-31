import React, { useState } from 'react';
import axios from 'axios';

const CreateRequest = () => {
  const [formData, setFormData] = useState({
    start_location: '',
    end_location: '',
    meeting_time: '',
    request_type: '',
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
      const response = await axios.post('http://localhost:5000/request', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
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
      <input
        type="datetime-local"
        name="meeting_time"
        placeholder="Meeting Time"
        onChange={handleChange}
        required
      />
      <select
        name="request_type"
        onChange={handleChange}
        required
      >
        <option value="">Select Request Type</option>
        <option value="Walk">Walk</option>
        <option value="Trip">Trip</option>
        <option value="Other">Other</option>
      </select>
      <button type="submit">Create Request</button>
    </form>
  );
};

export default CreateRequest;