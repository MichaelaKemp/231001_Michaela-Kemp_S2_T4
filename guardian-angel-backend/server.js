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
    req.user = user; // Ensure user object is correctly set
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
  const { name, surname, bio } = req.body;
  const profileImage = req.file ? req.file.filename : null; // Check if a new image is uploaded

  // Construct the query and values array
  let query = `UPDATE users SET name = ?, surname = ?, bio = ?`;
  const values = [name, surname, bio];

  if (profileImage) {
    query += `, profile_image = ?`; // Append profile_image to the query if there’s a new image
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

// Fetch user requests and mark expired ones as closed (protected route)
app.get('/user/requests', authenticateToken, (req, res) => {
  const userId = req.user.id;

  // First, update any expired requests to 'closed'
  const updateExpiredRequestsQuery = `
    UPDATE requests
    SET request_status = 'closed'
    WHERE user_id = ? AND request_status = 'open' AND meeting_time < NOW()
  `;

  db.query(updateExpiredRequestsQuery, [userId], (err) => {
    if (err) {
      return res.status(500).send({ error: 'Error updating expired requests' });
    }

    // Now, retrieve the updated requests
    const fetchRequestsQuery = `
      SELECT id, start_location, end_location, request_status, created_at, meeting_time, request_type
      FROM requests
      WHERE user_id = ?
      ORDER BY created_at DESC
    `;

    db.query(fetchRequestsQuery, [userId], (err, results) => {
      if (err) {
        return res.status(500).send({ error: err.message });
      } else {
        res.status(200).json(results);
      }
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

// Update a user request (protected route)
app.post('/user/request/update', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { id, start_location, end_location, meeting_time, request_type } = req.body;

  const query = `
    UPDATE requests
    SET start_location = ?, end_location = ?, meeting_time = ?, request_type = ?,
        request_status = CASE WHEN request_status = 'canceled' THEN 'open' ELSE request_status END
    WHERE id = ? AND user_id = ?
  `;

  db.query(query, [start_location, end_location, meeting_time, request_type, id, userId], (err, result) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else if (result.affectedRows === 0) {
      res.status(404).send({ error: 'Request not found or not authorized' });
    } else {
      res.status(200).send({ message: 'Request updated successfully and reopened if previously canceled.' });
    }
  });
});

// Delete a user request (protected route)
app.delete('/user/request/:id', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const requestId = req.params.id;

  // First, delete all related comments and likes
  const deleteCommentsQuery = `DELETE FROM comments WHERE request_id = ?`;
  const deleteLikesQuery = `DELETE FROM likes WHERE request_id = ?`;

  db.query(deleteCommentsQuery, [requestId], (err) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to delete related comments' });
    }

    db.query(deleteLikesQuery, [requestId], (err) => {
      if (err) {
        return res.status(500).send({ error: 'Failed to delete related likes' });
      }

      // Now delete the request
      const deleteRequestQuery = `DELETE FROM requests WHERE id = ? AND user_id = ?`;
      db.query(deleteRequestQuery, [requestId, userId], (err, result) => {
        if (err) {
          return res.status(500).send({ error: 'Failed to delete request' });
        } else if (result.affectedRows === 0) {
          return res.status(404).send({ error: 'Request not found or not authorized' });
        } else {
          res.status(200).send({ message: 'Request deleted successfully' });
        }
      });
    });
  });
});

// Cancel a request
app.post('/user/request/cancel', authenticateToken, (req, res) => {
  const { requestId } = req.body;
  const userId = req.user.id;

  const query = `UPDATE requests SET request_status = 'canceled' WHERE id = ? AND user_id = ?`;
  db.query(query, [requestId, userId], (err, result) => {
    if (err) {
      return res.status(500).send({ error: 'Failed to cancel request' });
    } else if (result.affectedRows === 0) {
      return res.status(404).send({ error: 'Request not found or not authorized' });
    } else {
      res.status(200).send({ message: 'Request canceled successfully' });
    }
  });
});

// Like a request
app.post('/requests/:id/like', authenticateToken, (req, res) => {
  const requestId = req.params.id;
  const userId = req.user.id;

  const query = `INSERT INTO likes (request_id, user_id) VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE request_id = request_id;`;

  db.query(query, [requestId, userId], (err, result) => {
    if (err) {
      res.status(500).send({ error: 'Failed to like the request' });
    } else {
      res.status(200).send({ message: 'Request liked successfully!' });
    }
  });
});

// Comment on a request
app.post('/requests/:id/comment', authenticateToken, (req, res) => {
  const requestId = req.params.id;
  const { comment } = req.body;
  const userId = req.user.id;

  const insertCommentQuery = 'INSERT INTO comments (request_id, user_id, comment) VALUES (?, ?, ?)';
  db.query(insertCommentQuery, [requestId, userId, comment], (err, result) => {
    if (err) {
      res.status(500).send({ error: 'Failed to post comment' });
    } else {
      const selectCommentQuery = `
        SELECT c.comment, u.name, u.surname, c.user_id
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `;
      db.query(selectCommentQuery, [result.insertId], (err, commentDetails) => {
        if (err) {
          res.status(500).send({ error: 'Failed to retrieve comment details' });
        } else {
          const user = commentDetails[0];
          const surnameInitials = user.surname
            .split(' ')
            .map(part => part[0])
            .join('');

          res.status(200).send({
            comment: user.comment,
            name: user.name,
            surname_initials: surnameInitials,
            user_id: user.user_id
          });
        }
      });
    }
  });
});

// Get all open requests (protected route)
app.get('/requests', authenticateToken, (req, res) => {
  const query = `
    SELECT r.id, r.start_location, r.end_location, r.meeting_time, r.request_type, u.name, u.surname, u.profile_image
    FROM requests r
    JOIN users u ON r.user_id = u.id
    WHERE r.request_status = "open"
  `;
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else {
      res.status(200).json(results);
    }
  });
});

// Create a new travel request (protected route)
app.post('/request', authenticateToken, (req, res) => {
  const { start_location, end_location, meeting_time, request_type } = req.body;
  const user_id = req.user.id;

  if (!start_location || !end_location || !meeting_time || !request_type) {
    return res.status(400).send({ error: 'All fields are required' });
  }

  const query = 'INSERT INTO requests (user_id, start_location, end_location, meeting_time, request_type) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [user_id, start_location, end_location, meeting_time, request_type], (err, result) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else {
      res.status(200).send({ message: 'Request created successfully!' });
    }
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});