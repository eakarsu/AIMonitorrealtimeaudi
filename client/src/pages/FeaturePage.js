import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const featureConfig = {
  drivers: {
    endpoint: '/drivers',
    aiEndpoint: '/ai/analyze-driver',
    aiPrompt: 'Analyze driver safety profile',
    columns: ['name', 'license_number', 'phone', 'status', 'rating', 'experience_years'],
    columnLabels: ['Name', 'License', 'Phone', 'Status', 'Rating', 'Experience (yrs)'],
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'license_number', label: 'License Number', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'on_route', 'off_duty', 'suspended'] },
      { key: 'rating', label: 'Rating', type: 'number', step: '0.1' },
      { key: 'vehicle_id', label: 'Vehicle ID', type: 'number' },
      { key: 'experience_years', label: 'Experience Years', type: 'number' },
    ],
    statusField: 'status',
  },
  vehicles: {
    endpoint: '/vehicles',
    aiEndpoint: '/ai/predict-maintenance',
    aiPrompt: 'Predict maintenance needs',
    columns: ['plate_number', 'model', 'type', 'status', 'mileage', 'fuel_level'],
    columnLabels: ['Plate', 'Model', 'Type', 'Status', 'Mileage', 'Fuel %'],
    fields: [
      { key: 'plate_number', label: 'Plate Number', type: 'text', required: true },
      { key: 'model', label: 'Model', type: 'text' },
      { key: 'type', label: 'Type', type: 'select', options: ['Heavy Truck', 'Delivery Van', 'Passenger Bus', 'City Bus', 'Long Haul', 'Medium Truck', 'Construction'] },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'maintenance', 'inactive'] },
      { key: 'mileage', label: 'Mileage', type: 'number' },
      { key: 'fuel_level', label: 'Fuel Level (%)', type: 'number' },
      { key: 'gps_enabled', label: 'GPS Enabled', type: 'select', options: ['true', 'false'] },
    ],
    statusField: 'status',
  },
  incidents: {
    endpoint: '/incidents',
    aiEndpoint: '/ai/analyze-incident',
    aiPrompt: 'Analyze incident root cause',
    columns: ['type', 'severity', 'location', 'status', 'driver_id', 'created_at'],
    columnLabels: ['Type', 'Severity', 'Location', 'Status', 'Driver ID', 'Date'],
    fields: [
      { key: 'type', label: 'Type', type: 'select', options: ['Collision', 'Near Miss', 'Mechanical Failure', 'Weather Related', 'Cargo Spill', 'Tire Blowout', 'Driver Distraction', 'Road Hazard', 'Speeding', 'Fuel Leak', 'Passenger Injury'], required: true },
      { key: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'driver_id', label: 'Driver ID', type: 'number' },
      { key: 'vehicle_id', label: 'Vehicle ID', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['open', 'investigating', 'resolved', 'closed'] },
    ],
    statusField: 'status',
    severityField: 'severity',
  },
  routes: {
    endpoint: '/routes',
    aiEndpoint: '/ai/analyze-route',
    aiPrompt: 'Analyze route safety risks',
    columns: ['name', 'origin', 'destination', 'distance_km', 'risk_level', 'status'],
    columnLabels: ['Route Name', 'Origin', 'Destination', 'Distance (km)', 'Risk', 'Status'],
    fields: [
      { key: 'name', label: 'Route Name', type: 'text', required: true },
      { key: 'origin', label: 'Origin', type: 'text' },
      { key: 'destination', label: 'Destination', type: 'text' },
      { key: 'distance_km', label: 'Distance (km)', type: 'number', step: '0.1' },
      { key: 'risk_level', label: 'Risk Level', type: 'select', options: ['low', 'medium', 'high'] },
      { key: 'estimated_time', label: 'Estimated Time', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'restricted', 'closed'] },
    ],
    statusField: 'status',
    severityField: 'risk_level',
  },
  passengers: {
    endpoint: '/passengers',
    aiEndpoint: '/ai/general-analysis',
    aiPrompt: 'Analyze passenger safety data',
    columns: ['name', 'phone', 'email', 'status', 'pickup_location', 'dropoff_location'],
    columnLabels: ['Name', 'Phone', 'Email', 'Status', 'Pickup', 'Dropoff'],
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'trip_id', label: 'Trip ID', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'completed', 'cancelled'] },
      { key: 'pickup_location', label: 'Pickup Location', type: 'text' },
      { key: 'dropoff_location', label: 'Dropoff Location', type: 'text' },
    ],
    statusField: 'status',
  },
  emergencies: {
    endpoint: '/emergencies',
    aiEndpoint: '/ai/emergency-response',
    aiPrompt: 'Generate emergency response plan',
    columns: ['type', 'priority', 'location', 'responder', 'status', 'created_at'],
    columnLabels: ['Type', 'Priority', 'Location', 'Responder', 'Status', 'Date'],
    fields: [
      { key: 'type', label: 'Type', type: 'select', options: ['Accident', 'Medical', 'Fire', 'Breakdown', 'Security', 'Hazmat', 'Weather', 'Theft', 'Assault', 'Evacuation'], required: true },
      { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'responder', label: 'Responder', type: 'text' },
      { key: 'driver_id', label: 'Driver ID', type: 'number' },
      { key: 'vehicle_id', label: 'Vehicle ID', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'responding', 'resolved', 'closed'] },
    ],
    statusField: 'status',
    severityField: 'priority',
  },
  behavior: {
    endpoint: '/behavior',
    aiEndpoint: '/ai/analyze-driver',
    aiPrompt: 'Analyze driver behavior patterns',
    columns: ['driver_name', 'event_type', 'severity', 'score', 'location', 'recorded_at'],
    columnLabels: ['Driver', 'Event', 'Severity', 'Score', 'Location', 'Date'],
    fields: [
      { key: 'driver_id', label: 'Driver ID', type: 'number' },
      { key: 'driver_name', label: 'Driver Name', type: 'text', required: true },
      { key: 'event_type', label: 'Event Type', type: 'select', options: ['Hard Braking', 'Smooth Driving', 'Aggressive Turning', 'Phone Usage', 'Speeding', 'Lane Drifting', 'Tailgating', 'Exemplary', 'Reckless Driving', 'Safe Distance'] },
      { key: 'severity', label: 'Severity', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'score', label: 'Score (0-100)', type: 'number' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'location', label: 'Location', type: 'text' },
    ],
    statusField: 'severity',
    severityField: 'severity',
  },
  maintenance: {
    endpoint: '/maintenance',
    aiEndpoint: '/ai/predict-maintenance',
    aiPrompt: 'Predict maintenance requirements',
    columns: ['vehicle_name', 'type', 'priority', 'cost_estimate', 'scheduled_date', 'status'],
    columnLabels: ['Vehicle', 'Type', 'Priority', 'Cost ($)', 'Scheduled', 'Status'],
    fields: [
      { key: 'vehicle_id', label: 'Vehicle ID', type: 'number' },
      { key: 'vehicle_name', label: 'Vehicle Name', type: 'text', required: true },
      { key: 'type', label: 'Maintenance Type', type: 'text' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'scheduled_date', label: 'Scheduled Date', type: 'date' },
      { key: 'cost_estimate', label: 'Cost Estimate ($)', type: 'number', step: '0.01' },
      { key: 'status', label: 'Status', type: 'select', options: ['scheduled', 'in_progress', 'completed', 'cancelled'] },
    ],
    statusField: 'status',
    severityField: 'priority',
  },
  weather: {
    endpoint: '/weather',
    aiEndpoint: '/ai/analyze-weather',
    aiPrompt: 'Analyze weather impact on operations',
    columns: ['type', 'severity', 'location', 'temperature', 'road_condition', 'status'],
    columnLabels: ['Type', 'Severity', 'Location', 'Temp (C)', 'Road', 'Status'],
    fields: [
      { key: 'type', label: 'Weather Type', type: 'select', options: ['Heavy Rain', 'Ice Storm', 'Fog', 'Snow', 'High Wind', 'Heat Wave', 'Thunderstorm', 'Flooding', 'Clear', 'Tornado Watch'], required: true },
      { key: 'severity', label: 'Severity', type: 'select', options: ['low', 'moderate', 'high', 'critical'] },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'temperature', label: 'Temperature (C)', type: 'number', step: '0.1' },
      { key: 'wind_speed', label: 'Wind Speed (mph)', type: 'number', step: '0.1' },
      { key: 'visibility', label: 'Visibility (km)', type: 'number', step: '0.1' },
      { key: 'road_condition', label: 'Road Condition', type: 'select', options: ['dry', 'wet', 'icy', 'snowy', 'flooded', 'sandy', 'frozen', 'damp'] },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'expired', 'monitoring'] },
    ],
    statusField: 'status',
    severityField: 'severity',
  },
  compliance: {
    endpoint: '/compliance',
    aiEndpoint: '/ai/check-compliance',
    aiPrompt: 'Check regulatory compliance',
    columns: ['title', 'category', 'driver_name', 'regulation', 'compliance_score', 'status'],
    columnLabels: ['Title', 'Category', 'Driver', 'Regulation', 'Score', 'Status'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['HOS', 'DVIR', 'Drug Testing', 'Licensing', 'Electronic Logging', 'Hazmat', 'Training', 'Vehicle Weight', 'Insurance', 'Environmental', 'Safety Equipment', 'Personnel', 'Medical', 'Reporting'] },
      { key: 'driver_id', label: 'Driver ID', type: 'number' },
      { key: 'driver_name', label: 'Driver Name', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'regulation', label: 'Regulation', type: 'text' },
      { key: 'compliance_score', label: 'Score (0-100)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['compliant', 'warning', 'non_compliant'] },
    ],
    statusField: 'status',
  },
  threats: {
    endpoint: '/threats',
    aiEndpoint: '/ai/assess-threat',
    aiPrompt: 'Assess security threat level',
    columns: ['title', 'threat_type', 'risk_level', 'location', 'status', 'created_at'],
    columnLabels: ['Title', 'Type', 'Risk', 'Location', 'Status', 'Date'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'threat_type', label: 'Threat Type', type: 'select', options: ['Criminal', 'Infrastructure', 'Cyber', 'Civil', 'Road Work', 'Supply Chain', 'Natural', 'Technical', 'Regulatory', 'Hazmat', 'Security'] },
      { key: 'risk_level', label: 'Risk Level', type: 'select', options: ['low', 'medium', 'high', 'critical'] },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'affected_routes', label: 'Affected Routes', type: 'text' },
      { key: 'recommended_action', label: 'Recommended Action', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'monitoring', 'investigating', 'resolved'] },
    ],
    statusField: 'status',
    severityField: 'risk_level',
  },
  tracking: {
    endpoint: '/tracking',
    aiEndpoint: '/ai/general-analysis',
    aiPrompt: 'Analyze GPS tracking data',
    columns: ['vehicle_name', 'driver_name', 'latitude', 'longitude', 'speed', 'status'],
    columnLabels: ['Vehicle', 'Driver', 'Latitude', 'Longitude', 'Speed', 'Status'],
    fields: [
      { key: 'vehicle_id', label: 'Vehicle ID', type: 'number' },
      { key: 'vehicle_name', label: 'Vehicle Name', type: 'text', required: true },
      { key: 'driver_name', label: 'Driver Name', type: 'text' },
      { key: 'latitude', label: 'Latitude', type: 'number', step: '0.000001' },
      { key: 'longitude', label: 'Longitude', type: 'number', step: '0.000001' },
      { key: 'speed', label: 'Speed (mph)', type: 'number', step: '0.1' },
      { key: 'heading', label: 'Heading', type: 'number', step: '0.1' },
      { key: 'status', label: 'Status', type: 'select', options: ['moving', 'stopped', 'idle', 'offline'] },
    ],
    statusField: 'status',
  },
  fatigue: {
    endpoint: '/fatigue',
    aiEndpoint: '/ai/analyze-fatigue',
    aiPrompt: 'Analyze driver fatigue risk',
    columns: ['driver_name', 'fatigue_level', 'hours_driven', 'alert_type', 'status', 'detected_at'],
    columnLabels: ['Driver', 'Fatigue Level', 'Hours Driven', 'Alert', 'Status', 'Detected'],
    fields: [
      { key: 'driver_id', label: 'Driver ID', type: 'number' },
      { key: 'driver_name', label: 'Driver Name', type: 'text', required: true },
      { key: 'fatigue_level', label: 'Fatigue Level', type: 'select', options: ['low', 'moderate', 'high', 'critical'] },
      { key: 'hours_driven', label: 'Hours Driven', type: 'number', step: '0.1' },
      { key: 'last_rest', label: 'Last Rest Time', type: 'datetime-local' },
      { key: 'alert_type', label: 'Alert Type', type: 'select', options: ['info', 'warning', 'critical', 'emergency'] },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['active', 'resolved', 'monitoring'] },
    ],
    statusField: 'status',
    severityField: 'fatigue_level',
  },
  speed: {
    endpoint: '/speed',
    aiEndpoint: '/ai/general-analysis',
    aiPrompt: 'Analyze speed violation patterns',
    columns: ['driver_name', 'speed_recorded', 'speed_limit', 'location', 'severity', 'status'],
    columnLabels: ['Driver', 'Recorded', 'Limit', 'Location', 'Severity', 'Status'],
    fields: [
      { key: 'driver_id', label: 'Driver ID', type: 'number' },
      { key: 'driver_name', label: 'Driver Name', type: 'text', required: true },
      { key: 'vehicle_id', label: 'Vehicle ID', type: 'number' },
      { key: 'speed_recorded', label: 'Speed Recorded', type: 'number', step: '0.1' },
      { key: 'speed_limit', label: 'Speed Limit', type: 'number', step: '0.1' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'severity', label: 'Severity', type: 'select', options: ['low', 'moderate', 'high', 'critical'] },
      { key: 'status', label: 'Status', type: 'select', options: ['pending', 'reviewed', 'dismissed', 'enforced'] },
    ],
    statusField: 'status',
    severityField: 'severity',
  },
  communications: {
    endpoint: '/communications',
    aiEndpoint: '/ai/general-analysis',
    aiPrompt: 'Analyze communication patterns',
    columns: ['sender', 'recipient', 'channel', 'subject', 'priority', 'status'],
    columnLabels: ['Sender', 'Recipient', 'Channel', 'Subject', 'Priority', 'Status'],
    fields: [
      { key: 'sender', label: 'Sender', type: 'text', required: true },
      { key: 'recipient', label: 'Recipient', type: 'text', required: true },
      { key: 'channel', label: 'Channel', type: 'select', options: ['radio', 'phone', 'email', 'app', 'broadcast'] },
      { key: 'subject', label: 'Subject', type: 'text' },
      { key: 'message', label: 'Message', type: 'textarea' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['normal', 'high', 'urgent'] },
      { key: 'status', label: 'Status', type: 'select', options: ['sent', 'delivered', 'read', 'failed'] },
    ],
    statusField: 'status',
    severityField: 'priority',
  },
};

