import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

function getBadgeClass(value) {
  if (!value) return '';
  const v = String(value).toLowerCase();
  if (['moving', 'active'].includes(v)) return 'badge-green';
  if (['stopped', 'idle'].includes(v)) return 'badge-yellow';
  if (['offline'].includes(v)) return 'badge-purple';
  return 'badge-cyan';
}

function formatValue(val) {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'number' && !Number.isInteger(val)) return val.toFixed(4);
  return String(val);
}

export default function TrackingPage() {
  const [tracking, setTracking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [selected, setSelected] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get('/tracking');
      setTracking(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleDelete(id) {
    if (!window.confirm('Delete?')) return;
    await api.delete(`/tracking/${id}`);
    fetchData(); setSelected(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (editItem) { await api.put(`/tracking/${editItem.id}`, formData); }
    else { await api.post('/tracking', formData); }
    setShowForm(false); setEditItem(null); fetchData();
  }

  function openEdit(item) {
    setEditItem(item);
    setFormData({ vehicle_id: item.vehicle_id || '', vehicle_name: item.vehicle_name || '', driver_name: item.driver_name || '', latitude: item.latitude || '', longitude: item.longitude || '', speed: item.speed || 0, heading: item.heading || 0, status: item.status || 'moving' });
    setShowForm(true);
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <div><h1>GPS Tracking</h1><p>{tracking.length} vehicles tracked</p></div>
        <button className="btn btn-blue" onClick={() => { setEditItem(null); setFormData({ vehicle_name: '', driver_name: '', latitude: '', longitude: '', speed: 0, status: 'moving' }); setShowForm(true); }}>+ Add Record</button>
      </div>

      {/* Map-like lat/lng grid */}
      <div style={{ background: 'var(--bg-card, #1a1d2e)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', padding: 20, marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary, #94a3b8)' }}>Vehicle Positions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {tracking.slice(0, 12).map(t => (
            <div key={t.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary, #e2e8f0)', marginBottom: 4 }}>{t.vehicle_name || `Vehicle #${t.vehicle_id || t.id}`}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)', marginBottom: 4 }}>{t.driver_name || 'Unknown driver'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11 }}>
                <span style={{ color: 'var(--text-muted, #64748b)' }}>Lat: <span style={{ color: '#06b6d4' }}>{formatValue(t.latitude)}</span></span>
                <span style={{ color: 'var(--text-muted, #64748b)' }}>Lng: <span style={{ color: '#06b6d4' }}>{formatValue(t.longitude)}</span></span>
                <span style={{ color: 'var(--text-muted, #64748b)' }}>Speed: <span style={{ color: t.speed > 100 ? '#ef4444' : '#10b981' }}>{t.speed || 0} mph</span></span>
                <span><span className={`badge ${getBadgeClass(t.status)}`} style={{ fontSize: 10 }}>{t.status}</span></span>
              </div>
            </div>
          ))}
          {tracking.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--text-muted, #64748b)', padding: 20 }}>No tracking data</div>}
        </div>
      </div>

      {/* Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Vehicle</th><th>Driver</th><th>Latitude</th><th>Longitude</th><th>Speed</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tracking.map((t, idx) => (
              <tr key={t.id}>
                <td>{idx + 1}</td>
                <td>{t.vehicle_name || `#${t.vehicle_id || t.id}`}</td>
                <td>{t.driver_name || '-'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatValue(t.latitude)}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatValue(t.longitude)}</td>
                <td style={{ color: t.speed > 100 ? '#ef4444' : 'inherit' }}>{t.speed || 0}</td>
                <td><span className={`badge ${getBadgeClass(t.status)}`}>{t.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => openEdit(t)}>Edit</button>
                    <button className="btn btn-red" style={{ fontSize: 11, padding: '3px 8px' }} onClick={() => handleDelete(t.id)}>Del</button>
                  </div>
                </td>
              </tr>
            ))}
            {tracking.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>No records</td></tr>}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editItem ? 'Edit Record' : 'New Tracking Record'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {[
                  { key: 'vehicle_name', label: 'Vehicle Name', required: true },
                  { key: 'driver_name', label: 'Driver Name' },
                  { key: 'vehicle_id', label: 'Vehicle ID', type: 'number' },
                  { key: 'latitude', label: 'Latitude', type: 'number' },
                  { key: 'longitude', label: 'Longitude', type: 'number' },
                  { key: 'speed', label: 'Speed (mph)', type: 'number' },
                  { key: 'heading', label: 'Heading', type: 'number' },
                ].map(f => (
                  <div key={f.key} className="form-group">
                    <label>{f.label}{f.required ? ' *' : ''}</label>
                    <input className="form-input" type={f.type || 'text'} value={formData[f.key] || ''} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} required={f.required} />
                  </div>
                ))}
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-input" value={formData.status || 'moving'} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                    {['moving', 'stopped', 'idle', 'offline'].map(o => <option key={o} value={o}>{o}</option>)}
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
