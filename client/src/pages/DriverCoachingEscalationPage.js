import React, { useState } from 'react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

export default function DriverCoachingEscalationPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const run = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/driver-coaching-escalation/matrix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ driverId: 'DRV-204', fatigueScore: 72, incidentCount30d: 3, events: [{ type: 'hard_brake', severity: 'high' }, { type: 'fatigue', severity: 'medium' }] }),
      });
      setResult(await res.json());
    } catch (err) {
      setError(err.message || 'Matrix failed');
    }
  };

  return (
    <div className="page">
      <h1>Driver Coaching Escalation Matrix</h1>
      <p>Convert real-time safety signals into an auditable coaching tier and next action.</p>
      <button onClick={run}>Build escalation</button>
      {error && <div style={{ color: '#dc2626' }}>{error}</div>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
