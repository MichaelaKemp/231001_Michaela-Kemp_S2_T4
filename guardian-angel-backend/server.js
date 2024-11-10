const express = require('express');
const mysql = require('mysql2'); // Use mysql2 instead of mysql
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: ['https://guardian-angel-za-1344c29eb6b7.herokuapp.com'],
  credentials: true,
}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

const databaseUrl = process.env.DATABASE_URL;

// Create a connection using the connection URL
const db = mysql.createConnection(databaseUrl);

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Connected to MySQL database.');
  }
});

// JWT authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send({ error: 'Access denied. No token provided.' });

  const actualToken = token.split(' ')[1];

  jwt.verify(actualToken, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).send({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
};

// Register User
app.post('/register', (req, res) => {
  const { name, surname, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const query = 'INSERT INTO users (name, surname, email, password) VALUES (?, ?, ?, ?)';
  db.query(query, [name, surname, email, hashedPassword], (err, result) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else {
      res.status(200).send({ message: 'User registered successfully!' });
    }
  });
});

// Login User
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const query = 'SELECT * FROM users WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else if (results.length === 0) {
      res.status(401).send({ error: 'User not found!' });
    } else {
      const user = results[0];
      const passwordMatch = bcrypt.compareSync(password, user.password);

      if (passwordMatch) {
        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        // Send back userId along with the token
        res.status(200).send({ 
          message: 'Login successful!', 
          token,
          userId: user.id  // <-- Add userId here
        });
      } else {
        res.status(401).send({ error: 'Invalid password!' });
      }
    }
  });
});

// Create a new request (protected route)
app.post('/request', authenticateToken, (req, res) => {
  const { start_location, end_location, meeting_time, request_type } = req.body;
  const userId = req.user.id;

  console.log("Request Data:", { start_location, end_location, meeting_time, request_type, userId });

  const query = `
    INSERT INTO requests (user_id, start_location, end_location, meeting_time, request_type, request_status)
    VALUES (?, ?, ?, ?, ?, 'open')
  `;

  db.query(query, [userId, start_location, end_location, meeting_time, request_type], (err, result) => {
    if (err) {
      console.error('Error saving request to database:', err);
      res.status(500).send({ error: 'Failed to create request' });
    } else {
      res.status(200).send({ message: 'Request created successfully!' });
    }
  });
});

// Get user profile (protected route)
app.get('/user/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = 'SELECT id, name, surname, email, bio FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else if (results.length === 0) {
      res.status(404).send({ error: 'User not found' });
    } else {
      const user = results[0];

      res.status(200).json(user);
    }
  });
});

// Update user profile (protected route)
app.post('/user/profile/update', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { name, surname, email, bio } = req.body;
  if (!email) {
    return res.status(400).send({ error: 'Email cannot be empty' });
  }

  // If there's an uploaded file, get its buffer
  let query = `UPDATE users SET name = ?, surname = ?, email = ?, bio = ?`;
  const values = [name, surname, email, bio];

  query += ` WHERE id = ?`;
  values.push(userId);

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating profile:', err);
      return res.status(500).send({ error: 'Failed to update profile' });
    }

    res.status(200).send({
      message: 'Profile updated successfully',
    });
  });
});

app.post('/user/request/update', authenticateToken, (req, res) => {
  const { request_id, start_location, end_location, meeting_time, request_type } = req.body;

  const query = `
    UPDATE requests
    SET start_location = ?, end_location = ?, meeting_time = ?, request_type = ?
    WHERE id = ? AND user_id = ?`;

  db.query(query, [start_location, end_location, meeting_time, request_type, request_id, req.user.id], (err, result) => {
    if (err) {
      console.error('Error updating request:', err);
      res.status(500).send({ error: 'Failed to update request' });
    } else {
      res.status(200).send({ message: 'Request updated successfully' });
    }
  });
});

