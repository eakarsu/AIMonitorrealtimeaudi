import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import DriversPage from './pages/DriversPage';
import TrackingPage from './pages/TrackingPage';
import FatiguePage from './pages/FatiguePage';
import EmergenciesPage from './pages/EmergenciesPage';
import AIToolsPage from './pages/AIToolsPage';
import DriverCoachingEscalationPage from './pages/DriverCoachingEscalationPage';
import Layout from './components/Layout';

import CodexCustomVizFeature from './pages/CodexCustomVizFeature';
import CodexOperationsFeature from './pages/CodexOperationsFeature';

import TimelineView from './pages/TimelineView';

// Toast container
function ToastContainer({ toasts, dismiss }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} onClick={() => dismiss(t.id)} style={{
          background: t.type === 'emergency' ? '#dc2626' : t.type === 'warning' ? '#d97706' : '#1e40af',
          color: '#fff', padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', minWidth: 280, fontSize: 13, lineHeight: 1.4,
          animation: 'slideIn 0.2s ease',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 2 }}>{t.title}</div>
          <div style={{ opacity: 0.9 }}>{t.message}</div>
        </div>
      ))}
    </div>
  );
}

// WebSocket hook
function useWebSocket(onMessage) {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:4000`;
    let ws;
    let reconnectTimer;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => console.log('WS connected');
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.event !== 'connected') {
              onMessage(msg);
              setAlertCount(c => c + 1);
            }
          } catch {}
        };
        ws.onclose = () => {
          reconnectTimer = setTimeout(connect, 3000);
        };
        ws.onerror = () => ws.close();
      } catch {}
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [onMessage]);

  return { alertCount };
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function AppRoutes() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((title, message, type = 'info') => {
    const id = Date.now();
    setToasts(t => [...t, { id, title, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const handleWsMessage = useCallback((msg) => {
    switch (msg.event) {
      case 'new_emergency':
        addToast('New Emergency', `${msg.data.type} - Priority: ${msg.data.priority} at ${msg.data.location || 'unknown'}`, 'emergency');
        break;
      case 'high_severity_incident':
        addToast('High Severity Incident', `Incident #${msg.data.id} - Driver: ${msg.data.driver_id || 'unknown'}`, 'warning');
        break;
      case 'driver_alert':
        addToast('Driver Safety Alert', `Driver #${msg.data.driver_id} - Risk: ${msg.data.risk_level}`, 'warning');
        break;
      case 'fatigue_alert':
        addToast('Fatigue Alert', `Driver #${msg.data.driver_id} - Level: ${msg.data.fatigue_level}`, 'warning');
        break;
      case 'speed_violation':
        addToast('Speed Violation', `Vehicle #${msg.data.vehicle_id} - ${msg.data.speed_kmh} km/h (limit: ${msg.data.speed_limit})`, 'warning');
        break;
      default:
        break;
    }
  }, [addToast]);

  const { alertCount } = useWebSocket(handleWsMessage);

  const layoutWithAlerts = (children) => (
    <Layout alertCount={alertCount}>
      {children}
    </Layout>
  );

  return (
    <>
      <ToastContainer toasts={toasts} dismiss={dismissToast} />
      <Routes>
        <Route path="/insights/timeline" element={<ProtectedRoute><TimelineView /></ProtectedRoute>} />
        <Route path="/codex/custom-viz" element={<ProtectedRoute><CodexCustomVizFeature /></ProtectedRoute>} />
        <Route path="/codex/operations" element={<ProtectedRoute><CodexOperationsFeature /></ProtectedRoute>} />

        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute>{layoutWithAlerts(<Dashboard />)}</ProtectedRoute>} />
        <Route path="/drivers" element={<ProtectedRoute>{layoutWithAlerts(<DriversPage />)}</ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute>{layoutWithAlerts(<FeaturePage feature="vehicles" title="Fleet Management" />)}</ProtectedRoute>} />
        <Route path="/incidents" element={<ProtectedRoute>{layoutWithAlerts(<FeaturePage feature="incidents" title="Incident Detection" />)}</ProtectedRoute>} />
        <Route path="/routes" element={<ProtectedRoute>{layoutWithAlerts(<FeaturePage feature="routes" title="Route Safety" />)}</ProtectedRoute>} />
        <Route path="/passengers" element={<ProtectedRoute>{layoutWithAlerts(<FeaturePage feature="passengers" title="Passenger Safety" />)}</ProtectedRoute>} />
        <Route path="/emergencies" element={<ProtectedRoute>{layoutWithAlerts(<EmergenciesPage />)}</ProtectedRoute>} />
        <Route path="/behavior" element={<ProtectedRoute>{layoutWithAlerts(<FeaturePage feature="behavior" title="Behavior Analytics" />)}</ProtectedRoute>} />
        <Route path="/maintenance" element={<ProtectedRoute>{layoutWithAlerts(<FeaturePage feature="maintenance" title="Predictive Maintenance" />)}</ProtectedRoute>} />
        <Route path="/weather" element={<ProtectedRoute>{layoutWithAlerts(<FeaturePage feature="weather" title="Weather Alerts" />)}</ProtectedRoute>} />
        <Route path="/compliance" element={<ProtectedRoute>{layoutWithAlerts(<FeaturePage feature="compliance" title="Compliance Reports" />)}</ProtectedRoute>} />
        <Route path="/threats" element={<ProtectedRoute>{layoutWithAlerts(<FeaturePage feature="threats" title="Threat Assessment" />)}</ProtectedRoute>} />
        <Route path="/tracking" element={<ProtectedRoute>{layoutWithAlerts(<TrackingPage />)}</ProtectedRoute>} />
        <Route path="/fatigue" element={<ProtectedRoute>{layoutWithAlerts(<FatiguePage />)}</ProtectedRoute>} />
        <Route path="/speed" element={<ProtectedRoute>{layoutWithAlerts(<FeaturePage feature="speed" title="Speed Monitoring" />)}</ProtectedRoute>} />
        <Route path="/communications" element={<ProtectedRoute>{layoutWithAlerts(<FeaturePage feature="communications" title="Communication Hub" />)}</ProtectedRoute>} />
        <Route path="/ai-tools" element={<ProtectedRoute>{layoutWithAlerts(<AIToolsPage />)}</ProtectedRoute>} />
        <Route path="/driver-coaching-escalation" element={<ProtectedRoute>{layoutWithAlerts(<DriverCoachingEscalationPage />)}</ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
