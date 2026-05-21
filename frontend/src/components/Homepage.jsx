import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Homepage.css';

const Homepage = () => {
  const { user } = useAuth();

  return (
    <div className="homepage-container">
      <div className="homepage-placeholder">
        <div className="placeholder-content">
          <i className="fas fa-seedling"></i>
          <h2>Welcome to Your Personal Space, {user?.username || 'Warrior'}! 🌸</h2>
          <p>Your PCOS companion is under construction.</p>
          <p className="coming-soon">Coming soon: symptom tracking, meal plans, community support, and more!</p>
          <div className="construction-animation">
            <i className="fas fa-heart"></i>
            <i className="fas fa-heart"></i>
            <i className="fas fa-heart"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;