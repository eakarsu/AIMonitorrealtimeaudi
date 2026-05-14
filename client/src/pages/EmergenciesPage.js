import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const PRIORITY_CONFIG = {
  low: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'LOW' },
  medium: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'MEDIUM' },
  high: { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'HIGH' },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'CRITICAL' },
};

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority?.toLowerCase()] || { color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: priority || '—' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}>
      {cfg.label}
    </span>
  );
}

export default function EmergenciesPage() {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiResults, setAiResults] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/emergencies');
      const data = Array.isArray(res.data) ? res.data : res.data.data || [];
      // Sort by priority: critical > high > medium > low
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      data.sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4));
      setEmergencies(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAIAnalyze(emergency) {
    setAiLoading(prev => ({ ...prev, [emergency.id]: true }));
    setExpandedId(emergency.id);
    try {
      const res = await api.post('/ai/emergency-response', emergency);
      setAiResults(prev => ({ ...prev, [emergency.id]: res.data }));
    } catch {}
    finally { setAiLoading(prev => ({ ...prev, [emergency.id]: false })); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this emergency record?')) return;
    await api.delete(`/emergencies/${id}`);
    fetchData();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editItem) { await api.put(`/emergencies/${editItem.id}`, formData); }
    else { await api.post('/emergencies', formData); }
    setShowForm(false); setEditItem(null); fetchData();
  }

  const activeCount = emergencies.filter(e => ['active', 'responding'].includes(e.status?.toLowerCase())).length;
  const criticalCount = emergencies.filter(e => e.priority === 'critical').length;

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Emergency Dispatch</h1>
          <p>
            {activeCount > 0 && <span style={{ color: '#f97316', fontWeight: 700 }}>{activeCount} active</span>}
            {activeCount > 0 && criticalCount > 0 && ' · '}
            {criticalCount > 0 && <span style={{ color: '#ef4444', fontWeight: 700 }}>{criticalCount} critical</span>}
            {activeCount === 0 && criticalCount === 0 && 'No active emergencies'}
          </p>
        </div>
        <button className="btn btn-blue" onClick={() => { setEditItem(null); setFormData({ type: 'Accident', priority: 'high', description: '', location: '', status: 'active' }); setShowForm(true); }}>+ New Emergency</button>
      </div>

      {/* Emergency cards sorted by priority */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {emergencies.map(emergency => {
          const cfg = PRIORITY_CONFIG[emergency.priority?.toLowerCase()] || PRIORITY_CONFIG.medium;
          const isExpanded = expandedId === emergency.id;
          const aiResult = aiResults[emergency.id];
          const structured = aiResult?.structured;

          return (
            <div key={emergency.id} style={{ background: 'var(--bg-card, #1a1d2e)', borderRadius: 12, border: `1px solid ${emergency.priority === 'critical' || emergency.priority === 'high' ? cfg.color + '40' : 'rgba(255,255,255,0.08)'}`, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                  <div style={{ width: 4, height: 40, borderRadius: 2, background: cfg.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary, #e2e8f0)' }}>{emergency.type}</span>
                      <PriorityBadge priority={emergency.priority} />
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, background: ['active', 'responding'].includes(emergency.status) ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.12)', color: ['active', 'responding'].includes(emergency.status) ? '#f87171' : '#34d399' }}>
                        {emergency.status?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted, #64748b)' }}>
                      {emergency.location || 'Location unknown'} · {new Date(emergency.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className="btn btn-blue"
                    style={{ fontSize: 12, padding: '5px 12px' }}
                    onClick={() => handleAIAnalyze(emergency)}
                    disabled={aiLoading[emergency.id]}
                  >
                    {aiLoading[emergency.id] ? 'Analyzing...' : 'AI Response Plan'}
                  </button>
                  <button className="btn btn-outline" style={{ fontSize: 12, padding: '5px 8px' }} onClick={() => { setEditItem(emergency); setFormData({ type: emergency.type, priority: emergency.priority, description: emergency.description || '', location: emergency.location || '', responder: emergency.responder || '', driver_id: emergency.driver_id || '', vehicle_id: emergency.vehicle_id || '', status: emergency.status }); setShowForm(true); }}>Edit</button>
                  <button className="btn btn-red" style={{ fontSize: 12, padding: '5px 8px' }} onClick={() => handleDelete(emergency.id)}>Del</button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #64748b)', padding: '5px 8px', fontSize: 16 }} onClick={() => setExpandedId(isExpanded ? null : emergency.id)}>
                    {isExpanded ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {/* Expanded: description + AI plan */}
              {isExpanded && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {emergency.description && (
                    <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.5 }}>{emergency.description}</div>
                  )}
                  {emergency.responder && (
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted, #64748b)' }}>Responder: <strong style={{ color: 'var(--text-secondary, #94a3b8)' }}>{emergency.responder}</strong></div>
                  )}

                  {/* AI Response Plan */}
                  {structured && (
                    <div style={{ marginTop: 14, background: 'rgba(99,102,241,0.08)', borderRadius: 10, padding: 14 }}>
                      <div style={{ fontWeight: 600, color: '#a78bfa', fontSize: 13, marginBottom: 10 }}>AI Emergency Response Plan</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10, fontSize: 12 }}>
                        {structured.severity && (
                          <div>Severity: <PriorityBadge priority={structured.severity} /></div>
                        )}
                        {structured.estimated_response_time_minutes && (
                          <div style={{ color: 'var(--text-secondary, #94a3b8)' }}>Est. Response: <strong style={{ color: '#f59e0b' }}>{structured.estimated_response_time_minutes} min</strong></div>
                        )}
                      </div>

                      {structured.immediate_steps?.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: 6 }}>Immediate Steps:</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {structured.immediate_steps.map((step, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
                                <span style={{ background: 'rgba(99,102,241,0.2)', color: '#a78bfa', borderRadius: 4, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                                <span style={{ lineHeight: 1.4 }}>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {structured.notify_parties?.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: 4 }}>Notify:</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {structured.notify_parties.map((p, i) => (
                              <span key={i} style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>{p}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {structured.resource_requirements?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', marginBottom: 4 }}>Resources Required:</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {structured.resource_requirements.map((r, i) => (
                              <span key={i} style={{ background: 'rgba(245,158,11,0.12)', color: '#fbbf24', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{r}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {aiLoading[emergency.id] && (
                    <div style={{ marginTop: 12, textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: 13 }}>AI is generating response plan...</div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {emergencies.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>No emergency records found</div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editItem ? 'Edit Emergency' : 'New Emergency'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {[
                  { key: 'location', label: 'Location' },
                  { key: 'responder', label: 'Responder' },
                  { key: 'driver_id', label: 'Driver ID', type: 'number' },
                  { key: 'vehicle_id', label: 'Vehicle ID', type: 'number' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label>{f.label}</label>
                    <input className="form-input" type={f.type || 'text'} value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} />
                  </div>
                ))}
                {[
                  { key: 'type', label: 'Type *', options: ['Accident', 'Medical', 'Fire', 'Breakdown', 'Security', 'Hazmat', 'Weather', 'Theft', 'Assault', 'Evacuation'] },
                  { key: 'priority', label: 'Priority', options: ['low', 'medium', 'high', 'critical'] },
                  { key: 'status', label: 'Status', options: ['active', 'responding', 'resolved', 'closed'] },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label>{f.label}</label>
                    <select className="form-input" value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea className="form-input" rows={3} value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
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
