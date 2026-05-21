// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import WelcomePage from './components/WelcomePage';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import RiskLevelCalculator from './components/RiskLevelCalculator';
import PmosPrediction from './components/PmosPrediction';
import ChatWidget from './components/ChatWidget';
import DoctorsPage from './components/DoctorsPage'; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* PROTECTED USER ROUTES */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/risk-calculator"
            element={
              <PrivateRoute>
                <RiskLevelCalculator />
              </PrivateRoute>
            }
          />
          <Route
            path="/pmos-prediction"
            element={
              <PrivateRoute>
                <PmosPrediction />
              </PrivateRoute>
            }
          />
           <Route
            path="/doctors"
            element={
              <PrivateRoute>
                <DoctorsPage />
              </PrivateRoute>
            }
          />

          {/* ADMIN ONLY */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ChatWidget />
      </Router>
    </AuthProvider>
  );
}

export default App;
