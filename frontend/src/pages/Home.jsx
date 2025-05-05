// src/pages/Home.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <div className="home-hero">
        <div className="home-content">
          <span className="home-tag">Student to Student Platform</span>
          <h1>
            Connect, Learn, <br />
            <span>Grow Together</span>
          </h1>
          <p>
            A community platform designed by students, for students. Share knowledge, find study partners,
            and build lasting connections.
          </p>

          {/* Redirect to /features */}
          <button 
            className="home-btn" 
            onClick={() => navigate('/features')}
          >
            Get Started
          </button>

          <div className="home-stats">
            <div className="avatars">👩🏽‍🎓👨🏼‍🎓👩🏾‍🎓👨🏻‍🎓</div>
            <span>Join other students already on the platform</span>
          </div>
        </div>

        <div className="home-video">
          <div className="floating-square top-right"></div>
          <div className="floating-square bottom-left"></div>
          <div className="video-wrapper">
            <iframe
              src="https://www.youtube.com/embed/cAj2rUXma8U?autoplay=1&mute=1"
              title="Student Testimonial"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '280px', borderRadius: '8px' }}
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
