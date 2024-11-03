import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import './ViewRequests.css';

const ViewRequests = () => {
    const [requests, setRequests] = useState([]);

    // Define fetchRequests outside of useEffect so it can be reused
    const fetchRequests = async () => {
        try {
            const response = await axios.get('http://localhost:5000/all-open-requests', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setRequests(response.data);
        } catch (error) {
            console.error("Failed to load requests", error);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAcceptRequest = async (requestId) => {
        try {
            await axios.post(`http://localhost:5000/requests/${requestId}/accept`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            toast.success("Request accepted successfully!");
            fetchRequests(); // Refresh requests after accepting
        } catch (error) {
            toast.error("Failed to accept request.");
        }
    };

    return (
        <div className="view-requests">
            <h2 className="requests-title">Open Requests</h2>
            <ul className="request-list">
                {requests.map(request => (
                    <li key={request.request_id} className="request-item">
                        <div className="request-card">
                            <div className="request-user-info">
                                {request.profile_image && (
                                    <img 
                                        src={`http://localhost:5000/uploads/${request.profile_image}`} 
                                        alt={`${request.name}'s profile`} 
                                        className="profile-image" 
                                    />
                                )}
                                <Link to={`/profile/${request.user_id}`} className="user-name">
                                    <p>{request.name} {request.surname}</p> {/* Display name and surname */}
                                </Link>
                            </div>
                            <p>From: {request.start_location} To: {request.end_location}</p>
                            <p>Time: {new Date(request.meeting_time).toLocaleString()}</p>
                            <p>Type: {request.request_type}</p>
                            <button onClick={() => handleAcceptRequest(request.request_id)}>Accept</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ViewRequests;