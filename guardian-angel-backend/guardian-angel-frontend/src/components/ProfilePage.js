import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, TimeScale, TimeSeriesScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import './ProfilePage.css';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

// Registering necessary components for Chart.js
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, TimeScale, TimeSeriesScale);

const ProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [analytics, setAnalytics] = useState({
    completedTrips: 0,
    distanceByDate: [],
    cancellationRate: 0,
    preferredRequestTypes: []
  });
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLimit, setCommentsLimit] = useState(5);
  const [activeTab, setActiveTab] = useState("Profile");
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      navigate('/error');
      return;
    }

    // Fetch user profile
    const fetchProfile = async () => {
      try {
        const profileResponse = await axios.get(`${API_BASE_URL}/user/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setProfile(profileResponse.data);
      } catch (error) {
        navigate('/error');
      }
    };

    // Fetch likes data
    const fetchLikes = async () => {
      try {
        const likesResponse = await axios.get(`${API_BASE_URL}/user/${userId}/likes`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setLikesCount(likesResponse.data.likesCount);
        setHasLiked(likesResponse.data.hasLiked);
      } catch (error) {
        console.error('Failed to fetch likes:', error);
      }
    };

    // Fetch comments data
    const fetchComments = async () => {
      try {
        const commentsResponse = await axios.get(`${API_BASE_URL}/user/${userId}/comments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params: { limit: commentsLimit }
        });
        setComments(commentsResponse.data);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      }
    };

    // Fetch analytics data
    const fetchAnalytics = async () => {
      try {
        const analyticsResponse = await axios.get(`${API_BASE_URL}/analytics/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setAnalytics(analyticsResponse.data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };

    fetchProfile();
    fetchLikes();
    fetchComments();
    fetchAnalytics();
  }, [userId, navigate, commentsLimit]);

  // Handle liking the profile
  const handleLike = async () => {
    if (hasLiked) {
      alert("You've already liked this profile.");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/user/${userId}/like`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLikesCount(likesCount + 1);
      setHasLiked(true);
    } catch (error) {
      console.error('Error liking profile:', error);
    }
  };

  // Handle adding a comment
  const handleComment = async () => {
    if (newComment.trim() === "") return;
    try {
      await axios.post(`${API_BASE_URL}/user/${userId}/comment`, { comment: newComment }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setComments([{ comment: newComment, created_at: new Date().toISOString(), commented_by_name: 'You' }, ...comments]);
      setNewComment("");
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // View more comments by increasing the limit
  const handleViewMoreComments = () => {
    setCommentsLimit(commentsLimit + 5);
  };

  // Config for "Trips Taken" line chart with fixed y-axis range
  const tripData = {
    labels: ['Trips Created and Completed', 'Trips Accepted'],
    datasets: [
      {
        label: 'Number of Trips',
        data: [analytics.tripCount, analytics.tripsAccepted],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
    ],
  };

  const tripOptions = {
    scales: {
      y: {
        suggestedMin: 0,
        suggestedMax: 10 // Adjust max based on expected data range
      },
      x: {
        type: 'time',
        time: {
          unit: 'day',
          tooltipFormat: 'MMM dd, yyyy'
        }
      }
    },
    plugins: { legend: { display: false } }
  };

  // Config for "Kilometers Traveled" bar chart
  const distanceData = {
    labels: analytics.distanceByDate.map(item => item.travelDate),
    datasets: [
      {
        label: 'Kilometers Traveled',
        data: analytics.distanceByDate.map(item => item.totalDistance),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };

  // Config for cancellation rate
  const cancellationRateData = {
    labels: ['Canceled', 'Completed'],
    datasets: [
      {
        data: [analytics.cancellationRate, 100 - analytics.cancellationRate],
        backgroundColor: ['#FF6384', '#36A2EB'],
      },
    ],
  };

  // Config for preferred request types pie chart
  const requestTypesData = {
    labels: analytics.preferredRequestTypes.map(item => item.request_type),
    datasets: [
      {
        data: analytics.preferredRequestTypes.map(item => item.count),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
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
            <button onClick={handleLike} disabled={hasLiked}>Like</button>
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
                  <strong>{comment.commented_by_name} {comment.commented_by_surname}:</strong> {comment.comment}
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
              <Line data={tripData} options={{ responsive: true }} />
            </div>
            <div className="chart-container">
            <h4>Kilometers Traveled</h4>
            <Bar data={distanceData} options={{ responsive: true }} />
          </div>
            <div className="chart-container" options={{ responsive: true }}>
              <h4>Trip Cancellation Rate</h4>
              <Pie data={cancellationRateData} />
            </div>
            <div className="chart-container" options={{ responsive: true }}>
              <h4>Preferred Request Types</h4>
              <Pie data={requestTypesData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;