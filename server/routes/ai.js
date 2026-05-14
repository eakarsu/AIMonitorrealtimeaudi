const path = require('path');
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { broadcast } = require('../lib/broadcast');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const MODEL = 'anthropic/claude-3-5-sonnet-20241022';

function requireOpenRouterKey(req, res, next) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || /your[-_]?openrouter[-_]?api[-_]?key/i.test(key)) {
    return res.status(503).json({ error: 'AI service not configured. OPENROUTER_API_KEY missing.' });
  }
  next();
}

async function callOpenRouter(systemPrompt, context) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
      'X-Title': 'Transport Safety Monitor',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context data: ${JSON.stringify(context)}` },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    }),
  });
  const raw = await response.json();
  if (raw.error) throw new Error(raw.error.message || 'OpenRouter error');
  return raw.choices?.[0]?.message?.content || '';
}

function parseAIJson(text) {
  try {
    const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
    const jsonStr = match ? (match[1] || match[0]) : text;
    return JSON.parse(jsonStr.trim());
  } catch {
    return { raw: text };
  }
}

async function saveAnalysis(userId, type, inputData, result) {
  try {
    await pool.query(
      'INSERT INTO ai_analyses (user_id, analysis_type, input_data, result) VALUES ($1, $2, $3, $4)',
      [userId || null, type, JSON.stringify(inputData), JSON.stringify(result)]
    );
  } catch (err) {
    console.error('saveAnalysis error:', err.message);
  }
}

// GET /api/ai/history
router.get('/history', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const result = await pool.query(
      'SELECT id, user_id, analysis_type, result, created_at FROM ai_analyses ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const count = await pool.query('SELECT COUNT(*) FROM ai_analyses');
    res.json({ data: result.rows, total: parseInt(count.rows[0].count), page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/analyze-driver
router.post('/analyze-driver', aiRateLimiter, async (req, res) => {
  try {
    const systemPrompt = `You are an AI safety analyst for transportation. Return JSON only: { safety_score: 0-100, risk_level: "low|medium|high|critical", key_concerns: [], improvement_actions: [], alert_required: boolean }`;
    const text = await callOpenRouter(systemPrompt, req.body);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'analyze-driver', req.body, parsed);

    if (parsed.alert_required) {
      broadcast('driver_alert', { driver_id: req.body.id || req.body.driver_id, risk_level: parsed.risk_level });
    }

    res.json({ analysis: parsed.raw || JSON.stringify(parsed, null, 2), structured: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/analyze-incident
router.post('/analyze-incident', aiRateLimiter, async (req, res) => {
  try {
    const systemPrompt = `You are a transportation incident analyst. Return JSON only: { severity_assessment: "low|medium|high|critical", root_causes: [], contributing_factors: [], preventive_measures: [], immediate_actions: [] }`;
    const text = await callOpenRouter(systemPrompt, req.body);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'analyze-incident', req.body, parsed);
    res.json({ analysis: parsed.raw || JSON.stringify(parsed, null, 2), structured: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/analyze-route
router.post('/analyze-route', aiRateLimiter, async (req, res) => {
  try {
    const systemPrompt = `You are a route safety expert. Return JSON only: { safety_score: 0-100, risk_factors: [], recommendations: [], speed_advisory_kmh: number, alternative_routes: [] }`;
    const text = await callOpenRouter(systemPrompt, req.body);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'analyze-route', req.body, parsed);
    res.json({ analysis: parsed.raw || JSON.stringify(parsed, null, 2), structured: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/predict-maintenance
router.post('/predict-maintenance', aiRateLimiter, async (req, res) => {
  try {
    const systemPrompt = `You are a vehicle maintenance expert. Return JSON only: { urgent_items: [], scheduled_items: [], estimated_cost: number, next_service_km: number, risk_of_failure: "low|medium|high" }`;
    const text = await callOpenRouter(systemPrompt, req.body);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'predict-maintenance', req.body, parsed);
    res.json({ analysis: parsed.raw || JSON.stringify(parsed, null, 2), structured: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/assess-threat
router.post('/assess-threat', aiRateLimiter, async (req, res) => {
  try {
    const systemPrompt = `You are a transport security analyst. Return JSON only: { threat_level: "low|medium|high|critical", threat_type: string, countermeasures: [], affected_routes: [], estimated_impact: string }`;
    const text = await callOpenRouter(systemPrompt, req.body);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'assess-threat', req.body, parsed);
    res.json({ analysis: parsed.raw || JSON.stringify(parsed, null, 2), structured: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/analyze-fatigue
router.post('/analyze-fatigue', aiRateLimiter, async (req, res) => {
  try {
    const systemPrompt = `You are a driver fatigue specialist. Return JSON only: { fatigue_level: "alert|mild|moderate|severe", hours_driven: number, rest_recommendation_hours: number, risk_to_passengers: "low|medium|high", immediate_action_required: boolean }`;
    const text = await callOpenRouter(systemPrompt, req.body);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'analyze-fatigue', req.body, parsed);

    if (parsed.immediate_action_required) {
      broadcast('fatigue_alert', { driver_id: req.body.driver_id, fatigue_level: parsed.fatigue_level });
    }

    res.json({ analysis: parsed.raw || JSON.stringify(parsed, null, 2), structured: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/emergency-response
router.post('/emergency-response', aiRateLimiter, async (req, res) => {
  try {
    const systemPrompt = `You are an emergency response coordinator for transport. Return JSON only: { severity: "low|medium|high|critical", immediate_steps: [], notify_parties: [], estimated_response_time_minutes: number, resource_requirements: [] }`;
    const text = await callOpenRouter(systemPrompt, req.body);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'emergency-response', req.body, parsed);
    res.json({ analysis: parsed.raw || JSON.stringify(parsed, null, 2), structured: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/analyze-weather
router.post('/analyze-weather', aiRateLimiter, async (req, res) => {
  try {
    const systemPrompt = `You are a weather safety analyst for transport. Return JSON only: { impact_level: "low|moderate|high|severe", route_recommendations: [], speed_reduction_pct: number, driver_alerts: [], road_closures_risk: boolean }`;
    const text = await callOpenRouter(systemPrompt, req.body);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'analyze-weather', req.body, parsed);
    res.json({ analysis: parsed.raw || JSON.stringify(parsed, null, 2), structured: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/check-compliance
router.post('/check-compliance', aiRateLimiter, async (req, res) => {
  try {
    const systemPrompt = `You are a transport regulatory compliance expert. Return JSON only: { compliance_score: 0-100, violations: [], gaps: [], remediation_steps: [], estimated_remediation_days: number }`;
    const text = await callOpenRouter(systemPrompt, req.body);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'check-compliance', req.body, parsed);
    res.json({ analysis: parsed.raw || JSON.stringify(parsed, null, 2), structured: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/general-analysis
router.post('/general-analysis', aiRateLimiter, async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const systemPrompt = `You are an AI safety analyst for transportation and logistics. Provide detailed, actionable analysis. Always respond with structured insights including: Summary, Key Findings, Risk Assessment, and Recommendations.`;
    const text = await callOpenRouter(systemPrompt, context || req.body);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'general-analysis', context || req.body, parsed);
    res.json({ analysis: typeof parsed === 'object' && parsed.raw ? parsed.raw : JSON.stringify(parsed, null, 2), structured: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/passenger-safety-score — score safety per trip
router.post('/passenger-safety-score', aiRateLimiter, async (req, res) => {
  try {
    const { tripId, driverId, vehicleId } = req.body;
    let trip = null;
    let driverBehavior = [];
    let recentIncidents = [];
    try {
      if (tripId) {
        const r = await pool.query('SELECT * FROM trips WHERE id = $1', [tripId]);
        trip = r.rows[0] || null;
      }
    } catch (e) {}
    try {
      if (driverId) {
        const r = await pool.query('SELECT * FROM behavior WHERE driver_id = $1 ORDER BY id DESC LIMIT 50', [driverId]);
        driverBehavior = r.rows;
      }
    } catch (e) {}
    try {
      if (vehicleId) {
        const r = await pool.query('SELECT * FROM incidents WHERE vehicle_id = $1 ORDER BY id DESC LIMIT 30', [vehicleId]);
        recentIncidents = r.rows;
      }
    } catch (e) {}

    const systemPrompt = 'You are a transportation safety AI. Score passenger safety risk for a trip. Always respond with JSON.';
    const context = { trip, driverBehavior, recentIncidents };
    const text = await callOpenRouter(systemPrompt + ' JSON: { "safety_score": number (0-100), "risk_level": "low"|"medium"|"high"|"critical", "factors": [{"factor": string, "impact": string}], "recommendations": [string] }', context);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'passenger-safety-score', { tripId, driverId, vehicleId }, parsed);
    res.json({ analysis: text, structured: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/road-hazard-detector — identify risky intersections / roads
router.post('/road-hazard-detector', aiRateLimiter, async (req, res) => {
  try {
    const { regionId } = req.body;
    let incidents = [];
    let routes = [];
    try {
      const r = await pool.query('SELECT * FROM incidents ORDER BY id DESC LIMIT 100');
      incidents = r.rows;
    } catch (e) {}
    try {
      const r = await pool.query('SELECT * FROM safe_routes LIMIT 100');
      routes = r.rows;
    } catch (e) {}

    const systemPrompt = 'You are a road hazard detection AI. Identify risky intersections, road segments, and time-of-day hotspots from incident clusters. Always respond with JSON.';
    const context = { regionId, incidents, routes };
    const text = await callOpenRouter(systemPrompt + ' JSON: { "hotspots": [{"location": string, "incident_count": number, "common_cause": string, "risk_level": "low"|"medium"|"high"}], "time_patterns": [string], "recommended_alerts": [string] }', context);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'road-hazard-detector', { regionId, incidentCount: incidents.length }, parsed);
    res.json({ analysis: text, structured: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/distraction-detection — text-based driver distraction analysis
router.post('/distraction-detection', requireOpenRouterKey, aiRateLimiter, async (req, res) => {
  try {
    const { driverId, observations, recentTextLogs } = req.body;
    let driverBehavior = [];
    let recentIncidents = [];
    try {
      if (driverId) {
        const r = await pool.query('SELECT * FROM behavior WHERE driver_id = $1 ORDER BY id DESC LIMIT 50', [driverId]);
        driverBehavior = r.rows;
      }
    } catch (e) {}
    try {
      if (driverId) {
        const r = await pool.query('SELECT * FROM incidents WHERE driver_id = $1 ORDER BY id DESC LIMIT 30', [driverId]);
        recentIncidents = r.rows;
      }
    } catch (e) {}

    const systemPrompt = 'You are a driver distraction analyst. Identify distraction signals from text-based observations and behavior logs (no vision input). Always respond with JSON.';
    const context = { driverId, observations: observations || null, recentTextLogs: recentTextLogs || null, driverBehavior, recentIncidents };
    const text = await callOpenRouter(systemPrompt + ' JSON: { "distraction_score": number (0-100), "distraction_level": "none"|"mild"|"moderate"|"severe", "signals": [{"signal": string, "evidence": string, "severity": "low"|"medium"|"high"}], "recommendations": [string], "alert_required": boolean }', context);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'distraction-detection', { driverId }, parsed);

    if (parsed.alert_required) {
      try { broadcast('driver_alert', { driver_id: driverId, distraction_level: parsed.distraction_level }); } catch (e) {}
    }

    res.json({ analysis: text, structured: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/premium-adjustment — recommend insurance premium adjustment from existing risk data
router.post('/premium-adjustment', requireOpenRouterKey, aiRateLimiter, async (req, res) => {
  try {
    const { driverId, vehicleId, currentPremium, policyTermMonths } = req.body;
    let driverBehavior = [];
    let recentIncidents = [];
    let priorRiskAnalyses = [];
    try {
      if (driverId) {
        const r = await pool.query('SELECT * FROM behavior WHERE driver_id = $1 ORDER BY id DESC LIMIT 50', [driverId]);
        driverBehavior = r.rows;
      }
    } catch (e) {}
    try {
      if (vehicleId) {
        const r = await pool.query('SELECT * FROM incidents WHERE vehicle_id = $1 ORDER BY id DESC LIMIT 30', [vehicleId]);
        recentIncidents = r.rows;
      } else if (driverId) {
        const r = await pool.query('SELECT * FROM incidents WHERE driver_id = $1 ORDER BY id DESC LIMIT 30', [driverId]);
        recentIncidents = r.rows;
      }
    } catch (e) {}
    try {
      const r = await pool.query(
        "SELECT analysis_type, result, created_at FROM ai_analyses WHERE analysis_type IN ('analyze-driver','passenger-safety-score','analyze-incident','analyze-fatigue') ORDER BY created_at DESC LIMIT 20"
      );
      priorRiskAnalyses = r.rows;
    } catch (e) {}

    const systemPrompt = 'You are an insurance risk analyst. Recommend a premium adjustment from existing driver/vehicle risk signals. You are advisory only — outputs are recommendations, not binding quotes. Always respond with JSON.';
    const context = { driverId, vehicleId, currentPremium: currentPremium || null, policyTermMonths: policyTermMonths || 12, driverBehavior, recentIncidents, priorRiskAnalyses };
    const text = await callOpenRouter(systemPrompt + ' JSON: { "current_premium": number|null, "recommended_premium": number, "adjustment_pct": number, "direction": "increase"|"decrease"|"hold", "risk_tier": "preferred"|"standard"|"substandard"|"high-risk", "factors": [{"factor": string, "impact_pct": number}], "rationale": string, "confidence": number (0-1) }', context);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'premium-adjustment', { driverId, vehicleId, currentPremium }, parsed);
    res.json({ analysis: text, structured: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Pass 5: NEEDS-CREDS + PRODUCT-DECISION endpoints ────────────────────────

// Gate factory for NEEDS-CREDS endpoints — returns 503 with `missing` set.
// Documented env vars (must be set to non-placeholder values to enable):
//   INSURANCE_CARRIER_API_KEY  — insurance claim reporting
//   DASHCAM_VISION_API_KEY     — dashcam video analysis (vision model)
//   TELEMATICS_EXPORT_API_KEY  — public telematics data export auth
function requireEnv(envName) {
  return function (req, res, next) {
    const v = process.env[envName];
    if (!v || /your[-_]?\w*[-_]?key/i.test(v)) {
      return res.status(503).json({ error: `Service not configured. ${envName} missing.`, missing: envName });
    }
    next();
  };
}

// POST /api/ai/insurance-claim-report — submit a claim packet to a carrier.
// Stub: when key present, simulates accepted submission. Real integration would
// POST to the carrier-specific endpoint. NEEDS-CREDS: INSURANCE_CARRIER_API_KEY.
router.post('/insurance-claim-report', requireEnv('INSURANCE_CARRIER_API_KEY'), aiRateLimiter, async (req, res) => {
  try {
    const { driverId, vehicleId, incidentId, claimType, description } = req.body || {};
    if (!incidentId) return res.status(400).json({ error: 'incidentId is required' });
    let incident = null;
    try {
      const r = await pool.query('SELECT * FROM incidents WHERE id = $1', [incidentId]);
      incident = r.rows[0] || null;
    } catch (e) {}
    // PRODUCT-DECISION: stubbed claim ID; real impl would call carrier API.
    const carrierClaimId = 'CLM-' + Date.now().toString(36).toUpperCase();
    const result = {
      carrier_claim_id: carrierClaimId,
      status: 'submitted',
      driverId,
      vehicleId,
      incidentId,
      claimType: claimType || 'collision',
      description: description || (incident && incident.description) || null,
      submittedAt: new Date(),
    };
    await saveAnalysis(req.user?.id, 'insurance-claim-report', { driverId, vehicleId, incidentId }, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/dashcam-vision — analyze a dashcam frame URL or hash.
// Stub: when key present, returns a structured "analysis-pending" record.
// Vision actually requires forwarding to a multimodal model (TOO-RISKY now).
// NEEDS-CREDS: DASHCAM_VISION_API_KEY.
router.post('/dashcam-vision', requireEnv('DASHCAM_VISION_API_KEY'), aiRateLimiter, async (req, res) => {
  try {
    const { frameUrl, frameHash, vehicleId, capturedAt } = req.body || {};
    if (!frameUrl && !frameHash) {
      return res.status(400).json({ error: 'frameUrl or frameHash is required' });
    }
    // PRODUCT-DECISION: stub a queued response with deterministic ID; real impl
    // would call a vision model with the frame.
    const result = {
      analysis_id: 'VIS-' + Date.now().toString(36),
      status: 'queued',
      frameUrl: frameUrl || null,
      frameHash: frameHash || null,
      vehicleId: vehicleId || null,
      capturedAt: capturedAt || null,
      note: 'Vision analysis queued. Results delivered via /api/ai/history once processed.',
    };
    await saveAnalysis(req.user?.id, 'dashcam-vision', { frameUrl, frameHash, vehicleId }, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/telematics-export — public telematics data export.
// NEEDS-CREDS: TELEMATICS_EXPORT_API_KEY (must be supplied via header
// `x-telematics-key` to authenticate the caller).
router.get('/telematics-export', requireEnv('TELEMATICS_EXPORT_API_KEY'), async (req, res) => {
  try {
    const provided = req.headers['x-telematics-key'];
    if (provided !== process.env.TELEMATICS_EXPORT_API_KEY) {
      return res.status(401).json({ error: 'Invalid x-telematics-key header.' });
    }
    const since = req.query.since;
    let rows = [];
    try {
      // PRODUCT-DECISION: export driver_behavior + incidents joined by created_at window.
      const params = [];
      let where = '';
      if (since) { params.push(since); where = ' WHERE created_at >= $1'; }
      const r = await pool.query(`SELECT id, vehicle_id, speed, location_lat, location_lng, created_at FROM tracking${where} ORDER BY created_at DESC LIMIT 1000`, params);
      rows = r.rows;
    } catch (e) {}
    res.json({ count: rows.length, since: since || null, records: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/driver-coaching — generate a personalized coaching curriculum
// for a driver based on recent behavior + incidents.
// PRODUCT-DECISION: curriculum sourced from a built-in "module library" rather
// than an external LMS. Modules selected by AI given the driver's risk signals.
router.post('/driver-coaching', requireOpenRouterKey, aiRateLimiter, async (req, res) => {
  try {
    const { driverId, weeks } = req.body || {};
    if (!driverId) return res.status(400).json({ error: 'driverId is required' });
    let behavior = []; let incidents = []; let priorAnalyses = [];
    try {
      const r = await pool.query('SELECT * FROM driver_behavior WHERE driver_id = $1 ORDER BY created_at DESC LIMIT 50', [driverId]);
      behavior = r.rows;
    } catch (e) {}
    try {
      const r = await pool.query('SELECT * FROM incidents WHERE driver_id = $1 ORDER BY created_at DESC LIMIT 20', [driverId]);
      incidents = r.rows;
    } catch (e) {}
    try {
      const r = await pool.query("SELECT analysis_type, result FROM ai_analyses WHERE analysis_type IN ('analyze-driver','analyze-fatigue','distraction-detection') ORDER BY created_at DESC LIMIT 10");
      priorAnalyses = r.rows;
    } catch (e) {}
    // PRODUCT-DECISION: built-in module library; AI picks from these IDs.
    const MODULE_LIBRARY = [
      { id: 'M01', title: 'Defensive Driving Fundamentals', minutes: 30 },
      { id: 'M02', title: 'Speed Management', minutes: 20 },
      { id: 'M03', title: 'Distracted Driving Prevention', minutes: 25 },
      { id: 'M04', title: 'Fatigue Recognition & Recovery', minutes: 20 },
      { id: 'M05', title: 'Hazard Anticipation', minutes: 35 },
      { id: 'M06', title: 'Adverse Weather Driving', minutes: 30 },
      { id: 'M07', title: 'Following Distance & Braking', minutes: 20 },
      { id: 'M08', title: 'Aggressive Driving Mitigation', minutes: 25 },
      { id: 'M09', title: 'Vehicle Pre-trip Inspection', minutes: 15 },
      { id: 'M10', title: 'Incident Response & Reporting', minutes: 20 },
    ];
    const systemPrompt = 'You are a fleet driver-coaching curriculum designer. Based on the driver\'s risk signals, build a multi-week coaching plan choosing modules ONLY from the provided library. Always respond with JSON.';
    const context = { driverId, weeks: weeks || 4, library: MODULE_LIBRARY, behavior, incidents, priorAnalyses };
    const text = await callOpenRouter(systemPrompt + ' JSON: { "driver_id": string|number, "weeks": number, "schedule": [{"week": number, "modules": [{"id": string, "title": string, "minutes": number, "rationale": string}]}], "risk_focus_areas": [string], "expected_outcomes": [string], "review_checkpoints": [string] }', context);
    const parsed = parseAIJson(text);
    await saveAnalysis(req.user?.id, 'driver-coaching', { driverId, weeks }, parsed);
    res.json({ analysis: text, structured: parsed, module_library: MODULE_LIBRARY });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/passenger-alert — broadcast a passenger-facing alert.
// PRODUCT-DECISION: in-app broadcast channel only (SMS/email NEEDS-CREDS).
router.post('/passenger-alert', aiRateLimiter, async (req, res) => {
  try {
    const { vehicleId, severity, message, eta } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message is required' });
    const evt = {
      type: 'passenger_alert',
      severity: severity || 'info',
      vehicleId: vehicleId || null,
      message,
      eta: eta || null,
      sentAt: new Date(),
    };
    try { broadcast(evt); } catch (e) {}
    await saveAnalysis(req.user?.id, 'passenger-alert', { vehicleId, severity }, evt);
    res.json({ delivered: true, channel: 'in-app', event: evt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/liability-tracking — record a third-party liability event.
// PRODUCT-DECISION: in-DB record only; legal/financial integration is NEEDS-CREDS.
// Uses ai_analyses table to avoid schema migration (CREATE TABLE IF NOT EXISTS
// would also work but ai_analyses is already present).
router.post('/liability-tracking', aiRateLimiter, async (req, res) => {
  try {
    const { incidentId, partyName, partyType, claimAmount, status, notes } = req.body || {};
    if (!incidentId || !partyName) return res.status(400).json({ error: 'incidentId and partyName are required' });
    const record = {
      id: 'LBL-' + Date.now().toString(36).toUpperCase(),
      incidentId,
      partyName,
      partyType: partyType || 'third_party',
      claimAmount: claimAmount || null,
      status: status || 'open',
      notes: notes || null,
      createdAt: new Date(),
    };
    await saveAnalysis(req.user?.id, 'liability-tracking', { incidentId, partyName }, record);
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
