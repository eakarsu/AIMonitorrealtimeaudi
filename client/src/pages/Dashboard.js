import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const features = [
  { key: 'drivers', path: '/drivers', icon: '👤', title: 'Driver Monitoring', desc: 'Real-time monitoring of all active drivers with safety scores and alerts', color: '#3b82f6' },
  { key: 'vehicles', path: '/vehicles', icon: '🚛', title: 'Fleet Management', desc: 'Track and manage your entire vehicle fleet with GPS and diagnostics', color: '#10b981' },
  { key: 'incidents', path: '/incidents', icon: '⚠️', title: 'Incident Detection', desc: 'AI-powered automatic detection and classification of safety incidents', color: '#ef4444' },
  { key: 'routes', path: '/routes', icon: '🗺️', title: 'Route Safety Analysis', desc: 'Analyze route safety using historical data and real-time conditions', color: '#f59e0b' },
  { key: 'passengers', path: '/passengers', icon: '🧑‍🤝‍🧑', title: 'Passenger Safety', desc: 'Monitor passenger wellbeing and ensure safe transportation', color: '#8b5cf6' },
  { key: 'emergencies', path: '/emergencies', icon: '🚨', title: 'Emergency Response', desc: 'Rapid emergency coordination with AI-generated response plans', color: '#ef4444' },
  { key: 'behavior', path: '/behavior', icon: '📈', title: 'Behavior Analytics', desc: 'Deep analytics on driver behavior patterns and safety scoring', color: '#06b6d4' },
  { key: 'maintenance', path: '/maintenance', icon: '🔧', title: 'Predictive Maintenance', desc: 'AI predicts vehicle failures before they happen', color: '#f97316' },
  { key: 'weather', path: '/weather', icon: '🌦️', title: 'Weather & Road Alerts', desc: 'Real-time weather monitoring and road condition advisories', color: '#3b82f6' },
  { key: 'compliance', path: '/compliance', icon: '📋', title: 'Compliance & Reporting', desc: 'Automated compliance tracking against safety regulations', color: '#10b981' },
  { key: 'threats', path: '/threats', icon: '🛡️', title: 'AI Threat Assessment', desc: 'Machine learning-based threat detection and risk scoring', color: '#8b5cf6' },
  { key: 'tracking', path: '/tracking', icon: '📍', title: 'Live GPS Tracking', desc: 'Real-time GPS tracking of all vehicles with speed monitoring', color: '#06b6d4' },
  { key: 'fatigue', path: '/fatigue', icon: '😴', title: 'Fatigue Detection', desc: 'AI camera-based driver fatigue monitoring and alerts', color: '#f97316' },
  { key: 'speed', path: '/speed', icon: '⚡', title: 'Speed Monitoring', desc: 'Real-time speed violation detection and enforcement', color: '#ef4444' },
  { key: 'communications', path: '/communications', icon: '📡', title: 'Communication Hub', desc: 'Centralized communication between dispatch, drivers, and teams', color: '#ec4899' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Safety Operations Center</h1>
          <p>AI-Powered Real-Time Transportation Safety Monitoring</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>👤</div>
          <div className="stat-value">{stats.total_drivers || 0}</div>
          <div className="stat-label">Active Drivers</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>🚛</div>
          <div className="stat-value">{stats.total_vehicles || 0}</div>
          <div className="stat-label">Fleet Vehicles</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239,68,68,0.15)' }}>⚠️</div>
          <div className="stat-value">{stats.active_incidents || 0}</div>
          <div className="stat-label">Active Incidents</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>🚨</div>
          <div className="stat-value">{stats.active_emergencies || 0}</div>
          <div className="stat-label">Active Emergencies</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(139,92,246,0.15)' }}>🗺️</div>
          <div className="stat-value">{stats.active_routes || 0}</div>
          <div className="stat-label">Active Routes</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)' }}>🧑‍🤝‍🧑</div>
          <div className="stat-value">{stats.active_passengers || 0}</div>
          <div className="stat-label">Active Passengers</div>
        </div>
      </div>

      <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 16 }}>Safety Modules</h2>
      <div className="feature-grid">
        {features.map(f => (
          <div
            key={f.key}
            className="feature-card"
            style={{ '--card-accent': f.color }}
            onClick={() => navigate(f.path)}
          >
            <div className="card-icon" style={{ background: `${f.color}20` }}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
