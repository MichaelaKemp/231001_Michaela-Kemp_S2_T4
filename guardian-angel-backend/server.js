const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

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

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

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
        res.status(200).send({ message: 'Login successful!', token });
      } else {
        res.status(401).send({ error: 'Invalid password!' });
      }
    }
  });
});

// Get user profile (protected route)
app.get('/user/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;

  const query = 'SELECT id, name, surname, email, bio, profile_image FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else if (results.length === 0) {
      res.status(404).send({ error: 'User not found' });
    } else {
      res.status(200).json(results[0]);
    }
  });
});

// Update user profile (protected route)
app.post('/user/profile/update', authenticateToken, upload.single('image'), (req, res) => {
  const userId = req.user.id;
  const { name, surname, email, bio } = req.body;
  const profileImage = req.file ? req.file.filename : null;

  let query = `UPDATE users SET name = ?, surname = ?, email = ?, bio = ?`;
  const values = [name, surname, email, bio];

  if (profileImage) {
    query += `, profile_image = ?`;
    values.push(profileImage);
  }

  query += ` WHERE id = ?`;
  values.push(userId);

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating profile:', err);
      return res.status(500).send({ error: 'Failed to update profile' });
    }

    res.status(200).send({
      message: 'Profile updated successfully',
      profile_image: profileImage,
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
           r.meeting_time, r.request_type, u.id AS user_id, u.name, u.surname, u.profile_image
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
        SELECT u.id, u.name, u.surname, u.profile_image
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

// Accept a request
app.post('/requests/:id/accept', authenticateToken, (req, res) => {
  const requestId = req.params.id;
  const userId = req.user.id;

  const query = `
      INSERT INTO accepted_requests (request_id, user_id, status)
      VALUES (?, ?, 'accepted')
      ON DUPLICATE KEY UPDATE status = 'accepted';
  `;

  db.query(query, [requestId, userId], (err, result) => {
      if (err) {
          console.error('Error accepting the request:', err);
          return res.status(500).json({ error: 'Failed to accept the request.' });
      }
      res.status(200).json({ message: 'Request accepted successfully!' });
  });
});

// Decline a user for a request
app.post('/requests/:id/decline', authenticateToken, (req, res) => {
  const requestId = req.params.id;
  const userId = req.body.userId;

  const query = `
      DELETE FROM accepted_requests
      WHERE request_id = ? AND user_id = ?;
  `;

  db.query(query, [requestId, userId], (err, result) => {
      if (err) {
          console.error('Error declining the user:', err);
          return res.status(500).json({ error: 'Failed to decline the user.' });
      }
      res.status(200).json({ message: 'User declined successfully!' });
  });
});

// Get user profile by ID (protected route)
app.get('/user/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;

  const query = 'SELECT id, name, surname, email, bio, profile_image FROM users WHERE id = ?';
  db.query(query, [userId], (err, results) => {
    if (err) {
      return res.status(500).send({ error: 'Error fetching user profile' });
    } else if (results.length === 0) {
      return res.status(404).send({ error: 'User not found' });
    } else {
      return res.status(200).json(results[0]);
    }
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});