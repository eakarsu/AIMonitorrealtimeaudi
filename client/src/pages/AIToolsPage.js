import React, { useState } from 'react';
import api from '../utils/api';

const TOOLS = [
  {
    key: 'passenger-safety-score',
    label: 'Passenger Safety Score',
    icon: '🧑‍🤝‍🧑',
    endpoint: '/ai/passenger-safety-score',
    description: 'Pull trip + driver behavior + vehicle incidents and return a passenger safety score with risk factors.',
    fields: [
      { key: 'driverId', label: 'Driver ID (optional)', type: 'text' },
      { key: 'tripId', label: 'Trip ID (optional)', type: 'text' },
      { key: 'lookbackDays', label: 'Lookback Days', type: 'number', placeholder: '30' },
    ],
  },
  {
    key: 'road-hazard-detector',
    label: 'Road Hazard Detector',
    icon: '⚠️',
    endpoint: '/ai/road-hazard-detector',
    description: 'Cluster incidents to identify risky intersections and time-of-day hotspots.',
    fields: [
      { key: 'lookbackDays', label: 'Lookback Days', type: 'number', placeholder: '60' },
      { key: 'region', label: 'Region (optional)', type: 'text' },
    ],
  },
  {
    key: 'distraction-detection',
    label: 'Distraction Detection',
    icon: '📵',
    endpoint: '/ai/distraction-detection',
    description: 'Text-only driver distraction analysis from observations and recent behavior logs (no vision input).',
    fields: [
      { key: 'driverId', label: 'Driver ID', type: 'text' },
      { key: 'observations', label: 'Observations', type: 'textarea', placeholder: 'e.g., Driver reported phone use and missed two stops...' },
      { key: 'recentTextLogs', label: 'Recent Text Logs (optional)', type: 'textarea', placeholder: 'Free-form recent log notes' },
    ],
  },
  {
    key: 'premium-adjustment',
    label: 'Insurance Premium Adjustment',
    icon: '💸',
    endpoint: '/ai/premium-adjustment',
    description: 'Advisory premium adjustment recommendation derived from existing risk signals (driver behavior, incidents, prior analyses).',
    fields: [
      { key: 'driverId', label: 'Driver ID', type: 'text' },
      { key: 'vehicleId', label: 'Vehicle ID (optional)', type: 'text' },
      { key: 'currentPremium', label: 'Current Premium (USD)', type: 'number', placeholder: '1200' },
      { key: 'policyTermMonths', label: 'Policy Term (months)', type: 'number', placeholder: '12' },
    ],
  },
];

export default function AIToolsPage() {
  const [activeKey, setActiveKey] = useState(TOOLS[0].key);
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const tool = TOOLS.find(t => t.key === activeKey);

  const setField = (key, value) =>
    setInputs(prev => ({ ...prev, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const payload = {};
      tool.fields.forEach(f => {
        const v = inputs[f.key];
        if (v === undefined || v === '') return;
        payload[f.key] = f.type === 'number' ? Number(v) : v;
      });
      const res = await api.post(tool.endpoint, payload);
      setResult(res.data);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 503) {
        setError('AI service not configured. OPENROUTER_API_KEY missing.');
      } else {
        setError(err?.response?.data?.error || err?.message || 'Request failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ marginBottom: 4 }}>🧠 AI Tools</h1>
        <p style={{ color: '#94a3b8' }}>Passenger safety scoring and road hazard detection.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12, marginBottom: 24 }}>
        {TOOLS.map(t => {
          const active = t.key === activeKey;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => { setActiveKey(t.key); setInputs({}); setResult(null); setError(null); }}
              style={{
                textAlign: 'left',
                padding: 16,
                border: active ? '2px solid #2563eb' : '1px solid #334155',
                background: active ? 'rgba(37,99,235,0.12)' : '#1e293b',
                borderRadius: 8,
                cursor: 'pointer',
                color: '#e2e8f0',
              }}
            >
              <div style={{ fontSize: 24 }}>{t.icon}</div>
              <div style={{ fontWeight: 600, marginTop: 4 }}>{t.label}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{t.description}</div>
            </button>
          );
        })}
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: 24, maxWidth: 720 }}>
        <h2 style={{ marginBottom: 4 }}>{tool.icon} {tool.label}</h2>
        <p style={{ color: '#94a3b8', marginBottom: 16 }}>{tool.description}</p>

        <form onSubmit={submit}>
          {tool.fields.map(field => (
            <div key={field.key} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={inputs[field.key] || ''}
                  onChange={e => setField(field.key, e.target.value)}
                  placeholder={field.placeholder || ''}
                  style={{ width: '100%', padding: 8, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6, fontFamily: 'inherit', fontSize: 13 }}
                />
              ) : (
                <input
                  type={field.type}
                  value={inputs[field.key] || ''}
                  onChange={e => setField(field.key, e.target.value)}
                  placeholder={field.placeholder || ''}
                  style={{ width: '100%', padding: 8, background: '#0f172a', color: '#e2e8f0', border: '1px solid #334155', borderRadius: 6 }}
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 12,
              fontSize: 14,
              background: loading ? '#475569' : '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
            }}
          >
            {loading ? 'Running…' : `Run ${tool.label}`}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', color: '#fecaca', borderRadius: 6 }}>
            {String(error)}
          </div>
        )}

        {result && (
          <div style={{ marginTop: 20, padding: 16, background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}>
            <h3 style={{ marginBottom: 8 }}>Result</h3>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, color: '#e2e8f0' }}>
              {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
