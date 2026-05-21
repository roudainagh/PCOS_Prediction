// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { pcosAPI } from '../services/api';
import AssessmentDetailModal from './AssessmentDetailModal';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [symptomsHistory, setSymptomsHistory] = useState([]);
  const [clinicalHistory, setClinicalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Detail drawer state
  const [detailItem, setDetailItem] = useState(null);   // the assessment object
  const [detailType, setDetailType] = useState(null);   // 'symptoms' | 'clinical'

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const [sympRes, clinRes] = await Promise.all([
        pcosAPI.getSymptomsHistory(),
        pcosAPI.getClinicalHistory(),
      ]);
      setSymptomsHistory(sympRes.data || []);
      setClinicalHistory(clinRes.data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (type, item) => {
    setDetailType(type);
    setDetailItem(item);
  };

  const closeDetail = () => {
    setDetailItem(null);
    setDetailType(null);
  };

  const getRiskColor = (label) => {
    if (!label) return '#999';
    if (label.toLowerCase().includes('low')) return '#4caf50';
    if (label.toLowerCase().includes('medium')) return '#ff9800';
    return '#f44336';
  };

  const getRiskBg = (label) => {
    if (!label) return '#f5f5f5';
    if (label.toLowerCase().includes('low')) return '#e8f5e9';
    if (label.toLowerCase().includes('medium')) return '#fff3e0';
    return '#ffebee';
  };

  const latestSymptoms = symptomsHistory[0] || null;
  const latestClinical = clinicalHistory[0] || null;

  if (loading) {
    return (
      <div className="dashboard-loading">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Loading your health data…</p>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-left">
            <div className="welcome-badge">
              <i className="fas fa-heart-pulse"></i> Your Health Hub
            </div>
            <h1>Hello, {user?.username || user?.email} 💗</h1>
            <p>Here's an overview of your PCOS health journey</p>
          </div>
          <div className="header-actions">
            <button className="action-btn primary" onClick={() => navigate('/risk-calculator')}>
              <i className="fas fa-calculator"></i> New Risk Assessment
            </button>
            <button className="action-btn secondary" onClick={() => navigate('/pmos-prediction')}>
              <i className="fas fa-flask"></i> New Clinical Analysis
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon pink">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <div className="summary-info">
              <span className="summary-number">{symptomsHistory.length}</span>
              <span className="summary-label">Symptom Assessments</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon purple">
              <i className="fas fa-flask"></i>
            </div>
            <div className="summary-info">
              <span className="summary-number">{clinicalHistory.length}</span>
              <span className="summary-label">Clinical Analyses</span>
            </div>
          </div>
          {latestSymptoms && (
            <div
              className="summary-card clickable-card"
              onClick={() => openDetail('symptoms', latestSymptoms)}
              title="View latest assessment details"
            >
              <div
                className="summary-icon"
                style={{ backgroundColor: getRiskBg(latestSymptoms.risk_label) }}
              >
                <i
                  className="fas fa-chart-line"
                  style={{ color: getRiskColor(latestSymptoms.risk_label) }}
                ></i>
              </div>
              <div className="summary-info">
                <span
                  className="summary-number"
                  style={{ color: getRiskColor(latestSymptoms.risk_label) }}
                >
                  {latestSymptoms.risk_label}
                </span>
                <span className="summary-label">Latest Risk Level <span className="view-hint">· tap to view</span></span>
              </div>
            </div>
          )}
          {latestClinical && (
            <div
              className="summary-card clickable-card"
              onClick={() => openDetail('clinical', latestClinical)}
              title="View latest clinical analysis"
            >
              <div className="summary-icon teal">
                <i className="fas fa-dna"></i>
              </div>
              <div className="summary-info">
                <span className="summary-number diagnosis-short">
                  {latestClinical.diagnosis || '—'}
                </span>
                <span className="summary-label">Latest Diagnosis <span className="view-hint">· tap to view</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs">
          {['overview', 'symptoms', 'clinical'].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview' && <i className="fas fa-home"></i>}
              {tab === 'symptoms' && <i className="fas fa-clipboard-list"></i>}
              {tab === 'clinical' && <i className="fas fa-flask"></i>}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {symptomsHistory.length === 0 && clinicalHistory.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-heartbeat"></i>
                  <h3>Welcome to your dashboard!</h3>
                  <p>You haven't done any assessments yet. Start your health journey below.</p>
                  <div className="empty-actions">
                    <button className="action-btn primary" onClick={() => navigate('/risk-calculator')}>
                      <i className="fas fa-calculator"></i> Take Risk Assessment
                    </button>
                    <button className="action-btn secondary" onClick={() => navigate('/pmos-prediction')}>
                      <i className="fas fa-flask"></i> Upload Lab Report
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overview-grid">
                  {latestSymptoms && (
                    <div className="overview-card">
                      <div className="card-title">
                        <i className="fas fa-clipboard-list"></i> Latest Risk Assessment
                      </div>
                      <div
                        className="overview-risk-badge"
                        style={{
                          backgroundColor: getRiskBg(latestSymptoms.risk_label),
                          color: getRiskColor(latestSymptoms.risk_label),
                        }}
                      >
                        {latestSymptoms.risk_label}
                      </div>
                      <div className="overview-score">
                        <span className="score-value" style={{ color: getRiskColor(latestSymptoms.risk_label) }}>
                          {Math.round((latestSymptoms.risk_score || 0) * 100)}%
                        </span>
                        <span className="score-label">Risk Score</span>
                      </div>
                      <p className="overview-date">
                        <i className="fas fa-calendar"></i>
                        {new Date(latestSymptoms.created_at).toLocaleDateString()}
                      </p>
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
                        <button
                          className="card-link"
                          onClick={() => openDetail('symptoms', latestSymptoms)}
                        >
                          View details →
                        </button>
                        <button
                          className="card-link"
                          style={{ color: '#aaa' }}
                          onClick={() => setActiveTab('symptoms')}
                        >
                          All assessments
                        </button>
                      </div>
                    </div>
                  )}

                  {latestClinical && (
                    <div className="overview-card">
                      <div className="card-title">
                        <i className="fas fa-flask"></i> Latest Clinical Analysis
                      </div>
                      <div className="overview-risk-badge clinical-badge">
                        {latestClinical.diagnosis || 'Completed'}
                      </div>
                      <p className="overview-date">
                        <i className="fas fa-calendar"></i>
                        {new Date(latestClinical.created_at).toLocaleDateString()}
                      </p>
                      {latestClinical.image_count > 0 && (
                        <p className="image-count">
                          <i className="fas fa-images"></i> {latestClinical.image_count} image{latestClinical.image_count > 1 ? 's' : ''} uploaded
                        </p>
                      )}
                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.8rem' }}>
                        <button
                          className="card-link"
                          onClick={() => openDetail('clinical', latestClinical)}
                        >
                          View details →
                        </button>
                        <button
                          className="card-link"
                          style={{ color: '#aaa' }}
                          onClick={() => setActiveTab('clinical')}
                        >
                          All analyses
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="overview-card cta-card">
                    <div className="card-title">
                      <i className="fas fa-plus-circle"></i> New Assessment
                    </div>
                    <p>Track your progress by running a new assessment</p>
                    <button className="action-btn primary small" onClick={() => navigate('/risk-calculator')}>
                      <i className="fas fa-calculator"></i> Risk Assessment
                    </button>
                    <button className="action-btn secondary small" onClick={() => navigate('/pmos-prediction')} style={{ marginTop: '0.6rem' }}>
                      <i className="fas fa-flask"></i> Clinical Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SYMPTOMS HISTORY TAB */}
          {activeTab === 'symptoms' && (
            <div className="history-tab">
              <div className="tab-header">
                <h3><i className="fas fa-clipboard-list"></i> Symptom Assessment History</h3>
                <button className="action-btn primary small" onClick={() => navigate('/risk-calculator')}>
                  + New Assessment
                </button>
              </div>

              {symptomsHistory.length === 0 ? (
                <div className="empty-state small">
                  <i className="fas fa-clipboard"></i>
                  <p>No symptom assessments yet.</p>
                  <button className="action-btn primary" onClick={() => navigate('/risk-calculator')}>
                    Take Your First Assessment
                  </button>
                </div>
              ) : (
                <div className="history-list">
                  {symptomsHistory.map((item) => (
                    <button
                      key={item.id}
                      className="history-item history-item-btn"
                      onClick={() => openDetail('symptoms', item)}
                    >
                      <div
                        className="history-risk-indicator"
                        style={{ backgroundColor: getRiskColor(item.risk_label) }}
                      ></div>
                      <div className="history-main">
                        <div className="history-top">
                          <span
                            className="history-badge"
                            style={{
                              backgroundColor: getRiskBg(item.risk_label),
                              color: getRiskColor(item.risk_label),
                            }}
                          >
                            {item.risk_label}
                          </span>
                          <span className="history-score">
                            {Math.round((item.risk_score || 0) * 100)}% risk score
                          </span>
                        </div>
                        <div className="history-meta">
                          <span><i className="fas fa-hashtag"></i> ID #{item.id}</span>
                          <span>
                            <i className="fas fa-calendar"></i>
                            {new Date(item.created_at).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="history-chevron">
                        <i className="fas fa-chevron-right"></i>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CLINICAL HISTORY TAB */}
          {activeTab === 'clinical' && (
            <div className="history-tab">
              <div className="tab-header">
                <h3><i className="fas fa-flask"></i> Clinical Analysis History</h3>
                <button className="action-btn primary small" onClick={() => navigate('/pmos-prediction')}>
                  + New Analysis
                </button>
              </div>

              {clinicalHistory.length === 0 ? (
                <div className="empty-state small">
                  <i className="fas fa-flask"></i>
                  <p>No clinical analyses yet.</p>
                  <button className="action-btn primary" onClick={() => navigate('/pmos-prediction')}>
                    Upload Your First Lab Report
                  </button>
                </div>
              ) : (
                <div className="history-list">
                  {clinicalHistory.map((item) => (
                    <button
                      key={item.id}
                      className="history-item history-item-btn"
                      onClick={() => openDetail('clinical', item)}
                    >
                      <div className="history-risk-indicator" style={{ backgroundColor: '#9c27b0' }}></div>
                      <div className="history-main">
                        <div className="history-top">
                          <span className="history-badge clinical-badge">
                            {item.diagnosis || 'Completed'}
                          </span>
                          {item.image_count > 0 && (
                            <span className="history-score">
                              <i className="fas fa-images"></i> {item.image_count} image{item.image_count > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="history-meta">
                          <span><i className="fas fa-hashtag"></i> ID #{item.id}</span>
                          <span>
                            <i className="fas fa-calendar"></i>
                            {new Date(item.created_at).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="history-chevron">
                        <i className="fas fa-chevron-right"></i>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer — rendered outside .dashboard so it can overlay full screen */}
      {detailItem && (
        <AssessmentDetailModal
          type={detailType}
          item={detailItem}
          onClose={closeDetail}
        />
      )}
    </>
  );
};

export default Dashboard;