// Fetch all open requests along with the user's details
app.get('/all-open-requests', authenticateToken, (req, res) => {
  const fetchRequestsQuery = `
    SELECT r.id AS request_id, r.start_location, r.end_location, r.request_status, 
           r.meeting_time, r.request_type, u.id AS user_id, u.name, u.surname
    FROM requests r
    JOIN users u ON r.user_id = u.id
    WHERE r.request_status = 'open'
    ORDER BY r.meeting_time DESC
  `;

  db.query(fetchRequestsQuery, (err, requests) => {
    if (err) {
      return res.status(500).send({ error: 'Error fetching requests' });
    }
    res.status(200).json(requests);
  });
});

// Fetch all requests and accepted users
app.get('/user/requests', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const fetchRequestsQuery = `
    SELECT r.id AS request_id, r.start_location, r.end_location, r.request_status, r.created_at, r.meeting_time, r.request_type
    FROM requests r
    WHERE r.user_id = ?
    ORDER BY r.created_at DESC
  `;

  db.query(fetchRequestsQuery, [userId], (err, requests) => {
    if (err) {
      return res.status(500).send({ error: 'Error fetching requests' });
    }

    const fetchAcceptedUsersPromises = requests.map(request => {
      const acceptedUsersQuery = `
        SELECT u.id, u.name, u.surname
        FROM accepted_requests ar
        JOIN users u ON ar.user_id = u.id
        WHERE ar.request_id = ?
      `;

      return new Promise((resolve, reject) => {
        db.query(acceptedUsersQuery, [request.request_id], (err, acceptedUsers) => {
          if (err) {
            reject(err);
          } else {
            resolve({ ...request, acceptedUsers });
          }
        });
      });
    });

    Promise.all(fetchAcceptedUsersPromises)
      .then(requestsWithAcceptedUsers => {
        res.status(200).json(requestsWithAcceptedUsers);
      })
      .catch(err => {
        res.status(500).send({ error: 'Error fetching accepted users' });
      });
  });
});

// Reopen a closed request (protected route)
app.post('/user/request/reopen', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { id, start_location, end_location, meeting_time, request_type } = req.body;

  const query = `
    UPDATE requests
    SET start_location = ?, end_location = ?, meeting_time = ?, request_type = ?, request_status = 'open'
    WHERE id = ? AND user_id = ? AND request_status = 'closed'
  `;

  db.query(query, [start_location, end_location, meeting_time, request_type, id, userId], (err, result) => {
    if (err) {
      res.status(500).send({ error: 'Failed to reopen request' });
    } else if (result.affectedRows === 0) {
      res.status(404).send({ error: 'Request not found or not authorized' });
    } else {
      res.status(200).send({ message: 'Request reopened successfully' });
    }
  });
});

// Edit a request (protected route)
app.put('/requests/:id', authenticateToken, (req, res) => {
  const requestId = req.params.id;
  const userId = req.user.id;
  const { start_location, end_location, meeting_time, request_type, request_status } = req.body;

  // Determine the correct status based on the meeting time
  const updatedStatus = new Date(meeting_time) > new Date() ? 'open' : request_status;

  const updateRequestQuery = `
    UPDATE requests
    SET start_location = ?, end_location = ?, meeting_time = ?, request_type = ?, request_status = ?
    WHERE id = ? AND user_id = ?
  `;

  db.query(updateRequestQuery, [start_location, end_location, meeting_time, request_type, updatedStatus, requestId, userId], (err, result) => {
    if (err) {
      console.error('Error updating the request:', err);
      return res.status(500).json({ error: 'Failed to update the request.' });
    } else if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Request not found or not authorized.' });
    }

    // If the request status is 'closed', update only pending statuses in accepted_requests to 'declined'
    if (updatedStatus === 'closed') {  // Use updatedStatus here to check if the status is closed
      const updatePendingStatusQuery = `
        UPDATE accepted_requests
        SET creator_status = 'declined'
        WHERE request_id = ? AND creator_status = 'pending'
      `;

      db.query(updatePendingStatusQuery, [requestId], (err, result) => {
        if (err) {
          console.error('Error updating creator_status for pending requests:', err);
          return res.status(500).json({ error: 'Failed to update pending statuses to declined.' });
        }
        console.log(`Updated ${result.affectedRows} rows to 'declined' for request_id: ${requestId}`);
        return res.status(200).json({ message: 'Request closed and all pending users marked as declined!' });
      });      
    } else {
      // If the request is not closed, respond with a successful update message
      return res.status(200).json({ message: 'Request updated successfully!' });
    }
  });
});

