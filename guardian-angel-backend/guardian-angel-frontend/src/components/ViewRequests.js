import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import './ViewRequests.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ViewRequests = () => {
    const [requests, setRequests] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [distances, setDistances] = useState({});

    // Get the logged-in user ID from localStorage
    const loggedInUserId = parseInt(localStorage.getItem('userId'), 10);

    useEffect(() => {
        if (!loggedInUserId) {
            console.warn("User ID not found in localStorage.");
        }
    }, [loggedInUserId]);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    console.error("Error getting user location:", error);
                    toast.error("Unable to access your location.");
                }
            );
        }
    }, []);

    useEffect(() => {
        const fetchRequests = async () => {
            if (!loggedInUserId) return;

            try {
                const response = await axios.get(`${API_BASE_URL}/api/all-open-requests`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                
                // Filter requests to only include those not created by the logged-in user
                const filteredRequests = response.data.filter(request => request.user_id !== loggedInUserId);
                setRequests(filteredRequests);
            } catch (error) {
                console.error("Failed to load requests", error);
            }
        };

        fetchRequests();
    }, [loggedInUserId]);

    // Periodically remove expired requests
    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentTime = new Date();
            setRequests((prevRequests) => 
                prevRequests.filter((request) => new Date(request.meeting_time) > currentTime)
            );
        }, 60000); // Check every minute

        return () => clearInterval(intervalId);
    }, []);

    // Fetch distances using backend proxy
    useEffect(() => {
        const fetchDistances = async () => {
            if (!userLocation || requests.length === 0) return;

            try {
                const destinations = requests.map(request => request.start_location).join('|');
                const response = await axios.get(`${API_BASE_URL}/api/proxy-distance`, {
                    params: {
                        origins: `${userLocation.lat},${userLocation.lng}`,
                        destinations: destinations,
                    }
                });

                const distanceData = {};
                response.data.rows[0].elements.forEach((element, index) => {
                    distanceData[requests[index].request_id] = element.distance ? element.distance.text : "N/A";
                });
                setDistances(distanceData);
            } catch (error) {
                console.error("Error fetching distances:", error);
                toast.error("Failed to fetch distances. Please check your network and API configuration.");
            }
        };

        fetchDistances();
    }, [userLocation, requests]); // Trigger fetching distances when userLocation or requests change

    // Check if the meeting time is within 30 minutes from now
    const isUrgent = (meetingTime) => {
        const currentTime = new Date();
        const timeDifference = new Date(meetingTime) - currentTime;
        return timeDifference <= 30 * 60 * 1000 && timeDifference > 0;
    };

    // Handle accepting a request
    const handleAcceptRequest = async (requestId) => {
        try {
            await axios.post(`${API_BASE_URL}/api/requests/${requestId}/accept`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            toast.success("Request accepted successfully!");
            setRequests(requests.filter(request => request.request_id !== requestId)); // Remove accepted request
        } catch (error) {
            toast.error("Failed to accept request.");
        }
    };

    if (!loggedInUserId) {
        return <p>Please log in to view requests.</p>; // Render a message if no userId
    }

    return (
        <div className="view-requests">
            <h2 className="requests-title">Open Requests</h2>
            <ul className="request-list">
                {requests.map(request => (
                    <li key={request.request_id} className="request-item">
                        <div className="request-card">
                            <div className="request-user-info">
                                <Link to={`/profile/${request.user_id}`} className="user-name">
                                    <h4>{request.name} {request.surname}</h4>
                                </Link>
                            </div>
                            <p className="location-line"><strong>From:</strong> <br /> {request.start_location}</p>
                            <p className="location-line"><strong>To:</strong> <br /> {request.end_location}</p>
                            <p className="request-detail"><strong>Time:</strong> {new Date(request.meeting_time).toLocaleString()}</p>
                            <p className="request-detail"><strong>Type:</strong> {request.request_type}</p>
                            <p className="request-detail">
                                <strong>Distance from you:</strong> 
                                {distances[request.request_id] ? (
                                    ` ${distances[request.request_id]}`
                                ) : (
                                    ' Calculating...'
                                )}
                            </p>
                            {isUrgent(request.meeting_time) && (
                                <p className="urgent-message">Urgent: Meeting time is within 30 minutes!</p>
                            )}
                            <button onClick={() => handleAcceptRequest(request.request_id)}>Accept</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ViewRequests;