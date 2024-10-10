const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

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

// Register User
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  const query = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
  db.query(query, [name, email, hashedPassword], (err, result) => {
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
        res.status(200).send({ message: 'Login successful!', user_id: user.id });
      } else {
        res.status(401).send({ error: 'Invalid password!' });
      }
    }
  });
});

// Create a new travel request
app.post('/request', (req, res) => {
  const { user_id, start_location, end_location } = req.body;

  if (!user_id || !start_location || !end_location) {
    return res.status(400).send({ error: 'All fields are required' });
  }

  const query = 'INSERT INTO requests (user_id, start_location, end_location) VALUES (?, ?, ?)';
  db.query(query, [user_id, start_location, end_location], (err, result) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else {
      res.status(200).send({ message: 'Request created successfully!' });
    }
  });
});

// Get all open requests
app.get('/requests', (req, res) => {
  const query = 'SELECT * FROM requests WHERE request_status = "open"';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else {
      res.status(200).json(results);
    }
  });
});

// Update request status
app.put('/request/:id', (req, res) => {
  const { id } = req.params;
  const { request_status } = req.body;

  const query = 'UPDATE requests SET request_status = ? WHERE id = ?';
  db.query(query, [request_status, id], (err, result) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else if (result.affectedRows === 0) {
      res.status(404).send({ error: 'Request not found' });
    } else {
      res.status(200).send({ message: 'Request updated successfully!' });
    }
  });
});

// Delete a request
app.delete('/request/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM requests WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).send({ error: err.message });
    } else if (result.affectedRows === 0) {
      res.status(404).send({ error: 'Request not found' });
    } else {
      res.status(200).send({ message: 'Request deleted successfully!' });
    }
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});