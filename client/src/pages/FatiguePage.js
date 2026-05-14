import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const FATIGUE_CONFIG = {
  alert: { color: '#10b981', label: 'Alert', bg: 'rgba(16,185,129,0.15)' },
  mild: { color: '#f59e0b', label: 'Mild', bg: 'rgba(245,158,11,0.15)' },
  moderate: { color: '#f97316', label: 'Moderate', bg: 'rgba(249,115,22,0.15)' },
  severe: { color: '#ef4444', label: 'Severe', bg: 'rgba(239,68,68,0.15)' },
  low: { color: '#10b981', label: 'Low', bg: 'rgba(16,185,129,0.15)' },
  high: { color: '#f97316', label: 'High', bg: 'rgba(249,115,22,0.15)' },
  critical: { color: '#ef4444', label: 'Critical', bg: 'rgba(239,68,68,0.15)' },
};

function FatigueIndicator({ level }) {
  const cfg = FATIGUE_CONFIG[level?.toLowerCase()] || { color: '#64748b', label: level || '—', bg: 'rgba(100,116,139,0.15)' };
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: cfg.bg, border: `1px solid ${cfg.color}40` }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.color}` }} />
      <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

export default function FatiguePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiResults, setAiResults] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/fatigue');
      setRecords(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAIAnalyze(record) {
    setAiLoading(prev => ({ ...prev, [record.id]: true }));
    try {
      const res = await api.post('/ai/analyze-fatigue', record);
      setAiResults(prev => ({ ...prev, [record.id]: res.data }));
    } catch {}
    finally { setAiLoading(prev => ({ ...prev, [record.id]: false })); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/fatigue/${id}`);
    fetchData();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editItem) { await api.put(`/fatigue/${editItem.id}`, formData); }
    else { await api.post('/fatigue', formData); }
    setShowForm(false); setEditItem(null); fetchData();
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;

  const criticalCount = records.filter(r => ['severe', 'critical'].includes(r.fatigue_level?.toLowerCase())).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Fatigue Monitor</h1>
          <p>{records.length} records · {criticalCount > 0 ? <span style={{ color: '#ef4444', fontWeight: 700 }}>{criticalCount} critical</span> : 'all clear'}</p>
        </div>
        <button className="btn btn-blue" onClick={() => { setEditItem(null); setFormData({ driver_name: '', fatigue_level: 'low', hours_driven: '', alert_type: 'info', status: 'active' }); setShowForm(true); }}>+ New Record</button>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { level: 'alert', label: 'Alert' },
          { level: 'mild', label: 'Mild Fatigue' },
          { level: 'moderate', label: 'Moderate' },
          { level: 'severe', label: 'Severe' },
        ].map(({ level, label }) => {
          const count = records.filter(r => r.fatigue_level?.toLowerCase() === level).length;
          const cfg = FATIGUE_CONFIG[level];
          return (
            <div key={level} style={{ background: cfg.bg, borderRadius: 10, padding: 14, border: `1px solid ${cfg.color}30` }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: cfg.color }}>{count}</div>
              <div style={{ fontSize: 12, color: cfg.color, marginTop: 2 }}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* Records */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {records.map(record => {
          const aiResult = aiResults[record.id];
          const structured = aiResult?.structured;
          return (
            <div key={record.id} style={{ background: 'var(--bg-card, #1a1d2e)', borderRadius: 12, padding: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary, #e2e8f0)' }}>{record.driver_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                    {record.hours_driven ? `${record.hours_driven}h driven` : 'Hours unknown'}
                  </div>
                </div>
                <FatigueIndicator level={record.fatigue_level} />
              </div>

              {/* Hours driven progress bar */}
              {record.hours_driven && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted, #64748b)', marginBottom: 4 }}>
                    <span>Hours driven</span><span>{record.hours_driven}h / 11h legal</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (record.hours_driven / 11) * 100)}%`, background: record.hours_driven > 10 ? '#ef4444' : record.hours_driven > 8 ? '#f59e0b' : '#10b981', borderRadius: 2 }} />
                  </div>
                </div>
              )}

              {/* AI result display */}
              {structured && (
                <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12 }}>
                  <div style={{ color: '#a78bfa', fontWeight: 600, marginBottom: 4 }}>AI Analysis</div>
                  <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>
                    Fatigue: <FatigueIndicator level={structured.fatigue_level} />
                  </div>
                  {structured.rest_recommendation_hours && (
                    <div style={{ color: 'var(--text-secondary, #94a3b8)', marginTop: 4 }}>
                      Rest needed: <strong style={{ color: '#f59e0b' }}>{structured.rest_recommendation_hours}h</strong>
                    </div>
                  )}
                  {structured.risk_to_passengers && (
                    <div style={{ color: 'var(--text-secondary, #94a3b8)', marginTop: 2 }}>
                      Passenger risk: <strong style={{ color: structured.risk_to_passengers === 'high' ? '#ef4444' : '#10b981' }}>{structured.risk_to_passengers}</strong>
                    </div>
                  )}
                  {structured.immediate_action_required && (
                    <div style={{ marginTop: 6, background: 'rgba(239,68,68,0.15)', padding: '4px 8px', borderRadius: 6, color: '#f87171', fontWeight: 600, fontSize: 11 }}>
                      IMMEDIATE ACTION REQUIRED
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button className="btn btn-blue" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => handleAIAnalyze(record)} disabled={aiLoading[record.id]}>
                  {aiLoading[record.id] ? 'Analyzing...' : 'AI Analyze'}
                </button>
                <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => { setEditItem(record); setFormData({ driver_name: record.driver_name, driver_id: record.driver_id || '', fatigue_level: record.fatigue_level, hours_driven: record.hours_driven || '', alert_type: record.alert_type || 'info', status: record.status }); setShowForm(true); }}>Edit</button>
                <button className="btn btn-red" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => handleDelete(record.id)}>Del</button>
              </div>
            </div>
          );
        })}
        {records.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: 60, textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>No fatigue records found</div>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editItem ? 'Edit Record' : 'New Fatigue Record'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {[
                  { key: 'driver_name', label: 'Driver Name', required: true },
                  { key: 'driver_id', label: 'Driver ID', type: 'number' },
                  { key: 'hours_driven', label: 'Hours Driven', type: 'number' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label>{f.label}{f.required ? ' *' : ''}</label>
                    <input className="form-input" type={f.type || 'text'} value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} required={f.required} />
                  </div>
                ))}
                {[
                  { key: 'fatigue_level', label: 'Fatigue Level', options: ['low', 'moderate', 'high', 'critical'] },
                  { key: 'alert_type', label: 'Alert Type', options: ['info', 'warning', 'critical', 'emergency'] },
                  { key: 'status', label: 'Status', options: ['active', 'resolved', 'monitoring'] },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label>{f.label}</label>
                    <select className="form-input" value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
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