// Delete a request (protected route)
app.delete('/requests/:id', authenticateToken, (req, res) => {
  const requestId = req.params.id;
  const userId = req.user.id;

  // First, delete accepted users related to the request
  const deleteAcceptedUsersQuery = `
    DELETE FROM accepted_requests
    WHERE request_id = ?
  `;

  db.query(deleteAcceptedUsersQuery, [requestId], (err) => {
    if (err) {
      console.error('Error deleting accepted users:', err);
      return res.status(500).json({ error: 'Failed to delete accepted users for the request.' });
    }

    // Now delete the request itself
    const deleteRequestQuery = `
      DELETE FROM requests
      WHERE id = ? AND user_id = ?
    `;

    db.query(deleteRequestQuery, [requestId, userId], (err, result) => {
      if (err) {
        console.error('Error deleting the request:', err);
        return res.status(500).json({ error: 'Failed to delete the request.' });
      } else if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Request not found or not authorized.' });
      }
      res.status(200).json({ message: 'Request and its accepted users deleted successfully!' });
    });
  });
});

// Cancel a request (protected route)
app.post('/requests/:id/cancel', authenticateToken, (req, res) => {
  const requestId = req.params.id;
  const userId = req.user.id;

  const query = `
      UPDATE requests
      SET request_status = 'canceled'
      WHERE id = ? AND user_id = ?
  `;

  db.query(query, [requestId, userId], (err, result) => {
    if (err) {
      console.error('Error canceling the request:', err);
      return res.status(500).json({ error: 'Failed to cancel the request.' });
    } else if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Request not found or not authorized.' });
    }
    res.status(200).json({ message: 'Request canceled successfully!' });
  });
});

// Accept a request (protected route)
app.post('/requests/:id/accept', authenticateToken, (req, res) => {
  const requestId = req.params.id;
  const userId = req.user.id;

  // First, check if the request exists and is open
  const checkRequestQuery = `
      SELECT * FROM requests 
      WHERE id = ? AND request_status = 'open'
  `;

  db.query(checkRequestQuery, [requestId], (err, results) => {
      if (err) {
          console.error('Error checking request:', err);
          return res.status(500).json({ error: 'Failed to check request status' });
      }

      if (results.length === 0) {
          return res.status(404).json({ error: 'Request not found or is not open for acceptance' });
      }

      // Update the request to mark it as "accepted" in accepted_requests table
      const acceptRequestQuery = `
          INSERT INTO accepted_requests (request_id, user_id, status, creator_status)
          VALUES (?, ?, 'accepted', 'pending')
          ON DUPLICATE KEY UPDATE status = 'accepted';
      `;

      db.query(acceptRequestQuery, [requestId, userId], (err, result) => {
          if (err) {
              console.error('Error accepting request:', err);
              return res.status(500).json({ error: 'Failed to accept the request' });
          }

          // Update the main request status if needed (optional)
          const updateRequestStatusQuery = `
              UPDATE requests
              SET request_status = 'accepted'
              WHERE id = ?
          `;

          db.query(updateRequestStatusQuery, [requestId], (err, result) => {
              if (err) {
                  console.error('Error updating request status:', err);
                  return res.status(500).json({ error: 'Failed to update request status' });
              }

              res.status(200).json({ message: 'Request accepted successfully!' });
          });
      });
  });
});

