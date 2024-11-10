import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Profile.css';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const Profile = () => {
  const [profileData, setProfileData] = useState({
    name: '',
    surname: '',
    email: '',
    bio: '',
    profile_image: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [editRequest, setEditRequest] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [showLikes, setShowLikes] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likes, setLikes] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);

  const userId = profileData.id; // Ensure userId is fetched or passed correctly

  const startLocationRef = useRef(null);
  const endLocationRef = useRef(null);
  const autocompleteStart = useRef(null);
  const autocompleteEnd = useRef(null);

  // Initialize Google Places Autocomplete
  const initAutocomplete = () => {
    if (window.google && startLocationRef.current && endLocationRef.current) {
      autocompleteStart.current = new window.google.maps.places.Autocomplete(startLocationRef.current, {
        types: ['establishment'],
        componentRestrictions: { country: 'za' },
      });
      autocompleteEnd.current = new window.google.maps.places.Autocomplete(endLocationRef.current, {
        types: ['establishment'],
        componentRestrictions: { country: 'za' },
      });

      autocompleteStart.current.addListener('place_changed', () => handlePlaceSelect('start_location', autocompleteStart.current));
      autocompleteEnd.current.addListener('place_changed', () => handlePlaceSelect('end_location', autocompleteEnd.current));
    }
  };

