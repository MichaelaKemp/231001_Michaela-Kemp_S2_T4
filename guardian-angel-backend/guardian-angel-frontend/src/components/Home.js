import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import './Home.css';
import logo from '../assets/guardian-angel-logo.png';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Home = () => {
  const [requests, setRequests] = useState([]);
  const [profile, setProfile] = useState(null);

  // Get userId from localStorage
  const userId = parseInt(localStorage.getItem('userId'), 10);

  // Redirect to login if userId is missing
  if (!userId) {
    console.error('User ID is missing. Redirecting to login.');
    toast.error('User ID not found. Please log in.');
    window.location.href = '/login';
  }

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
        toast.error('You are not logged in. Please log in again.');
        handleLogout();
        return;
      }

      const profileRes = await axios.get(`${API_BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(profileRes.data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile data. Please try again later.');
    }
  };

  // Fetch travel requests along with accepted users
  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!userId || !token) {
        toast.error('User ID or token is missing. Please log in again.');
        handleLogout();
        return;
      }

      const requestsRes = await axios.get(`${API_BASE_URL}/api/all-open-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const otherUsersRequests = requestsRes.data
        .filter((request) => request.user_id !== userId)
        .map((request) => {
          const currentTime = new Date();
          const meetingTime = new Date(request.meeting_time);

          // Close the request if the meeting time has passed
          if (meetingTime < currentTime && request.request_status !== 'closed') {
            request.request_status = 'closed';
          }

          return request;
        });

      setRequests(otherUsersRequests);
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

  // Fetch data on component mount
  useEffect(() => {
    fetchProfile();
    fetchRequests();
  }, []);

  // Handle accept response
  const handleAcceptRequest = async (requestId) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/requests/${requestId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      toast.success('Request accepted successfully!');
      setRequests((prevRequests) =>
        prevRequests.filter((request) => request.request_id !== requestId)
      );
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request. Please try again.');
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

        <section className="section travel-requests">
          <h2>Available Travel Requests</h2>
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
                          onClick={() => handleAcceptRequest(request.request_id)}
                        >
                          Accept
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
          </div>
        </section>

        <section className="section profile">
          <h2>Your Profile</h2>
          {profile ? (
            <div className="profile-content">
              <div className="profile-info">
                <h3>{profile.name} {profile.surname}</h3>
                <p><strong>Email:</strong> {profile.email}</p>
                <p><strong>Bio:</strong> {profile.bio}</p>
              </div>
            </div>
          ) : (
            <p>Loading profile...</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;