app.post('/requests/:id/respond', authenticateToken, (req, res) => {
  const requestId = req.params.id;
  const userId = req.body.userId; // ID of the user being responded to
  const { action } = req.body; // "accept" or "decline"

  let query;
  let message;

  if (action === 'accept') {
    query = `
      UPDATE accepted_requests
      SET status = 'accepted'
      WHERE request_id = ? AND user_id = ?;
    `;
    message = 'User accepted successfully!';
  } else if (action === 'decline') {
    query = `
      DELETE FROM accepted_requests
      WHERE request_id = ? AND user_id = ?;
    `;
    message = 'User declined successfully!';
  } else {
    return res.status(400).json({ error: 'Invalid action provided' });
  }

  db.query(query, [requestId, userId], (err, result) => {
    if (err) {
      console.error('Error updating user response:', err);
      return res.status(500).json({ error: 'Failed to update user response' });
    }
    res.status(200).json({ message });
  });
});

// Get user profile by ID (protected route)
app.get('/user/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;

  const query = 'SELECT id, name, surname, email, bio FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).send({ error: 'Error fetching user profile' });
    } else if (results.length === 0) {
      return res.status(404).send({ error: 'User not found' });
    } else {
      const user = results[0];

      res.status(200).json(user);
    }
  });
});

