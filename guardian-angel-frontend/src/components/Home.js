import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="hero-section" style={{ backgroundImage: 'url(/path/to/hero-image.jpg)' }}>
        <h1>Welcome to Guardian Angel</h1>
        <p>Your Companion for Safe Journeys</p>
        <button className="cta-button">Get Started</button>
      </div>

      <section className="features">
        <h2>Our Features</h2>
        <div className="feature">
          <img src="/icons/request-icon.png" alt="Request a Companion" />
          <h3>Request a Companion</h3>
          <p>Find someone nearby to join you for a safer journey.</p>
        </div>
        <div className="feature">
          <img src="/icons/location-icon.png" alt="Real-Time Location" />
          <h3>Real-Time Location</h3>
          <p>Share your journey with trusted friends in real-time.</p>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps">
          <div className="step">
            <span>1</span>
            <p>Create a Request</p>
          </div>
          <div className="arrow">→</div>
          <div className="step">
            <span>2</span>
            <p>Find Companions Nearby</p>
          </div>
          <div className="arrow">→</div>
          <div className="step">
            <span>3</span>
            <p>Travel Safely Together</p>
          </div>
        </div>
      </section>

      <footer>
        <p>&copy; 2024 Guardian Angel. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;