// Fetch requests along with accepted users
const fetchRequests = async () => {
  try {
    const requestsRes = await axios.get(`${API_BASE_URL}/user/requests`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    const updatedRequests = requestsRes.data.map((request) => {
      const currentTime = new Date();
      const meetingTime = new Date(request.meeting_time);

      // If meeting time has passed, set status to 'closed'
      if (meetingTime < currentTime && request.request_status !== 'closed') {
        request.request_status = 'closed';
        handleUpdateRequest(request);  // Update the status in the backend
      }

      // Filter out users with creator_status 'declined' if the request is closed
      if (request.request_status === 'closed' && request.acceptedUsers) {
        request.acceptedUsers = request.acceptedUsers.filter(user => user.creator_status !== 'declined');
      }
      return request;
    });

    setRequests(updatedRequests);
  } catch (error) {
    console.error('Error fetching user requests:', error);
  }
};

  const fetchLikes = async () => {
    try {
      const likesRes = await axios.get(`${API_BASE_URL}/user/${userId}/likes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setLikesCount(likesRes.data.likesCount);  // Assuming API response has likesCount
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };  
  
  const fetchComments = async () => {
    try {
      const commentsRes = await axios.get(`${API_BASE_URL}/user/${userId}/comments`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setComments(commentsRes.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };  
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await axios.get(`${API_BASE_URL}/user/profile`, {
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

    if (window.google) {
      initAutocomplete();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => initAutocomplete();
      document.head.appendChild(script);
    }
  }, []);

  // Reinitialize Autocomplete when editRequest is set (ensures inputs are rendered)
  useEffect(() => {
    if (editRequest) {
      initAutocomplete();
    }
  }, [editRequest]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleEditRequestChange = (e) => {
    const { name, value } = e.target;
    setEditRequest((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const toggleEdit = () => {
    if (isEditing) {
      handleProfileUpdate();
    }
    setIsEditing((prev) => !prev);
  };

  const handleProfileUpdate = async () => {
    const formData = new FormData();
    formData.append('name', profileData.name);
    formData.append('surname', profileData.surname);
    formData.append('bio', profileData.bio);
    if (imageFile) {
      formData.append('image', imageFile);
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/user/profile/update`, formData, {
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
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const handleUserResponse = async (requestId, userId, action) => {
    try {
      await axios.post(`${API_BASE_URL}/requests/${requestId}/respond`, 
        { userId, action }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      toast.success(`User ${action === 'accept' ? 'accepted' : 'declined'} successfully!`);
  
      if (action === 'decline') {
        setRequests((prevRequests) =>
          prevRequests.map((request) =>
            request.request_id === requestId
              ? { ...request, acceptedUsers: request.acceptedUsers.filter((user) => user.id !== userId) }
              : request
          )
        ); // Remove declined user from acceptedUsers
      } else {
        fetchRequests(); // Refresh the list of requests after accepting
      }
    } catch (error) {
      console.error(`Error ${action === 'accept' ? 'accepting' : 'declining'} user:`, error);
      toast.error(`Failed to ${action === 'accept' ? 'accept' : 'decline'} user. Please try again.`);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await axios.post(`${API_BASE_URL}/requests/${requestId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Request canceled successfully!');
      fetchRequests();
    } catch (error) {
      console.error('Error canceling request:', error);
      toast.error('Failed to cancel request. Please try again.');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      await axios.delete(`${API_BASE_URL}/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Request and accepted users deleted successfully!');
      setRequests(requests.filter((request) => request.request_id !== requestId)); // Remove deleted request from state
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request. Please try again.');
    }
  };

  const handleUpdateRequest = async (updatedRequest) => {
    // Create a minimal request object with only required fields
    const minimalRequestData = {
      start_location: updatedRequest.start_location,
      end_location: updatedRequest.end_location,
      meeting_time: updatedRequest.meeting_time,
      request_type: updatedRequest.request_type,
      request_status: updatedRequest.request_status,
    };
  
    console.log("Minimal Request Payload Size:", JSON.stringify(minimalRequestData).length, "bytes");
  
    try {
      await axios.put(`${API_BASE_URL}/requests/${updatedRequest.request_id}`, minimalRequestData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      toast.success('Request updated successfully!');
      setEditRequest(null);
      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast.error('Failed to update request. Please try again.');
    }
  };  

  const startEditingRequest = (request) => {
    const formattedMeetingTime = request.meeting_time
      ? new Date(request.meeting_time).toISOString().slice(0, 16)
      : '';

    const currentTime = new Date();
    const meetingTime = new Date(request.meeting_time);

    const updatedRequest = { ...request, meeting_time: formattedMeetingTime };
    if (meetingTime > currentTime && request.request_status === 'closed') {
      updatedRequest.request_status = 'open';
    }

    setEditRequest(updatedRequest);
  };

  const cancelEditing = () => {
    setEditRequest(null);
  };

  const handlePlaceSelect = (field, autocomplete) => {
    const place = autocomplete.getPlace();
    if (place && (place.formatted_address || place.name)) {
      const location = place.formatted_address || place.name;
      setEditRequest((prev) => ({
        ...prev,
        [field]: location,
      }));
    } else {
      console.error("No valid location found for place selection");
      toast.error("Please select a valid location from the suggestions.");
    }
  };

  // Toggle the visibility of likes and fetch data if not already fetched
  const toggleLikesSection = () => {
    if (!showLikes) {
      fetchLikes(); // Fetch likes only when opening
    }
    setShowLikes(prev => !prev); // Toggle visibility
  };

  // Toggle the visibility of comments and fetch data if not already fetched
  const toggleCommentsSection = () => {
    if (!showComments) {
      fetchComments(); // Fetch comments only when opening
    }
    setShowComments(prev => !prev); // Toggle visibility
  };

  return (
    <div className="profile-container">
      <div className="profile-image-container">
        {profileData.profile_image && (
          <img 
          src={profileData.profile_image ? `data:image/jpeg;base64,${profileData.profile_image}` : null} 
          alt="Profile" 
          className="profile-image" 
        />        
        )}
      </div>
      <h2>Edit Profile</h2>
      <form onSubmit={(e) => { e.preventDefault(); handleProfileUpdate(); }}>
        <input type="text" name="name" placeholder="Name" value={profileData.name} onChange={handleInputChange} disabled={!isEditing} required />
        <input type="text" name="surname" placeholder="Surname" value={profileData.surname} onChange={handleInputChange} disabled={!isEditing} required />
        <input type="email" name="email" placeholder="Email" value={profileData.email} readOnly />
        <textarea name="bio" placeholder="Bio" value={profileData.bio} onChange={handleInputChange} disabled={!isEditing} />
        {isEditing && <input type="file" accept="image/*" onChange={handleImageChange} />}
        <button type="button" onClick={toggleEdit}>{isEditing ? 'Save Changes' : 'Edit Profile'}</button>
      </form>

      <h3>Likes and Comments</h3>
      <div className="buttons-container">
        <button onClick={toggleLikesSection}>Likes</button>
        <button onClick={toggleCommentsSection}>Comments</button>
      </div>

      {showLikes && (
        <div className="section-card">
          <h4 className="section-subtitle">Total Likes: {likesCount}</h4>
          <ul className="section-list">
            {likes.map((like, index) => (
              <li key={index} className="section-list-item">{like.userName}</li>
            ))}
          </ul>
        </div>
      )}

      {showComments && (
        <div className="section-card">
          <h4 className="section-subtitle">Total Comments: {comments.length}</h4>
          <ul className="section-list">
            {comments.map((comment, index) => (
              <li key={index} className="section-list-item">
                <strong>{comment.commented_by_name}:</strong> {comment.comment}
              </li>
            ))}
          </ul>
        </div>
      )}

      <h3>Current and Past Requests</h3>
      {error && <p className="error-message">{error}</p>}
      <ul className="request-list">
        {requests.length > 0 ? (
          requests.map(request => (
            <li key={request.request_id} className={`request-item ${request.request_status}`}>
              {editRequest && editRequest.request_id === request.request_id ? (
                <div className="edit-request-form">
                  <h3>Edit Request</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleUpdateRequest(editRequest);
                    }}
                  >
                    <input
                      type="text"
                      name="start_location"
                      value={editRequest.start_location || ''}
                      ref={startLocationRef}
                      onChange={handleEditRequestChange}
                      placeholder="Start Location"
                      required
                    />
                    <input
                      type="text"
                      name="end_location"
                      value={editRequest.end_location || ''}
                      ref={endLocationRef}
                      onChange={handleEditRequestChange}
                      placeholder="End Location"
                      required
                    />
                    <input
                      type="datetime-local"
                      name="meeting_time"
                      value={editRequest.meeting_time || ''}
                      onChange={handleEditRequestChange}
                      required
                    />
                    <select
                      name="request_type"
                      value={editRequest.request_type || ''}
                      onChange={handleEditRequestChange}
                      required
                    >
                      <option value="Walk">Walk</option>
                      <option value="Trip">Trip</option>
                      <option value="Other">Other</option>
                    </select>
                    <div className="button-group">
                      <button type="submit">Save</button>
                      <button type="button" onClick={cancelEditing}>Cancel</button>
                    </div>
                  </form>
                </div>
              ) : (
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
                            <Link to={`/profile/${user.id}`} className="user-name">
                              <p>{user.name} {user.surname}</p>
                            </Link>
                            <button onClick={() => handleUserResponse(request.request_id, user.id, 'accept')}>Accept</button>
                            <button onClick={() => handleUserResponse(request.request_id, user.id, 'decline')}>Decline</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {request.request_status === 'open' ? (
                    <div className="button-group">
                      <button onClick={() => startEditingRequest(request)}>Edit</button>
                      <button onClick={() => handleCancelRequest(request.request_id)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="button-group">
                      <button onClick={() => startEditingRequest(request)}>Reopen and Edit</button>
                      <button onClick={() => handleDeleteRequest(request.request_id)}>Delete</button>
                    </div>
                  )}
                </div>
              )}
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