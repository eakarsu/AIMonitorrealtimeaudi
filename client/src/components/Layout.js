import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊', section: 'overview' },
  { path: '/drivers', label: 'Driver Monitoring', icon: '👤', section: 'monitoring' },
  { path: '/vehicles', label: 'Fleet Management', icon: '🚛', section: 'monitoring' },
  { path: '/tracking', label: 'GPS Tracking', icon: '📍', section: 'monitoring' },
  { path: '/incidents', label: 'Incident Detection', icon: '⚠️', section: 'safety' },
  { path: '/emergencies', label: 'Emergency Response', icon: '🚨', section: 'safety' },
  { path: '/threats', label: 'Threat Assessment', icon: '🛡️', section: 'safety' },
  { path: '/behavior', label: 'Behavior Analytics', icon: '📈', section: 'analytics' },
  { path: '/fatigue', label: 'Fatigue Detection', icon: '😴', section: 'analytics' },
  { path: '/speed', label: 'Speed Monitoring', icon: '⚡', section: 'analytics' },
  { path: '/routes', label: 'Route Safety', icon: '🗺️', section: 'operations' },
  { path: '/passengers', label: 'Passenger Safety', icon: '🧑‍🤝‍🧑', section: 'operations' },
  { path: '/maintenance', label: 'Maintenance', icon: '🔧', section: 'operations' },
  { path: '/weather', label: 'Weather Alerts', icon: '🌦️', section: 'operations' },
  { path: '/compliance', label: 'Compliance', icon: '📋', section: 'reports' },
  { path: '/communications', label: 'Communications', icon: '📡', section: 'reports' },
];

const sections = {
  overview: 'Overview',
  monitoring: 'Monitoring',
  safety: 'Safety & Security',
  analytics: 'Analytics',
  operations: 'Operations',
  reports: 'Reports',
};

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  let lastSection = '';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>SafeTransit AI</h2>
          <p>Safety Monitoring Platform</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const showSection = item.section !== lastSection;
            lastSection = item.section;
            return (
              <React.Fragment key={item.path}>
                {showSection && (
                  <div className="sidebar-section">{sections[item.section]}</div>
                )}
                <button
                  className={location.pathname === item.path ? 'active' : ''}
                  onClick={() => navigate(item.path)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
        <div className="user-info">
          <div className="user-name">{user?.name || 'User'}</div>
          <div className="user-role">{user?.role || 'operator'}</div>
          <button className="btn-logout" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
