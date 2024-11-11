import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, TimeScale, TimeSeriesScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import './ProfilePage.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, TimeScale, TimeSeriesScale);

const ProfilePage = () => {
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const loggedInUserId = localStorage.getItem('userId');
  const userId = paramUserId || loggedInUserId;

  useEffect(() => {
    if (!userId) {
      console.error('User ID is missing. Redirecting to login.');
      navigate('/login');
    }
  }, [userId, navigate]);

  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState({
    completedTrips: 0,
    distanceByDate: [],
    cancellationRate: 0,
    preferredRequestTypes: [],
    tripCount: 0,
    tripsAccepted: 0,
  });
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLimit, setCommentsLimit] = useState(5);
  const [activeTab, setActiveTab] = useState("Profile");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileResponse = await axios.get(`${API_BASE_URL}/api/user/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProfile(profileResponse.data);
      } catch (error) {
        navigate('/error');
      }
    };

    const fetchLikes = async () => {
      try {
        const likesResponse = await axios.get(`${API_BASE_URL}/api/user/${userId}/like`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setLikesCount(likesResponse.data.likesCount);  // Update with current likes count
        setHasLiked(likesResponse.data.hasLiked);      // Update with current like status
      } catch (error) {
        console.error('Failed to fetch likes:', error);
      }
    };  

    const fetchComments = async () => {
      try {
        const commentsResponse = await axios.get(`${API_BASE_URL}/api/user/${userId}/comments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params: { limit: commentsLimit }
        });
        setComments(commentsResponse.data);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const analyticsResponse = await axios.get(`${API_BASE_URL}/api/analytics/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        console.log("Analytics Data:", analyticsResponse.data);  // Log to check data structure
        setAnalytics(analyticsResponse.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    fetchProfile();
    fetchLikes();
    fetchComments();
    fetchAnalytics();
  }, [userId, commentsLimit, navigate]);

  const handleLike = async () => {
    try {
      if (hasLiked) {
        // Unlike the profile
        await axios.delete(`${API_BASE_URL}/api/user/${userId}/like`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setLikesCount((prevCount) => prevCount - 1); // Decrement the likes count
        setHasLiked(false);                         // Set hasLiked to false
      } else {
        // Like the profile
        await axios.post(`${API_BASE_URL}/api/user/${userId}/like`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setLikesCount((prevCount) => prevCount + 1); // Increment the likes count
        setHasLiked(true);                           // Set hasLiked to true
      }
    } catch (error) {
      console.error('Error updating like status:', error);
    }
  };

  const handleComment = async () => {
    if (newComment.trim() === "") return;
    try {
      await axios.post(`${API_BASE_URL}/api/user/${userId}/comment`, { comment: newComment }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setComments([{ comment: newComment, created_at: new Date().toISOString(), commented_by_name: 'You' }, ...comments]);
      setNewComment("");
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleViewMoreComments = () => {
    setCommentsLimit(commentsLimit + 5);
  };

  const handleTabChange = (tab) => setActiveTab(tab);

  if (!profile) return <p>Loading profile...</p>;

  return (
    <div className="profile-page-container">
      <button onClick={() => navigate(-1)} className="profile-page-back-btn">Back</button>

      <div className="tab-navigation">
        <button className={activeTab === "Profile" ? "active" : ""} onClick={() => handleTabChange("Profile")}>Profile</button>
        <button className={activeTab === "Analytics" ? "active" : ""} onClick={() => handleTabChange("Analytics")}>Analytics</button>
      </div>

      {activeTab === "Profile" && (
        <div className="profile-section">
          <h2>{profile.name || 'Unknown'} {profile.surname || ''}</h2>
          <p><strong>Email:</strong> {profile.email || 'Not provided'}</p>
          <p><strong>Bio:</strong> {profile.bio || 'No bio available'}</p>

          <div className="like-section">
            <p className="likes-count">Likes: {likesCount}</p>
            <button onClick={handleLike}>{hasLiked ? 'Unlike' : 'Like'}</button>
          </div>


          <div className="comments-section">
            <h3>Comments</h3>
            <div className="comment-input">
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." />
              <button onClick={handleComment}>Comment</button>
            </div>
            <ul className="comments-list">
              {comments.map((comment, index) => (
                <li key={index}>
                  <strong>{comment.commented_by_name}:</strong> {comment.comment}
                </li>
              ))}
            </ul>
            {comments.length >= commentsLimit && (
              <button onClick={handleViewMoreComments} className="view-more-btn">View More Comments</button>
            )}
          </div>
        </div>
      )}

      {activeTab === "Analytics" && (
        <div className="analytics-section-container">
          <h3 className="analytics-title">Travel Analytics</h3>
          <div className="analytics-section">
            <div className="chart-container">
              <h4>Trips Taken</h4>
              <Line data={{
                labels: ['Trips Created and Completed', 'Trips Accepted'],
                datasets: [{ 
                  label: 'Trips Taken', 
                  data: [analytics.completedTrips || 0, analytics.tripsAccepted || 0],
                  borderColor: 'rgba(75, 192, 192, 1)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  fill: true 
                }]
              }} options={{ responsive: true }} />
            </div>
            <div className="chart-container">
              <h4>Kilometers Traveled</h4>
              <Bar data={{
                labels: analytics.distanceByDate.map(item => item.travelDate) || [],
                datasets: [{ 
                  label: 'Kilometers Traveled', 
                  data: analytics.distanceByDate.map(item => item.totalDistance) || [],
                  backgroundColor: 'rgba(255, 99, 132, 0.6)'
                }]
              }} options={{ responsive: true }} />
            </div>
            <div className="chart-container">
              <h4>Trip Cancellation Rate</h4>
              <Pie data={{
                labels: ['Canceled', 'Completed'],
                datasets: [{ 
                  label: 'Trip Cancellation Rate', 
                  data: [analytics.cancellationRate || 0, 100 - (analytics.cancellationRate || 0)],
                  backgroundColor: ['#FF6384', '#36A2EB']
                }]
              }} options={{ responsive: true }} />
            </div>
            <div className="chart-container">
              <h4>Preferred Request Types</h4>
              <Pie data={{
                labels: analytics.preferredRequestTypes.map(item => item.request_type) || [],
                datasets: [{ 
                  label: 'Preferred Request Types', 
                  data: analytics.preferredRequestTypes.map(item => item.count) || [],
                  backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                }]
              }} options={{ responsive: true }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;