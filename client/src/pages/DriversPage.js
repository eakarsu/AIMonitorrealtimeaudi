import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const RISK_COLORS = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
const STATUS_COLORS = { active: '#10b981', on_route: '#3b82f6', off_duty: '#64748b', suspended: '#ef4444' };

function SafetyGauge({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444';
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - (score || 0) / 100);
  return (
    <svg width="100" height="60" viewBox="0 0 100 60">
      <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" />
      <path
        d="M 10 55 A 40 40 0 0 1 90 55"
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference * 0.5}
        strokeDashoffset={circumference * 0.5 * (1 - (score || 0) / 100)}
      />
      <text x="50" y="52" textAnchor="middle" fill={color} fontSize="14" fontWeight="700">{score ?? '—'}</text>
    </svg>
  );
}

function getBadgeClass(value) {
  if (!value) return '';
  const v = String(value).toLowerCase();
  if (['active', 'compliant', 'low'].includes(v)) return 'badge-green';
  if (['critical', 'emergency', 'suspended'].includes(v)) return 'badge-red';
  if (['high', 'urgent', 'on_route'].includes(v)) return 'badge-yellow';
  if (['medium', 'moderate', 'off_duty'].includes(v)) return 'badge-blue';
  return 'badge-cyan';
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiResults, setAiResults] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await api.get('/drivers');
      setDrivers(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  async function handleAIAnalyze(driver) {
    setAiLoading(prev => ({ ...prev, [driver.id]: true }));
    try {
      const res = await api.post('/ai/analyze-driver', driver);
      setAiResults(prev => ({ ...prev, [driver.id]: res.data }));
    } catch {}
    finally { setAiLoading(prev => ({ ...prev, [driver.id]: false })); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this driver?')) return;
    await api.delete(`/drivers/${id}`);
    fetchDrivers();
    setSelected(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editItem) { await api.put(`/drivers/${editItem.id}`, formData); }
    else { await api.post('/drivers', formData); }
    setShowForm(false); setEditItem(null); fetchDrivers();
  }

  function openEdit(d) {
    setEditItem(d);
    setFormData({ name: d.name, license_number: d.license_number || '', phone: d.phone || '', status: d.status, rating: d.rating, vehicle_id: d.vehicle_id || '', experience_years: d.experience_years || 0 });
    setShowForm(true);
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>Driver Safety Dashboard</h1><p>{drivers.length} drivers monitored</p></div>
        <button className="btn btn-blue" onClick={() => { setEditItem(null); setFormData({ name: '', license_number: '', phone: '', status: 'active', rating: 5, experience_years: 0 }); setShowForm(true); }}>+ New Driver</button>
      </div>

      {/* Driver cards with safety gauges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
        {drivers.map(driver => {
          const aiResult = aiResults[driver.id];
          const aiLoaded = !!aiResult;
          const riskLevel = aiResult?.structured?.risk_level || aiResult?.structured?.risk_level;
          const safetyScore = aiResult?.structured?.safety_score;

          return (
            <div key={driver.id} className="feature-card" style={{ padding: 16, cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{driver.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{driver.license_number || 'No license'}</div>
                </div>
                <span className={`badge ${getBadgeClass(driver.status)}`}>{driver.status}</span>
              </div>

              {aiLoaded && safetyScore !== undefined ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <SafetyGauge score={safetyScore} />
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Safety Score</div>
                    {riskLevel && (
                      <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: `${RISK_COLORS[riskLevel]}22`, color: RISK_COLORS[riskLevel] }}>
                        {riskLevel.toUpperCase()} RISK
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Rating: {driver.rating} | {driver.experience_years}y exp
                </div>
              )}

              {aiLoaded && aiResult?.structured?.key_concerns?.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Key Concerns:</div>
                  <ul style={{ margin: 0, paddingLeft: 14, fontSize: 11, color: 'var(--text-secondary)' }}>
                    {aiResult.structured.key_concerns.slice(0, 2).map((c, i) => <li key={i}>{c}</li>)}
                  </ul>
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                <button
                  className="btn btn-blue"
                  style={{ fontSize: 11, padding: '4px 10px' }}
                  onClick={() => handleAIAnalyze(driver)}
                  disabled={aiLoading[driver.id]}
                >
                  {aiLoading[driver.id] ? 'Analyzing...' : 'AI Analyze'}
                </button>
                <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => openEdit(driver)}>Edit</button>
                <button className="btn btn-red" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => handleDelete(driver.id)}>Delete</button>
              </div>
            </div>
          );
        })}
        {drivers.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>No drivers found</div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editItem ? 'Edit Driver' : 'New Driver'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {[
                  { key: 'name', label: 'Full Name', required: true },
                  { key: 'license_number', label: 'License Number' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'rating', label: 'Rating', type: 'number' },
                  { key: 'vehicle_id', label: 'Vehicle ID', type: 'number' },
                  { key: 'experience_years', label: 'Experience Years', type: 'number' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label>{f.label}{f.required ? ' *' : ''}</label>
                    <input className="form-input" type={f.type || 'text'} value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} required={f.required} />
                  </div>
                ))}
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-input" value={formData.status || 'active'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    {['active', 'on_route', 'off_duty', 'suspended'].map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-green">{editItem ? 'Update' : 'Create'}</button>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
