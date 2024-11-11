import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import CreateRequest from './components/CreateRequest';
import ViewRequests from './components/ViewRequests';
import Home from './components/Home';
import ProfilePage from './components/ProfilePage';
import Profile from './components/Profile';
import Navbar from './components/Navbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './style.css';
import axios from 'axios';

// Set Axios Base URL
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || '';

// Axios Interceptors setup
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      toast.error('Session expired. Please log in again.');
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Private Route component to protect routes
const PrivateRoute = () => {
  const token = localStorage.getItem('token');
  return token ? <Outlet /> : <Navigate to="/login" />;
};

// Helper component to conditionally render the Navbar
const AppLayout = () => {
  const location = useLocation();
  const showNavbar = location.pathname !== '/login' && location.pathname !== '/register';

  return (
    <>
      {showNavbar && <Navbar />}
      <ToastContainer />
      <Routes>
        <Route
          path="/"
          element={<Navigate to={localStorage.getItem('userId') ? `/home/${localStorage.getItem('userId')}` : '/login'} />}
        />

        {/* Public routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/home/:userId" element={<Home />} />
          <Route path="/create-request" element={<CreateRequest />} />
          <Route path="/view-requests" element={<ViewRequests />} />
          <Route path="/profile" element={<Profile />} /> 
          <Route path="/profile/:userId" element={<ProfilePage />} />
        </Route>
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