function getBadgeClass(value) {
  if (!value) return 'badge-gray';
  const v = String(value).toLowerCase();
  if (['active', 'compliant', 'low', 'resolved', 'delivered', 'read', 'completed', 'smooth driving', 'exemplary', 'info', 'moving', 'clear', 'dismissed'].includes(v)) return 'badge-green';
  if (['critical', 'emergency', 'reckless driving', 'non_compliant', 'failed'].includes(v)) return 'badge-red';
  if (['high', 'urgent', 'responding', 'investigating', 'in_progress', 'pending'].includes(v)) return 'badge-yellow';
  if (['medium', 'moderate', 'warning', 'on_route', 'monitoring', 'scheduled', 'reviewed'].includes(v)) return 'badge-blue';
  if (['off_duty', 'suspended', 'restricted', 'offline', 'cancelled', 'idle', 'inactive', 'maintenance', 'expired', 'stopped', 'closed'].includes(v)) return 'badge-purple';
  return 'badge-cyan';
}

function formatValue(val) {
  if (val === null || val === undefined) return '-';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T/)) {
    return new Date(val).toLocaleString();
  }
  if (typeof val === 'number' && !Number.isInteger(val)) return val.toFixed(2);
  return String(val);
}

function renderAIContent(text) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('### ')) return <h3 key={i}>{line.replace('### ', '')}</h3>;
    if (line.startsWith('## ')) return <h2 key={i}>{line.replace('## ', '')}</h2>;
    if (line.startsWith('# ')) return <h1 key={i}>{line.replace('# ', '')}</h1>;
    if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i}>{parseBold(line.replace(/^[-*] /, ''))}</li>;
    if (line.match(/^\d+\./)) return <li key={i}>{parseBold(line.replace(/^\d+\.\s*/, ''))}</li>;
    if (line.startsWith('**') && line.endsWith('**')) return <h3 key={i}>{line.replace(/\*\*/g, '')}</h3>;
    if (line.trim() === '') return <br key={i} />;
    return <p key={i}>{parseBold(line)}</p>;
  });
}