app.get('/proxy-distance', async (req, res) => {
  const { origins, destinations } = req.query;
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json`, {
      params: {
        origins,
        destinations,
        key: process.env.GOOGLE_MAPS_API_KEY, // Store your key in .env for security
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error("Error in proxy distance request:", error);
    res.status(500).send("Error fetching distance from Google API");
  }
});

// Endpoint to like a user's profile
app.post('/user/:userId/like', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const likedBy = req.user.id;

  const query = `INSERT INTO likes (user_id, liked_by) VALUES (?, ?) ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP`;

  db.query(query, [userId, likedBy], (err) => {
      if (err) {
          console.error("Error adding like:", err);
          return res.status(500).send({ error: 'Failed to add like' });
      }
      res.status(200).send({ message: 'Like added successfully!' });
  });
});

// Endpoint to add a comment to a user's profile
app.post('/user/:userId/comment', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const commentedBy = req.user.id;
  const { comment } = req.body;

  const query = `INSERT INTO comments (user_id, commented_by, comment) VALUES (?, ?, ?)`;

  db.query(query, [userId, commentedBy, comment], (err) => {
      if (err) {
          console.error("Error adding comment:", err);
          return res.status(500).send({ error: 'Failed to add comment' });
      }
      res.status(200).send({ message: 'Comment added successfully!' });
  });
});

// Endpoint to get the like count for a user's profile
app.get('/user/:userId/likes', authenticateToken, (req, res) => {
  const { userId } = req.params;

  const query = `SELECT COUNT(*) AS likesCount FROM likes WHERE user_id = ?`;

  db.query(query, [userId], (err, results) => {
      if (err) {
          console.error("Error fetching likes:", err);
          return res.status(500).send({ error: 'Failed to fetch likes' });
      }
      res.status(200).send(results[0]);
  });
});

// Endpoint to get comments for a user's profile
app.get('/user/:userId/comments', authenticateToken, (req, res) => {
  const { userId } = req.params;

  const query = `
      SELECT c.comment, c.created_at, u.name AS commented_by_name, u.surname AS commented_by_surname 
      FROM comments c
      JOIN users u ON c.commented_by = u.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
  `;

  db.query(query, [userId], (err, results) => {
      if (err) {
          console.error("Error fetching comments:", err);
          return res.status(500).send({ error: 'Failed to fetch comments' });
      }
      res.status(200).send(results);
  });
});

app.get('/analytics/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    // Trip Count: Closed (Completed) Trips
    const completedTripsQuery = `
      SELECT id, start_location, end_location, DATE(created_at) AS travelDate
      FROM requests
      WHERE user_id = ? AND request_status = 'closed';
    `;

    // Trips Accepted by both creator and user
    const tripsAcceptedQuery = `
      SELECT COUNT(*) AS tripsAccepted
      FROM accepted_requests
      WHERE user_id = ? 
        AND status = 'accepted' 
        AND creator_status = 'accepted';
    `;

    // Cancellation Rate
    const totalRequestsQuery = `SELECT COUNT(*) AS totalRequests FROM requests WHERE user_id = ?;`;
    const canceledRequestsQuery = `SELECT COUNT(*) AS canceledRequests FROM requests WHERE user_id = ? AND request_status = 'canceled';`;

    // Peak Hours of Request Creation
    const peakHoursQuery = `
      SELECT HOUR(created_at) AS hour, COUNT(*) AS requestCount
      FROM requests
      WHERE user_id = ?
      GROUP BY HOUR(created_at)
      ORDER BY requestCount DESC
      LIMIT 3;
    `;

    // Preferred Request Types
    const preferredRequestTypesQuery = `
      SELECT request_type, COUNT(*) AS count
      FROM requests
      WHERE user_id = ?
      GROUP BY request_type
      ORDER BY count DESC;
    `;

    // Execute queries for static data
    const [completedTripsResults] = await db.promise().query(completedTripsQuery, [userId]);
    const [tripsAcceptedResults] = await db.promise().query(tripsAcceptedQuery, [userId]);
    const [totalRequestsResults] = await db.promise().query(totalRequestsQuery, [userId]);
    const [canceledRequestsResults] = await db.promise().query(canceledRequestsQuery, [userId]);
    const [peakHoursResults] = await db.promise().query(peakHoursQuery, [userId]);
    const [preferredRequestTypesResults] = await db.promise().query(preferredRequestTypesQuery, [userId]);

    // Process data with defaults if results are missing
    const completedTrips = completedTripsResults.length;
    const tripsAccepted = tripsAcceptedResults[0]?.tripsAccepted || 0;
    const totalRequests = totalRequestsResults[0]?.totalRequests || 0;
    const canceledRequests = canceledRequestsResults[0]?.canceledRequests || 0;
    const cancellationRate = totalRequests > 0 ? (canceledRequests / totalRequests) * 100 : 0;
    const peakHours = peakHoursResults || [];
    const preferredRequestTypes = preferredRequestTypesResults || [];

    // Calculate distances using Google Maps API
    const distanceByDate = {};
    for (const trip of completedTripsResults) {
      const { id, start_location, end_location, travelDate } = trip;

      // Call Google Maps Distance Matrix API
      try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
          params: {
            origins: start_location,
            destinations: end_location,
            key: process.env.GOOGLE_MAPS_API_KEY,
          },
        });

        // Check if the response contains the necessary distance information
        const distanceElement = response.data.rows?.[0]?.elements?.[0];
        if (distanceElement && distanceElement.status === "OK" && distanceElement.distance) {
          const distance = distanceElement.distance.value / 1000; // Convert meters to kilometers

          // Aggregate distance by date
          if (distanceByDate[travelDate]) {
            distanceByDate[travelDate] += distance;
          } else {
            distanceByDate[travelDate] = distance;
          }
        } else {
          console.warn(`Warning: Distance information missing for request ${id}`);
        }
      } catch (error) {
        console.error(`Error fetching distance for request ${id}:`, error);
      }
    }

    // Convert distanceByDate to an array format
    const distanceByDateArray = Object.entries(distanceByDate).map(([date, totalDistance]) => ({
      travelDate: date,
      totalDistance,
    }));

    // Send back the analytics data
    res.status(200).json({
      completedTrips,
      tripsAccepted,
      distanceByDate: distanceByDateArray,
      cancellationRate,
      peakHours,
      preferredRequestTypes,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});