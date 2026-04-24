import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FeaturePage from './pages/FeaturePage';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/drivers" element={<ProtectedRoute><Layout><FeaturePage feature="drivers" title="Driver Monitoring" /></Layout></ProtectedRoute>} />
      <Route path="/vehicles" element={<ProtectedRoute><Layout><FeaturePage feature="vehicles" title="Fleet Management" /></Layout></ProtectedRoute>} />
      <Route path="/incidents" element={<ProtectedRoute><Layout><FeaturePage feature="incidents" title="Incident Detection" /></Layout></ProtectedRoute>} />
      <Route path="/routes" element={<ProtectedRoute><Layout><FeaturePage feature="routes" title="Route Safety" /></Layout></ProtectedRoute>} />
      <Route path="/passengers" element={<ProtectedRoute><Layout><FeaturePage feature="passengers" title="Passenger Safety" /></Layout></ProtectedRoute>} />
      <Route path="/emergencies" element={<ProtectedRoute><Layout><FeaturePage feature="emergencies" title="Emergency Response" /></Layout></ProtectedRoute>} />
      <Route path="/behavior" element={<ProtectedRoute><Layout><FeaturePage feature="behavior" title="Behavior Analytics" /></Layout></ProtectedRoute>} />
      <Route path="/maintenance" element={<ProtectedRoute><Layout><FeaturePage feature="maintenance" title="Predictive Maintenance" /></Layout></ProtectedRoute>} />
      <Route path="/weather" element={<ProtectedRoute><Layout><FeaturePage feature="weather" title="Weather Alerts" /></Layout></ProtectedRoute>} />
      <Route path="/compliance" element={<ProtectedRoute><Layout><FeaturePage feature="compliance" title="Compliance Reports" /></Layout></ProtectedRoute>} />
      <Route path="/threats" element={<ProtectedRoute><Layout><FeaturePage feature="threats" title="Threat Assessment" /></Layout></ProtectedRoute>} />
      <Route path="/tracking" element={<ProtectedRoute><Layout><FeaturePage feature="tracking" title="GPS Tracking" /></Layout></ProtectedRoute>} />
      <Route path="/fatigue" element={<ProtectedRoute><Layout><FeaturePage feature="fatigue" title="Fatigue Detection" /></Layout></ProtectedRoute>} />
      <Route path="/speed" element={<ProtectedRoute><Layout><FeaturePage feature="speed" title="Speed Monitoring" /></Layout></ProtectedRoute>} />
      <Route path="/communications" element={<ProtectedRoute><Layout><FeaturePage feature="communications" title="Communication Hub" /></Layout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
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