function parseBold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function FeaturePage({ feature, title }) {
  const config = featureConfig[feature];
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await api.get(config.endpoint);
      setData(res.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [config.endpoint]);

  useEffect(() => {
    fetchData();
    setSelected(null);
    setShowForm(false);
    setEditItem(null);
    setAiResult(null);
  }, [feature, fetchData]);

  const handleRowClick = async (item) => {
    try {
      const res = await api.get(`${config.endpoint}/${item.id}`);
      setSelected(res.data);
      setAiResult(null);
    } catch {
      setSelected(item);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`${config.endpoint}/${id}`);
      setSelected(null);
      fetchData();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
    const fd = {};
    config.fields.forEach(f => {
      let val = item[f.key];
      if (f.type === 'datetime-local' && val) {
        val = new Date(val).toISOString().slice(0, 16);
      } else if (f.type === 'date' && val) {
        val = new Date(val).toISOString().slice(0, 10);
      }
      fd[f.key] = val || '';
    });
    setFormData(fd);
    setShowForm(true);
    setSelected(null);
  };

  const handleNew = () => {
    setEditItem(null);
    const fd = {};
    config.fields.forEach(f => { fd[f.key] = ''; });
    setFormData(fd);
    setShowForm(true);
    setSelected(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`${config.endpoint}/${editItem.id}`, formData);
      } else {
        await api.post(config.endpoint, formData);
      }
      setShowForm(false);
      setEditItem(null);
      fetchData();
    } catch (err) {
      alert('Save failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAIAnalysis = async (item) => {
    setAiLoading(true);
    setAiResult(null);
    try {
      const payload = feature === 'passengers' || feature === 'tracking' || feature === 'speed' || feature === 'communications'
        ? { prompt: config.aiPrompt, context: item }
        : item;
      const res = await api.post(config.aiEndpoint, payload);
      setAiResult(res.data);
    } catch (err) {
      setAiResult({ analysis: 'AI analysis request failed. Please check your OpenRouter API key in the .env file.' });
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{data.length} records found</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-blue" onClick={handleNew}>+ New Item</button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              {config.columnLabels.map((label, i) => <th key={i}>{label}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.id} onClick={() => handleRowClick(item)}>
                <td>{idx + 1}</td>
                {config.columns.map((col, i) => (
                  <td key={i}>
                    {col === config.statusField || col === config.severityField || col === 'severity' || col === 'priority' || col === 'risk_level' || col === 'fatigue_level' || col === 'alert_type' ? (
                      <span className={`badge ${getBadgeClass(item[col])}`}>{formatValue(item[col])}</span>
                    ) : (
                      formatValue(item[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={config.columns.length + 1} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No records found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Record Details #{selected.id}</h2>
            {Object.entries(selected).filter(([k]) => k !== 'id').map(([key, value]) => (
              <div className="detail-row" key={key}>
                <span className="detail-label">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                <span className="detail-value">
                  {key === config.statusField || key === config.severityField || key === 'severity' || key === 'priority' || key === 'risk_level' || key === 'fatigue_level' || key === 'status' ? (
                    <span className={`badge ${getBadgeClass(value)}`}>{formatValue(value)}</span>
                  ) : formatValue(value)}
                </span>
              </div>
            ))}

            {/* AI Analysis Section */}
            <div style={{ marginTop: 20 }}>
              <button className="btn btn-blue" onClick={() => handleAIAnalysis(selected)} disabled={aiLoading} style={{ width: '100%' }}>
                {aiLoading ? 'Analyzing...' : `AI Analysis - ${config.aiPrompt}`}
              </button>
            </div>

            {aiLoading && (
              <div className="ai-loading">
                <div className="spinner"></div>
                <span>AI is analyzing this data...</span>
              </div>
            )}

            {aiResult && (
              <div className="ai-analysis">
                <div className="ai-header">
                  <span className="ai-badge">AI ANALYSIS</span>
                  {aiResult.model && <span className="ai-model">Model: {aiResult.model}</span>}
                  {aiResult.usage && <span className="ai-model">Tokens: {aiResult.usage.total_tokens}</span>}
                </div>
                <div className="ai-content">
                  {renderAIContent(aiResult.analysis)}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-blue" onClick={() => handleEdit(selected)}>Edit</button>
              <button className="btn btn-red" onClick={() => handleDelete(selected.id)}>Delete</button>
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editItem ? 'Edit Record' : 'New Record'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {config.fields.map(field => (
                  <div className={`form-group ${field.type === 'textarea' ? 'full-width' : ''}`} key={field.key}>
                    <label>{field.label} {field.required && '*'}</label>
                    {field.type === 'select' ? (
                      <select
                        className="form-input"
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        required={field.required}
                      >
                        <option value="">Select...</option>
                        {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        className="form-input"
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        required={field.required}
                      />
                    ) : (
                      <input
                        className="form-input"
                        type={field.type}
                        step={field.step}
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        required={field.required}
                      />
                    )}
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
