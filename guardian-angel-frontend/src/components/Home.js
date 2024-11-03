import React from 'react';
import Navbar from '../components/Navbar';
import './Home.css';

const Home = () => {
  return (
    <div>
      <header className="home-header gradient-bg text-white py-16">
        <div className="container text-center">
          <img src="https://service-jobs-images.s3.us-east-2.amazonaws.com/7rl98t1weu387r43il97h6ipk1l7" alt="TravelBuddies Logo" className="logo-img" />
          <h1>Welcome to Guardian Angel</h1>
          <h2>Find Trip Partners in South Africa</h2>
          <a className="get-started-btn" href="#">Get Started</a>
        </div>
      </header>

      <main className="main-content container">
        {/* How Guardian Angel Works Section */}
        <section className="section how-it-works">
          <h2>How Guardian Angel Works</h2>
          <div className="card-grid">
            <div className="card">
              <i className="fas fa-user-plus icon"></i>
              <h3>Create Your Profile</h3>
              <p>Sign up and tell us about yourself and your travel preferences.</p>
            </div>
            <div className="card">
              <i className="fas fa-search icon"></i>
              <h3>Find Trip Partners</h3>
              <p>Search for companions based on your destination and travel style.</p>
            </div>
            <div className="card">
              <i className="fas fa-route icon"></i>
              <h3>Plan Your Trip</h3>
              <p>Connect with your new travel buddy and start planning your adventure!</p>
            </div>
          </div>
        </section>

        {/* Your Travel Requests Dashboard Section */}
        <section className="section travel-requests">
          <h2>Your Travel Requests Dashboard</h2>
          <div className="table-container">
            <table className="request-table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Start Location</th>
                  <th>Destination</th>
                  <th>Date</th>
                  <th>Message</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Sarah Johnson</td>
                  <td>New York, USA</td>
                  <td>Paris, France</td>
                  <td>Aug 15 - Aug 22, 2023</td>
                  <td>Looking for romantic spots</td>
                  <td>
                    <button className="accept-btn">Accept</button>
                    <button className="decline-btn">Decline</button>
                    <button className="respond-btn">Respond</button>
                  </td>
                </tr>
                <tr>
                  <td>Emily Davis</td>
                  <td>Los Angeles, USA</td>
                  <td>Tokyo, Japan</td>
                  <td>Sep 5 - Sep 15, 2023</td>
                  <td>Interested in local cuisine</td>
                  <td>
                    <button className="accept-btn">Accept</button>
                    <button className="decline-btn">Decline</button>
                    <button className="respond-btn">Respond</button>
                  </td>
                </tr>
                <tr>
                  <td>Lauren Wilson</td>
                  <td>London, UK</td>
                  <td>Barcelona, Spain</td>
                  <td>Oct 10 - Oct 17, 2023</td>
                  <td>Need recommendations for family activities</td>
                  <td>
                    <button className="accept-btn">Accept</button>
                    <button className="decline-btn">Decline</button>
                    <button className="respond-btn">Respond</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="view-more-container">
              <button className="view-more-btn">View More</button>
            </div>
          </div>
        </section>

        {/* Your Profile Section */}
        <section className="section profile">
          <h2>Your Profile</h2>
          <div className="profile-content">
            <img src="https://source.unsplash.com/200x200/?portrait" alt="Profile Picture" className="profile-picture" />
            <div className="profile-info">
              <h3>John Doe</h3>
              <p>Email: johndoe@example.com</p>
              <p>Passionate traveler with a love for adventure and meeting new people. Looking forward to connecting with fellow travel enthusiasts and creating unforgettable memories around the world!</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer gradient-bg text-white py-8">
        <div className="container text-center">
          <span className="footer-text">TravelBuddies - Connecting Women Travelers in South Africa</span>
          <img src="https://service-jobs-images.s3.us-east-2.amazonaws.com/7rl98t1weu387r43il97h6ipk1l7" alt="TravelBuddies Logo" className="footer-logo" />
        </div>
      </footer>
    </div>
  );
};

export default Home;