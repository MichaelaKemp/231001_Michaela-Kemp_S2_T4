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

  // Fetch requests along with accepted users
  const fetchRequests = async () => {
    try {
      const requestsRes = await axios.get('http://localhost:5000/user/requests', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log("Fetched requests with accepted users:", requestsRes.data);
      setRequests(requestsRes.data);
    } catch (error) {
      console.error('Error fetching user requests:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axios.get('http://localhost:5000/user/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setProfileData(profileRes.data);
        fetchRequests();
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      }
    };
    fetchData();
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

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', profileData.name);
    formData.append('surname', profileData.surname);
    formData.append('bio', profileData.bio);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    try {
      const response = await axios.post('http://localhost:5000/user/profile/update', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Profile updated successfully!');
      setProfileData((prevData) => ({
        ...prevData,
        profile_image: response.data.profile_image || prevData.profile_image,
      }));
      setImageFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const handleAcceptUser = async (requestId, userId) => {
    try {
      await axios.post(`http://localhost:5000/requests/${requestId}/accept`, { userId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('User accepted successfully!');
      fetchRequests();
    } catch (error) {
      console.error('Error accepting user:', error);
      toast.error('Failed to accept user. Please try again.');
    }
  };

  const handleDeclineUser = async (requestId, userId) => {
    try {
      await axios.post(`http://localhost:5000/requests/${requestId}/decline`, { userId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('User declined successfully!');
      fetchRequests();
    } catch (error) {
      console.error('Error declining user:', error);
      toast.error('Failed to decline user. Please try again.');
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await axios.post('http://localhost:5000/user/request/cancel', { requestId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Request canceled successfully!');
      await fetchRequests();
    } catch (error) {
      console.error('Error canceling request:', error);
      toast.error('Failed to cancel request. Please try again.');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      await axios.delete(`http://localhost:5000/user/request/${requestId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Request deleted successfully!');
      await fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request. Please try again.');
    }
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
            <li key={request.request_id} className={`request-item ${request.request_status}`}>
              <div className="request-card">
                <p><strong>Start Location:</strong> {request.start_location}</p>
                <p><strong>End Location:</strong> {request.end_location}</p>
                <p><strong>Meeting Time:</strong> {new Date(request.meeting_time).toLocaleString()}</p>
                <p><strong>Request Type:</strong> {request.request_type}</p>
                <p><strong>Status:</strong> {request.request_status}</p>

                {request.acceptedUsers && request.acceptedUsers.length > 0 && (
                  <div className="accepted-users">
                    <p><strong>Accepted Users:</strong></p>
                    <ul>
                      {request.acceptedUsers.map(user => (
                        <li key={user.id} className="accepted-user">
                          <img
                            src={`http://localhost:5000/uploads/${user.profile_image}`}
                            alt={`${user.name}'s profile`}
                            className="accepted-user-image"
                          />
                          <p>{user.name} {user.surname}</p>
                          <button onClick={() => handleAcceptUser(request.request_id, user.id)}>Accept</button>
                          <button onClick={() => handleDeclineUser(request.request_id, user.id)}>Decline</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {['open', 'canceled'].includes(request.request_status) && (
                <div className="button-group">
                    <button onClick={() => startEditingRequest(request)}>Edit</button>
                    {request.request_status === 'open' && (
                    <button onClick={() => handleCancelRequest(request.request_id)}>Cancel</button>
                    )}
                </div>
                )}
                {request.request_status === 'closed' && (
                <div className="button-group">
                    <button onClick={() => startEditingRequest(request)}>Edit & Reopen</button>
                    <button onClick={() => handleDeleteRequest(request.request_id)}>Delete</button>
                </div>
                )}

              </div>
            </li>
          ))
        ) : (
          <p>No requests found.</p>
        )}
      </ul>
    </div>
  );
};

export default Profile;