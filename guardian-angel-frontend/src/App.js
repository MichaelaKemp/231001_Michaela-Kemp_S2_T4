import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import CreateRequest from './components/CreateRequest';
import ViewRequests from './components/ViewRequests';
import Home from './components/Home';
import Profile from './components/Profile'; // Import the new Profile component
import Navbar from './components/Navbar'; // Import the Navbar component
import { ToastContainer, toast } from 'react-toastify'; // Import Toastify components
import 'react-toastify/dist/ReactToastify.css'; // Import Toastify styles
import './style.css'; // Import your CSS file
import axios from 'axios';

// Axios Interceptors setup
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      toast.error('Session expired. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Private Route component to protect routes
const PrivateRoute = ({ element: Element, ...rest }) => {
  const token = localStorage.getItem('token');
  return token ? <Element {...rest} /> : <Navigate to="/login" />;
};

// Helper component to conditionally render the Navbar
const AppLayout = () => {
  const location = useLocation();
  const showNavbar = location.pathname !== '/login' && location.pathname !== '/register';

  return (
    <>
      {showNavbar && <Navbar />} {/* Show Navbar only if not on login or register pages */}
      <ToastContainer /> {/* Toastify container for displaying popups */}
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} /> {/* Redirect to Home */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<PrivateRoute element={Home} />} />
        <Route path="/create-request" element={<PrivateRoute element={CreateRequest} />} />
        <Route path="/view-requests" element={<PrivateRoute element={ViewRequests} />} />
        <Route path="/profile" element={<PrivateRoute element={Profile} />} /> {/* Add Profile route */}
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <AppLayout />
      </div>
    </Router>
  );
}

export default App;