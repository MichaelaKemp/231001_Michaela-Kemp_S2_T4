import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Home.css';
import logo from '../assets/guardian-angel-logo.png';
import axios from 'axios';
import { toast } from 'react-toastify';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
console.log('API_BASE_URL:', API_BASE_URL);

const Home = () => {
  let userId = localStorage.getItem('userId');

const { userId: paramUserId } = useParams();
if (paramUserId) {
  userId = paramUserId;
  localStorage.setItem('userId', userId); // Update localStorage if the URL contains userId
}

if (!userId) {
  console.error('User ID is missing. Redirecting to login.');
  toast.error('User ID not found. Please log in.');
  window.location.href = '/login';
}

  const [requests, setRequests] = useState([]);
  const [profile, setProfile] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    window.location.href = '/login';
  };  

  // Fetch user profile data
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Token is missing. Redirecting to login.');
        toast.error('You are not logged in. Please log in again.');
        handleLogout();
        return;
      }
  
      const profileRes = await axios.get(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Profile Data:', profileRes.data);
      setProfile(profileRes.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile data. Please try again later.');
    }
  };  

  // Fetch travel requests along with accepted users
  const fetchRequests = async () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId') || 'undefined';
  
    console.log('Fetching requests for userId:', userId);
    console.log('Using token:', token);
  
    if (!userId || userId === 'undefined') {
      console.warn('User ID is missing. Unable to fetch requests.');
      return;
    }
  
    if (!token) {
      console.warn('Token is missing. Redirecting to login.');
      toast.error('You are not logged in. Please log in again.');
      return;
    }
  
    try {
      const requestsRes = await axios.get(`${API_BASE_URL}/user/${userId}/all-open-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log('Requests Data:', requestsRes.data);
  
      if (!Array.isArray(requestsRes.data)) {
        console.warn('Received unexpected data format:', requestsRes.data);
        setRequests([]);
        return;
      }
  
      const updatedRequests = requestsRes.data.map((request) => {
        const currentTime = new Date();
        const meetingTime = new Date(request.meeting_time);
  
        if (meetingTime < currentTime && request.request_status !== 'closed') {
          request.request_status = 'closed';
        }
  
        if (request.request_status === 'closed' && request.acceptedUsers) {
          request.acceptedUsers = request.acceptedUsers.filter(
            (user) => user.creator_status !== 'declined'
          );
        }
  
        return request;
      });
  
      setRequests(updatedRequests);
    } catch (error) {
      console.error('Error fetching travel requests:', error);
      if (error.response && error.response.status === 401) {
        toast.error('Session expired. Please log in again.');
        handleLogout();
      } else {
        toast.error('Failed to fetch travel requests.');
      }
    }
  };

  // Fetch travel requests
  useEffect(() => {
    if (userId) {
      fetchRequests();
      fetchProfile();
    } else {
      console.warn('User ID is missing. Redirecting to login.');
      toast.error('User ID not found. Please log in.');
    }
  }, [userId]); 
  
  // Handle user response (Accept/Decline)
  const handleUserResponse = async (requestId, action) => {
    try {
      await axios.post(`${API_BASE_URL}/requests/${requestId}/respond`, 
        { userId, action }, 
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
  
      toast.success(`User ${action === 'accept' ? 'accepted' : 'declined'} successfully!`);
  
      // Remove the request from the state after accepting/declining
      setRequests((prevRequests) =>
        prevRequests.filter((request) => request.request_id !== requestId)
      );
    } catch (error) {
      console.error(`Error ${action === 'accept' ? 'accepting' : 'declining'} user:`, error);
      toast.error(`Failed to ${action === 'accept' ? 'accept' : 'decline'} user. Please try again.`);
    }
  };  

  return (
    <div>
      <header className="home-header gradient-bg text-white py-16">
        <div className="container text-center">
          <img src={logo} alt="Guardian Angel Logo" className="logo-img" />
          <h1>Welcome to Guardian Angel</h1>
          <h2>Find Trip Partners in South Africa</h2>
          <a className="get-started-btn" href="/create-request">Get Started</a>
        </div>
      </header>

      <main className="main-content container">
        {/* How Guardian Angel Works Section */}
        <section className="section how-it-works">
          <h2>How Guardian Angel Works</h2>
          <div className="card-grid">
            <div className="card">
              <i className="fas fa-user-plus icon"></i>
              <h3>Create Your Profile</h3>
              <p>Sign up and tell us about yourself and your travel preferences.</p>
            </div>
            <div className="card">
              <i className="fas fa-search icon"></i>
              <h3>Find Trip Partners</h3>
              <p>Search for companions based on your destination and travel style.</p>
            </div>
            <div className="card">
              <i className="fas fa-route icon"></i>
              <h3>Plan Your Trip</h3>
              <p>Connect with your new travel buddy and start planning your adventure!</p>
            </div>
          </div>
        </section>

        {/* Your Travel Requests Dashboard Section */}
        <section className="section travel-requests">
          <h2>Your Travel Requests Dashboard</h2>
          <div className="table-container">
            <table className="request-table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Start Location</th>
                  <th>Destination</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
              {requests.length > 0 ? (
                requests.map((request) => (
                  <tr key={request.request_id}>
                    <td>{request.name} {request.surname}</td>
                    <td>{request.start_location}</td>
                    <td>{request.end_location}</td>
                    <td>{new Date(request.meeting_time).toLocaleDateString()}</td>
                    <td>{request.request_type}</td>
                    <td>
                      <button
                        className="accept-btn"
                        onClick={() => handleUserResponse(request.request_id, request.user_id, 'accept')}
                      >
                        Accept
                      </button>
                      <button
                        className="decline-btn"
                        onClick={() => handleUserResponse(request.request_id, request.user_id, 'decline')}
                      >
                        Decline
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No open requests found.</td>
                </tr>
              )}
            </tbody>
            </table>
            <div className="view-more-container">
            <Link to="/profile">
              <button className="view-more-btn">View More</button>
            </Link>
            </div>
          </div>
        </section>

        {/* Your Profile Section */}
        <section className="section profile">
          <h2>Your Profile</h2>
          {profile && profile.name ? (
            <div className="profile-content">
              <div className="profile-info">
                <h3>{profile.name} {profile.surname}</h3>
                <p>Email: {profile.email}</p>
                <p>{profile.bio}</p>
              </div>
            </div>
          ) : (
            <p>Loading profile...</p>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="footer gradient-bg text-white py-8">
        <div className="container text-center">
          <a href="/" className="logo-link">
            <img src={logo} alt="Guardian Angel Logo" className="footer-logo" />
          </a>
          <span className="footer-text">
            &copy; {new Date().getFullYear()}Guardian Angel All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Home;