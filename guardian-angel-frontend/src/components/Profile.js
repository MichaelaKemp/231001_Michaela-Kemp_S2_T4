import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Profile.css';

const Profile = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    surname: '',
    email: '',
    bio: '',
    profile_image: '',
  });
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [editRequest, setEditRequest] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    // Fetch user data
    axios.get('http://localhost:5000/user/profile', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    .then(response => {
      const { name, surname, email, bio, profile_image } = response.data;
      setProfileData({ name, surname, email, bio, profile_image });
    })
    .catch(error => {
      console.error('Error fetching profile data:', error);
    });

    // Fetch user requests
    axios.get('http://localhost:5000/user/requests', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    .then(response => {
      setRequests(response.data);
    })
    .catch(error => {
      console.error('Error fetching user requests:', error);
      setError('Failed to load requests. Please try again later.');
    });
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', profileData.name);
    formData.append('surname', profileData.surname);
    formData.append('bio', profileData.bio);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    axios.post('http://localhost:5000/user/profile/update', formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'multipart/form-data',
      },
    })
    .then(response => {
      toast.success('Profile updated successfully!');
      setProfileData((prevData) => ({
        ...prevData,
        profile_image: response.data.profile_image || prevData.profile_image,
      }));
      setImageFile(null);
    })
    .catch(error => {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    });
  };

  const handleCancelRequest = (requestId) => {
    axios.post('http://localhost:5000/user/request/cancel', { requestId }, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    .then(response => {
      toast.success('Request canceled successfully!');
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId ? { ...req, request_status: 'canceled' } : req
        )
      );
    })
    .catch(error => {
      console.error('Error canceling request:', error);
      toast.error('Failed to cancel request. Please try again.');
    });
  };

  const handleDeleteRequest = (requestId) => {
    axios.delete(`http://localhost:5000/user/request/${requestId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    .then(response => {
      toast.success('Request deleted successfully!');
      setRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
    })
    .catch(error => {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request. Please try again.');
    });
  };

  const handleEditRequestChange = (e) => {
    const { name, value } = e.target;
    setEditRequest(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveRequest = () => {
    if (!editRequest) return;

    axios.post('http://localhost:5000/user/request/update', editRequest, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    .then(response => {
      toast.success('Request updated successfully!');
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === editRequest.id ? { ...editRequest, request_status: editRequest.request_status } : req
        )
      );
      setEditRequest(null);
    })
    .catch(error => {
      console.error('Error updating request:', error);
      toast.error('Failed to update request. Please try again.');
    });
  };

  const handleReopenRequest = () => {
    if (!editRequest) return;

    axios.post('http://localhost:5000/user/request/reopen', editRequest, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    .then(response => {
      toast.success('Request reopened successfully!');
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === editRequest.id ? { ...editRequest, request_status: 'open' } : req
        )
      );
      setEditRequest(null);
    })
    .catch(error => {
      console.error('Error reopening request:', error);
      toast.error('Failed to reopen request. Please try again.');
    });
  };

  const startEditingRequest = (request) => {
    const formattedMeetingTime = request.meeting_time
      ? new Date(request.meeting_time).toISOString().slice(0, 16)
      : '';
    setEditRequest({ ...request, meeting_time: formattedMeetingTime });
  };

  const cancelEditing = () => {
    setEditRequest(null);
  };

  return (
    <div className="profile-container">
      <div className="profile-image-container">
        {profileData.profile_image && (
          <img 
            src={`http://localhost:5000/uploads/${profileData.profile_image}`} 
            alt="Profile" 
            className="profile-image"
          />
        )}
      </div>
      <h2>Edit Profile</h2>
      <form onSubmit={handleProfileUpdate}>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={profileData.name}
          onChange={handleInputChange}
          required
        />
        <input
          type="text"
          name="surname"
          placeholder="Surname"
          value={profileData.surname}
          onChange={handleInputChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={profileData.email}
          readOnly
        />
        <textarea
          name="bio"
          placeholder="Bio"
          value={profileData.bio}
          onChange={handleInputChange}
        />
        <input type="file" accept="image/*" onChange={handleImageChange} />
        <button type="submit">Update Profile</button>
      </form>

      <h3>Current and Past Requests</h3>
      {error && <p className="error-message">{error}</p>}
      <ul className="request-list">
        {requests.length > 0 ? (
          requests.map(request => (
            <li key={request.id} className={`request-item ${request.request_status}`}>
              <div className="request-card">
                <p><strong>Start Location:</strong> {request.start_location}</p>
                <p><strong>End Location:</strong> {request.end_location}</p>
                <p><strong>Meeting Time:</strong> {new Date(request.meeting_time).toLocaleString()}</p>
                <p><strong>Request Type:</strong> {request.request_type}</p>
                <p><strong>Status:</strong> {request.request_status}</p>
                {['open', 'canceled'].includes(request.request_status) && (
                  <>
                    <button onClick={() => startEditingRequest(request)}>Edit</button>
                    {request.request_status === 'open' && (
                      <button onClick={() => handleCancelRequest(request.id)}>Cancel</button>
                    )}
                  </>
                )}
                {request.request_status === 'closed' && (
                  <>
                    <button onClick={() => startEditingRequest(request)}>Edit & Reopen</button>
                    <button onClick={() => handleDeleteRequest(request.id)}>Delete</button>
                  </>
                )}
              </div>
            </li>
          ))
        ) : (
          <p>No requests found.</p>
        )}
      </ul>

      {editRequest && (
        <div className="edit-request-form">
          <h3>Edit Request</h3>
          <form>
            <input type="text" name="start_location" placeholder="Start Location" value={editRequest.start_location} onChange={handleEditRequestChange} required />
            <input type="text" name="end_location" placeholder="End Location" value={editRequest.end_location} onChange={handleEditRequestChange} required />
            <input type="datetime-local" name="meeting_time" value={editRequest.meeting_time || ''} onChange={handleEditRequestChange} required />
            <select name="request_type" value={editRequest.request_type} onChange={handleEditRequestChange} required>
              <option value="">Select Request Type</option>
              <option value="Walk">Walk</option>
              <option value="Trip">Trip</option>
              <option value="Other">Other</option>
            </select>
            {editRequest.request_status === 'closed' ? (
              <button type="button" onClick={handleReopenRequest}>Reopen Request</button>
            ) : (
              <button type="button" onClick={handleSaveRequest}>Save Changes</button>
            )}
            <button type="button" onClick={cancelEditing}>Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Profile;