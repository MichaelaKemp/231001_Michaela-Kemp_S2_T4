import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProfilePage.css';

const ProfilePage = () => {
  const { userId } = useParams(); // Get userId from the route parameters
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      console.error("userId is undefined"); // Log if userId is missing
      navigate('/error'); // Redirect if userId is undefined
      return;
    }

    const fetchProfile = async () => {
      console.log("Fetching profile for userId:", userId); // Log the userId
      try {
        const response = await axios.get(`http://localhost:5000/user/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProfile(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        navigate('/error'); // Redirect to error page if there's an error
      }
    };

    fetchProfile();
  }, [userId, navigate]);

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div className="profile-page-container">
      <button onClick={() => navigate(-1)} className="profile-page-back-btn">Back</button>
      <div className="profile-page-profile-container">
        <div className="profile-page-image-container">
          {profile.profile_image ? (
            <img
              src={`http://localhost:5000/uploads/${profile.profile_image}`}
              alt={`${profile.name || 'User'} ${profile.surname || ''}`}
              className="profile-page-image"
            />
          ) : (
            <p>No profile image available</p>
          )}
        </div>
        <h2>{profile.name || 'Unknown'} {profile.surname || ''}</h2>
        <p><strong>Email:</strong> {profile.email || 'Not provided'}</p>
        <p><strong>Bio:</strong> {profile.bio || 'No bio available'}</p>
      </div>
    </div>
  );
};

export default ProfilePage;