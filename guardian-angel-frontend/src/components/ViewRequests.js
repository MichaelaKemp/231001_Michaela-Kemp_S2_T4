import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './ViewRequests.css';

const ViewRequests = () => {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const [newComment, setNewComment] = useState({});
  const [showCommentInput, setShowCommentInput] = useState({}); // Track comment input visibility
  const [showAllComments, setShowAllComments] = useState({}); // Track expanded state for each request

  const urgentThresholdMinutes = 60; // Threshold in minutes to mark requests as urgent

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get('http://localhost:5000/requests', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const updatedRequests = response.data.map(request => ({
          ...request,
          comments: request.comments || [], // Default to an empty array if undefined
          likeCount: request.likeCount || 0,
          urgent: (new Date(request.meeting_time) - new Date()) / (1000 * 60) <= urgentThresholdMinutes,
        }));
        const nonExpiredRequests = updatedRequests.filter(request => new Date(request.meeting_time) > new Date());
        setRequests(nonExpiredRequests);
        setUserId(response.data.user_id);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setError('Failed to load requests. Please try again later.');
      }
    };

    fetchRequests();
  }, []);

  const handleLike = async (requestId) => {
    try {
      await axios.post(`http://localhost:5000/requests/${requestId}/like`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId 
            ? { 
                ...req, 
                liked: !req.liked, 
                likeCount: req.liked ? (req.likeCount || 0) - 1 : (req.likeCount || 0) + 1 
              } 
            : req
        )
      );
    } catch (error) {
      console.error('Error liking the request:', error);
    }
  };

  const handleCommentChange = (requestId, comment) => {
    setNewComment(prevComments => ({ ...prevComments, [requestId]: comment }));
  };

  const handleCommentSubmit = async (requestId) => {
    if (!newComment[requestId]) return;
    try {
      const response = await axios.post(`http://localhost:5000/requests/${requestId}/comment`, { comment: newComment[requestId] }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const { user_id, name, surname_initials, comment } = response.data;
      console.log("New comment added:", { user_id, name, surname_initials, comment });
      setRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId 
            ? { ...req, comments: [...req.comments, { user_id, name, surname_initials, comment }] } 
            : req
        )
      );
      setNewComment(prevComments => ({ ...prevComments, [requestId]: '' }));
      setShowCommentInput(prevState => ({ ...prevState, [requestId]: false }));
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };  

  const toggleCommentInput = (requestId) => {
    setShowCommentInput(prevState => ({ ...prevState, [requestId]: !prevState[requestId] }));
  };

  const toggleComments = (requestId) => {
    setShowAllComments(prevState => ({ ...prevState, [requestId]: !prevState[requestId] }));
  };

  return (
    <div className="view-requests">
      <h2>Open Requests</h2>
      {error && <p className="error-message">{error}</p>}
      <ul className="request-list">
        {requests.length > 0 ? (
          requests
            .sort((a, b) => new Date(a.meeting_time) - new Date(b.meeting_time))
            .map((request) => (
              <li key={request.id} className={`request-item ${request.urgent ? 'urgent' : ''}`}>
                <div className="request-card">
                  <div className="request-user-info">
                    <img 
                      src={`http://localhost:5000/uploads/${request.profile_image}`} 
                      alt={`${request.name} ${request.surname}`} 
                      className="profile-image"
                    />
                    <p>{request.name} {request.surname}</p>
                  </div>
                  <div className="request-details">
                    <p>From: {request.start_location} To: {request.end_location}</p>
                    <p>Time: {new Date(request.meeting_time).toLocaleString()}</p>
                    <p>Type: {request.request_type}</p>
                    {request.urgent && (
                      <p className="urgent-message">Urgent: This request is about to expire!</p>
                    )}
                    <p>Likes: {request.likeCount || 0}</p>
                    <div className="button-group">
                      <button onClick={() => handleLike(request.id)}>
                        {request.liked ? 'Unlike' : 'Like'}
                      </button>
                      <button onClick={() => {
                        if (showCommentInput[request.id]) {
                          handleCommentSubmit(request.id);
                        } else {
                          toggleCommentInput(request.id);
                        }
                      }}>
                        {showCommentInput[request.id] ? 'Post Comment' : 'Comment'}
                      </button>
                    </div>

                    {showCommentInput[request.id] && (
                      <div className="comment-input-section">
                        <input 
                          type="text" 
                          value={newComment[request.id] || ''} 
                          placeholder="Add a comment" 
                          onChange={(e) => handleCommentChange(request.id, e.target.value)}
                        />
                      </div>
                    )}
                    <ul>
                    {request.comments.length > 0 ? (
                      showAllComments[request.id] ? (
                        request.comments.map((comment, index) => (
                          <li key={index}>
                            <strong>{comment.name} {comment.surname_initials || ''}</strong>: {comment.comment}
                          </li>
                        ))
                      ) : (
                        <li>
                          <strong>{request.comments[request.comments.length - 1].name} {request.comments[request.comments.length - 1].surname_initials || ''}</strong>: {request.comments[request.comments.length - 1].comment}
                        </li>
                      )
                    ) : (
                      <li>No comments yet</li>
                    )}
                  </ul>
                    {request.comments.length > 1 && (
                      <button onClick={() => toggleComments(request.id)}>
                        {showAllComments[request.id] ? 'Hide Comments' : 'View All Comments'}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))
        ) : (
          <p>No open requests.</p>
        )}
      </ul>
    </div>
  );
};

export default ViewRequests;