// components/WelcomePage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './WelcomePage.css';
import logo from '../assets/logo.png';

const WelcomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigateToRiskForm = () => {
    if (user) {
      // User is logged in - navigate to risk calculator
      console.log('User logged in, navigating to Risk Calculator Form');
      navigate('/risk-calculator');
    } else {
      // User not logged in - navigate to login
      console.log('User not logged in, navigating to Login');
      navigate('/login', { state: { from: 'risk-calculator' } });
    }
  };

  const handleNavigateToPmosPrediction = () => {
    if (user) {
      // User is logged in - navigate to PMOS prediction
      console.log('User logged in, navigating to PMOS Prediction');
      navigate('/pmos-prediction');
    } else {
      // User not logged in - navigate to login
      console.log('User not logged in, navigating to Login');
      navigate('/login', { state: { from: 'pmos-prediction' } });
    }
  };

  const handleDoctorRecommendation = () => {
    if (user) {
      navigate('/doctors');
    } else {
      navigate('/login', { state: { from: 'doctors' } });
    }
  };

  const handleTracker = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login', { state: { from: 'dashboard' } });
    }
  };

  return (
    <div className="welcome-page">
      {/* Hero section with PMOS branding */}
      <div className="hero">
        <div className="hero-left">
          <div className="badge">
            <i className="fas fa-heartbeat"></i> PMOS · understand & thrive
          </div>
          <h1>Understand your body,<br /> track with <span className="highlight">PMOS Precision</span> 💗</h1>
          <p>Calculate risk levels, analyze hormonal data, get doctor recommendations, and track your progress — all in one intelligent platform for PMOS management.</p>
          <div className="features-row">
            <div className="feature-item"><i className="fas fa-chart-line"></i><span>Risk Assessment</span></div>
            <div className="feature-item"><i className="fas fa-flask"></i><span>Hormonal Analysis</span></div>
            <div className="feature-item"><i className="fas fa-user-md"></i><span>Doctor Match</span></div>
          </div>
        </div>
        <div className="hero-right">
          <div className="illustration">
            <div className="floating-circle">
              <img src={logo} alt="PMOS chart" className="circle-icon" />
            </div>
            <div className="deco-leaf"><i className="fas fa-waveform"></i></div>
            <div className="deco-heart"><i className="fas fa-heart-pulse"></i></div>
            <i className="fas fa-chart-line" style={{ position: 'absolute', top: '10%', left: '15%', fontSize: '1.2rem', opacity: 0.5, color: '#e91e63' }}></i>
            <i className="fas fa-microscope" style={{ position: 'absolute', bottom: '20%', right: '10%', fontSize: '0.9rem', opacity: 0.4, color: '#e91e63' }}></i>
          </div>
        </div>
      </div>

      {/* First Section: Introduction to PMOS Features */}
      <div className="pmos-features">
        <div className="feature-intro-card">
          <i className="fas fa-calculator"></i>
          <h4>Risk Calculator</h4>
          <p>Fill clinical form to assess your PMOS risk level instantly</p>
        </div>
        <div className="feature-intro-card">
          <i className="fas fa-cloud-upload-alt"></i>
          <h4>Hormonal Data Upload</h4>
          <p>Upload clinical reports as images for AI prediction</p>
        </div>
        <div className="feature-intro-card">
          <i className="fas fa-stethoscope"></i>
          <h4>Doctor Recommendations</h4>
          <p>Get matched with specialists near you</p>
        </div>
        <div className="feature-intro-card">
          <i className="fas fa-chart-line"></i>
          <h4>Symptom Tracker</h4>
          <p>Monitor your progress over time</p>
        </div>
      </div>

      {/* Second Section: Two Action Cards that redirect */}
      <div className="action-cards-section">
        <div className="section-header">
          <h2>Start Your Journey</h2>
          <p>Choose where to begin</p>
        </div>
        <div className="action-cards-grid">
          {/* Risk Level Calculator Card */}
          <div className="action-card" onClick={handleNavigateToRiskForm}>
            <div className="action-icon">
              <i className="fas fa-chart-pie"></i>
            </div>
            <h3>Risk Level Calculator</h3>
            <p>Complete our clinical questionnaire to calculate your personalized PMOS risk level based on symptoms, family history, and lifestyle factors.</p>
            <span className="card-badge">Clinical Assessment →</span>
          </div>

          {/* PMOS Prediction Card */}
          <div className="action-card" onClick={handleNavigateToPmosPrediction}>
            <div className="action-icon">
              <i className="fas fa-flask"></i>
            </div>
            <h3>PMOS Prediction</h3>
            <p>Upload your clinical hormonal data images (blood work, hormone panels) for AI-powered PMOS prediction and analysis.</p>
            <span className="card-badge">Upload & Predict →</span>
          </div>
        </div>
      </div>

      {/* Third Section: Doctor Recommendation & Tracker + extra */}
      <div className="extra-features-section">
        <div className="section-header">
          <h2>Everything You Need</h2>
          <p>Comprehensive tools for PMOS management</p>
        </div>
        <div className="extra-features-grid">
          {/* Doctor Recommendation Card */}
          <div className="extra-feature-card">
            <div className="extra-feature-icon">
              <i className="fas fa-user-md"></i>
            </div>
            <h4>Doctor Recommendations</h4>
            <p>Find top specialists in endocrinology and gynecology based on your profile and location.</p>
            <div className="doctor-list-preview">
              <div className="doctor-preview-item">
                <span className="name">Dr. Sarah Johnson</span>
                <span className="rating">⭐ 4.9</span>
              </div>
              <div className="doctor-preview-item">
                <span className="name">Dr. Michael Chen</span>
                <span className="rating">⭐ 4.8</span>
              </div>
              <div className="doctor-preview-item">
                <span className="name">Dr. Emily Rodriguez</span>
                <span className="rating">⭐ 4.9</span>
              </div>
            </div>
            <button className="btn-action" onClick={handleDoctorRecommendation}>
              Find Doctors Near You →
            </button>
          </div>

          {/* Tracker Card */}
          <div className="extra-feature-card">
            <div className="extra-feature-icon">
              <i className="fas fa-calendar-check"></i>
            </div>
            <h4>Symptom & Health Tracker</h4>
            <p>Log daily symptoms, mood, energy levels, and medications to identify patterns over time.</p>
            <div className="tracker-preview">
              <div className="tracker-emojis">
                <div className="tracker-day"><span className="emoji">😊</span> Mon</div>
                <div className="tracker-day"><span className="emoji">😐</span> Tue</div>
                <div className="tracker-day"><span className="emoji">😞</span> Wed</div>
                <div className="tracker-day"><span className="emoji">🤕</span> Thu</div>
                <div className="tracker-day"><span className="emoji">😊</span> Fri</div>
              </div>
            </div>
            <button className="btn-action" onClick={handleTracker}>
              Start Tracking →
            </button>
          </div>

        </div>
      </div>

      <footer className="welcome-footer">
        <i className="fas fa-heart" style={{ color: '#e91e63', marginRight: '6px' }}></i> PMOS Pulse — Understand. Track. Thrive.
      </footer>
    </div>
  );
};

export default WelcomePage;