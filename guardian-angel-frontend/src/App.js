import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import CreateRequest from './components/CreateRequest';
import ViewRequests from './components/ViewRequests';
import Home from './components/Home';
import { ToastContainer } from 'react-toastify';  // Import ToastContainer
import 'react-toastify/dist/ReactToastify.css';   // Import Toastify styles
import './style.css';  // Import your CSS file

function App() {
  return (
    <Router>
      <div className="App">
        <ToastContainer />  {/* Toastify container for displaying popups */}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-request" element={<CreateRequest />} />
          <Route path="/view-requests" element={<ViewRequests />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;