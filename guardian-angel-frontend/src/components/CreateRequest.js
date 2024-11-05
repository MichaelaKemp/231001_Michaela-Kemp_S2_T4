import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './CreateRequest.css';

const CreateRequest = () => {
  const [formData, setFormData] = useState({
    start_location: '',
    end_location: '',
    meeting_time: '',
    request_type: '',
  });

  const startLocationRef = useRef(null);
  const endLocationRef = useRef(null);
  const autocompleteStart = useRef(null);
  const autocompleteEnd = useRef(null);

  useEffect(() => {
    console.log("Google API loaded:", window.google);
    if (window.google) {
      // Initialize Google Places Autocomplete for start and end locations
      autocompleteStart.current = new window.google.maps.places.Autocomplete(startLocationRef.current, {
        types: ['establishment'],
        componentRestrictions: { country: 'za' }
      });
      autocompleteEnd.current = new window.google.maps.places.Autocomplete(endLocationRef.current, {
        types: ['establishment'],
        componentRestrictions: { country: 'za' }
      });

      // Log to confirm if autocomplete was initialized
      console.log("Autocomplete start initialized:", autocompleteStart.current);

      // Add event listeners to handle place selection
      autocompleteStart.current.addListener('place_changed', () => handlePlaceSelect('start_location', autocompleteStart.current));
      autocompleteEnd.current.addListener('place_changed', () => handlePlaceSelect('end_location', autocompleteEnd.current));
    }
  }, []);

  // Handle place selection from autocomplete
  const handlePlaceSelect = (field, autocomplete) => {
    const place = autocomplete.getPlace();
    console.log("Selected place:", place); // Log the entire place object
    
    const location = place.formatted_address || place.name;
    console.log(`Location for ${field}:`, location); // Log the location being set
  
    setFormData((prevData) => ({
      ...prevData,
      [field]: location,
    }));
  };  

  // Handle input changes for fields other than location
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form data before submit:", formData); // Log formData for inspection
  
    try {
      const response = await axios.post('http://localhost:5000/request', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      alert(response.data.message);
    } catch (error) {
      console.error('Error creating request:', error);
      alert('There was an error creating the request. Please try again.');
    }
  };  

  return (
    <div className="create-request-container">
      <h2>Create Request</h2>
      <form onSubmit={handleSubmit} className="create-request-form">
        <input
          type="text"
          name="start_location"
          placeholder="Start Location"
          ref={startLocationRef}
          required
          className="form-input"
        />
        <input
          type="text"
          name="end_location"
          placeholder="End Location"
          ref={endLocationRef}
          required
          className="form-input"
        />
        <input
          type="datetime-local"
          name="meeting_time"
          onChange={handleChange}
          required
          className="form-input"
        />
        <select
          name="request_type"
          onChange={handleChange}
          required
          className="form-select"
        >
          <option value="">Select Request Type</option>
          <option value="Walk">Walk</option>
          <option value="Trip">Trip</option>
          <option value="Other">Other</option>
        </select>
        <button type="submit" className="submit-btn">Create Request</button>
      </form>
    </div>
  );
};

export default CreateRequest;