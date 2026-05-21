// components/AdminDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../services/api';
import './AdminDashboard.css';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [newUsers, setNewUsers] = useState([]);
  const [symptomsHistory, setSymptomsHistory] = useState([]);
  const [clinicalHistory, setClinicalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const barRef = useRef(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [allRes, newRes, sympRes, clinRes] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getLastMonthUsers(),
        adminAPI.getAllSymptoms(),
        adminAPI.getAllClinical(),
      ]);
      setUsers(allRes.data);
      setNewUsers(newRes.data);
      setSymptomsHistory(sympRes.data);
      setClinicalHistory(clinRes.data);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Derived stats ---
  const totalTests = symptomsHistory.length + clinicalHistory.length;
  const sympPct = totalTests ? Math.round((symptomsHistory.length / totalTests) * 100) : 0;
  const clinPct = 100 - sympPct;

  // Sign-ups grouped by month (last 6 months)
  const signupsByMonth = (() => {
    const counts = {};
    users.forEach(u => {
      if (!u.created_at) return;
      const d = new Date(u.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      counts[key] = (counts[key] || 0) + 1;
    });
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      return { label: MONTHS[d.getMonth()], count: counts[key] || 0 };
    });
  })();

  const maxBar = Math.max(...signupsByMonth.map(m => m.count), 1);

  // Users by location
  const locationCounts = users.reduce((acc, u) => {
    const loc = u.location || 'Unknown';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});
  const sortedLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxLoc = sortedLocations[0]?.[1] || 1;

  // Filtered users table
  const filteredUsers = (() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (activeTab === 'admins') return users.filter(u => u.is_admin);
    if (activeTab === 'new') return users.filter(u => new Date(u.created_at) >= thirtyDaysAgo);
    return users;
  })();

  if (loading) {
    return (
      <div className="admin-loading">
        <i className="fas fa-spinner fa-spin"></i> Loading dashboard...
      </div>
    );
  }

  // Donut ring math (circumference = 2π×48 ≈ 301)
  const C = 301;
  const sympDash = Math.round((sympPct / 100) * C);
  const clinDash = C - sympDash;

  return (
    <div className="admin-dashboard">

      {/* Header */}
      <div className="admin-header">
        <h1><i className="fas fa-shield-alt"></i> Admin Dashboard</h1>
        <p>Platform overview — all metrics at a glance</p>
      </div>

      {/* Stat cards */}
      <div className="admin-stats">
        {[
          { icon: 'fa-users', label: 'Total users', value: users.length, change: `${newUsers.length} new this month` },
          { icon: 'fa-user-plus', label: 'New (30 days)', value: newUsers.length, change: null },
          { icon: 'fa-stethoscope', label: 'Symptom tests', value: symptomsHistory.length, change: `${sympPct}% of all tests` },
          { icon: 'fa-file-medical', label: 'Clinical tests', value: clinicalHistory.length, change: `${clinPct}% of all tests` },
        ].map((s, i) => (
          <div className="admin-stat-card" key={i}>
            <div className="stat-icon"><i className={`fas ${s.icon}`}></i></div>
            <div className="stat-details">
              <h3>{s.label}</h3>
              <p className="stat-value">{s.value.toLocaleString()}</p>
              {s.change && <span className="stat-change">{s.change}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="charts-row">

        {/* Bar chart — sign-ups per month */}
        <div className="chart-card" ref={barRef}>
          <h3><i className="fas fa-chart-bar"></i> Sign-ups per month</h3>
          <div className="bar-chart">
            {signupsByMonth.map((m, i) => (
              <div className="bar-wrap" key={i}>
                <span className="bar-val">{m.count}</span>
                <div
                  className="bar"
                  style={{ height: `${Math.round((m.count / maxBar) * 120)}px` }}
                  title={`${m.label}: ${m.count} users`}
                />
                <span className="bar-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Donut — tests breakdown */}
        <div className="chart-card">
          <h3><i className="fas fa-chart-pie"></i> Tests breakdown</h3>
          <div className="donut-wrap">
            <svg viewBox="0 0 120 120" className="donut-svg">
              <circle cx="60" cy="60" r="48" fill="none" stroke="#fce4ec" strokeWidth="22" />
              <circle cx="60" cy="60" r="48" fill="none" stroke="#e91e63" strokeWidth="22"
                strokeDasharray={`${sympDash} ${C}`} strokeDashoffset="75"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }} />
              <circle cx="60" cy="60" r="48" fill="none" stroke="#f48fb1" strokeWidth="22"
                strokeDasharray={`${clinDash} ${C}`} strokeDashoffset={`${-(sympDash - 75)}`}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }} />
              <text x="60" y="57" textAnchor="middle" fontSize="11" fontWeight="700" fill="#e91e63">{totalTests}</text>
              <text x="60" y="70" textAnchor="middle" fontSize="8" fill="#aaa">total</text>
            </svg>
            <div className="donut-legend">
              <div className="leg-item"><span className="leg-dot" style={{ background: '#e91e63' }}></span>Symptom tests <b>{sympPct}%</b></div>
              <div className="leg-item"><span className="leg-dot" style={{ background: '#f48fb1' }}></span>Clinical tests <b>{clinPct}%</b></div>
              <div className="leg-divider" />
              <div className="leg-item small"><span>Total tests</span><b>{totalTests.toLocaleString()}</b></div>
            </div>
          </div>
        </div>
      </div>

      {/* Location breakdown */}
      <div className="section-block">
        <h2 className="section-title"><i className="fas fa-map-marker-alt"></i> Users by location</h2>
        <div className="location-grid">
          {sortedLocations.map(([loc, count]) => (
            <div className="loc-item" key={loc}>
              <span className="loc-name">{loc}</span>
              <div className="loc-bar-bg">
                <div className="loc-bar-fill" style={{ width: `${Math.round((count / maxLoc) * 100)}%` }} />
              </div>
              <span className="loc-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="section-block">
        <h2 className="section-title"><i className="fas fa-list"></i> All users</h2>
        <div className="table-tabs">
          {[['all','All'],['admins','Admins'],['new','New (30d)']].map(([key, label]) => (
            <button
              key={key}
              className={`tab-btn ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Location</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td><strong>{u.username}</strong></td>
                  <td className="muted">{u.email}</td>
                  <td>{u.location || '—'}</td>
                  <td>
                    {u.is_admin
                      ? <span className="pill admin">Admin</span>
                      : <span className="pill user">User</span>}
                  </td>
                  <td className="muted">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', color: '#bbb', padding: '2rem' }}>No users found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;