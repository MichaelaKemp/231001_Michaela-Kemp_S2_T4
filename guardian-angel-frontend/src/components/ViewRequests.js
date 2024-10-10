import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ViewRequests = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await axios.get('http://localhost:5000/requests');
        setRequests(response.data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      }
    };

    fetchRequests();
  }, []);

  return (
    <div>
      <h2>Open Requests</h2>
      <ul>
        {requests.length > 0 ? (
          requests.map((request) => (
            <li key={request.id}>
              From {request.start_location} to {request.end_location}
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