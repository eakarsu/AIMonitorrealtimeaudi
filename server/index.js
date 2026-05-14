const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('./db');
const { initWebSocket } = require('./lib/broadcast');

const app = express();
const PORT = process.env.SERVER_PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Ensure ai_analyses table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    analysis_type VARCHAR(60),
    input_data JSONB,
    result JSONB,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('ai_analyses table error:', err));

// Auth middleware
const authMiddleware = require('./middleware/auth');

// Routes - auth EXCLUDED from public routes
app.use('/api/auth', require('./routes/auth'));

// IoT endpoint - no auth
app.use('/api/tracking/ingest', require('./routes/trackingIngest'));

// All domain routes - auth required
app.use('/api/drivers', authMiddleware, require('./routes/drivers'));
app.use('/api/vehicles', authMiddleware, require('./routes/vehicles'));
app.use('/api/incidents', authMiddleware, require('./routes/incidents'));
app.use('/api/routes', authMiddleware, require('./routes/safeRoutes'));
app.use('/api/passengers', authMiddleware, require('./routes/passengers'));
app.use('/api/emergencies', authMiddleware, require('./routes/emergencies'));
app.use('/api/behavior', authMiddleware, require('./routes/behavior'));
app.use('/api/maintenance', authMiddleware, require('./routes/maintenance'));
app.use('/api/weather', authMiddleware, require('./routes/weather'));
app.use('/api/compliance', authMiddleware, require('./routes/compliance'));
app.use('/api/threats', authMiddleware, require('./routes/threats'));
app.use('/api/tracking', authMiddleware, require('./routes/tracking'));
app.use('/api/fatigue', authMiddleware, require('./routes/fatigue'));
app.use('/api/speed', authMiddleware, require('./routes/speed'));
app.use('/api/communications', authMiddleware, require('./routes/communications'));
app.use('/api/ai', authMiddleware, require('./routes/ai'));
app.use('/api/dashboard', authMiddleware, require('./routes/dashboard'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

// Create HTTP server and attach WebSocket
const httpServer = http.createServer(app);
initWebSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Transport Safety API running on port ${PORT}`);
});

// === BATCH 05 AUTO-MOUNT (custom feature suggestions) ===
app.use('/api/safety-coach-agent', require('./routes/safety-coach-agent'));
app.use('/api/vision-road-hazard', require('./routes/vision-road-hazard'));
app.use('/api/emergency-response-autonomous', require('./routes/emergency-response-autonomous'));
app.use('/api/insurance-orchestration', require('./routes/insurance-orchestration'));
app.use('/api/passenger-safety-agent', require('./routes/passenger-safety-agent'));

// === Batch 05 Gaps & Frontend Mounts ===
try { const _gap_passenger_safety_score = require('./routes/gap-passenger-safety-score'); app.use('/api/gap-passenger-safety-score', _gap_passenger_safety_score); } catch(e) { console.error('gap mount fail passenger-safety-score:', e.message); }
try { const _gap_distraction_detection = require('./routes/gap-distraction-detection'); app.use('/api/gap-distraction-detection', _gap_distraction_detection); } catch(e) { console.error('gap mount fail distraction-detection:', e.message); }
try { const _gap_road_hazard_detector = require('./routes/gap-road-hazard-detector'); app.use('/api/gap-road-hazard-detector', _gap_road_hazard_detector); } catch(e) { console.error('gap mount fail road-hazard-detector:', e.message); }
try { const _gap_premium_adjustment = require('./routes/gap-premium-adjustment'); app.use('/api/gap-premium-adjustment', _gap_premium_adjustment); } catch(e) { console.error('gap mount fail premium-adjustment:', e.message); }
try { const _gap_insurance = require('./routes/gap-insurance'); app.use('/api/gap-insurance', _gap_insurance); } catch(e) { console.error('gap mount fail insurance:', e.message); }
try { const _gap_driver = require('./routes/gap-driver'); app.use('/api/gap-driver', _gap_driver); } catch(e) { console.error('gap mount fail driver:', e.message); }
try { const _gap_passenger = require('./routes/gap-passenger'); app.use('/api/gap-passenger', _gap_passenger); } catch(e) { console.error('gap mount fail passenger:', e.message); }
try { const _gap_dashcam = require('./routes/gap-dashcam'); app.use('/api/gap-dashcam', _gap_dashcam); } catch(e) { console.error('gap mount fail dashcam:', e.message); }
try { const _gap_third_party = require('./routes/gap-third-party'); app.use('/api/gap-third-party', _gap_third_party); } catch(e) { console.error('gap mount fail third-party:', e.message); }
try { const _gap_public = require('./routes/gap-public'); app.use('/api/gap-public', _gap_public); } catch(e) { console.error('gap mount fail public:', e.message); }
try { const _gap_webhooks = require('./routes/gap-webhooks'); app.use('/api/gap-webhooks', _gap_webhooks); } catch(e) { console.error('gap mount fail webhooks:', e.message); }
try { const _gap_mobile = require('./routes/gap-mobile'); app.use('/api/gap-mobile', _gap_mobile); } catch(e) { console.error('gap mount fail mobile:', e.message); }
// === End Batch 05 Mounts ===
