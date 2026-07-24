const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('./db');
const { initWebSocket } = require('./lib/broadcast');
const { requireSecret } = require('./config/security');

const app = express();
const PORT = process.env.SERVER_PORT || 4000;

async function initializeRuntime() {
  if (process.env.MIGRATE_ON_START !== 'true') return;
  const email = process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
  const password = process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Runtime admin credentials are required');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'operator',
      created_at TIMESTAMP DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS ai_analyses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      analysis_type VARCHAR(100) NOT NULL,
      input_data JSONB,
      result JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`,
    [process.env.PROVISION_ADMIN_NAME || 'Runtime Administrator', email, passwordHash]
  );
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Auth middleware
const authMiddleware = require('./middleware/auth');

// Routes - auth EXCLUDED from public routes
app.use('/api/auth', require('./routes/auth'));

// Device ingest is separate from user JWT auth but still fail-closed.
function authenticateTelemetryDevice(req,res,next){
  let expected;try{expected=requireSecret('TELEMETRY_INGEST_SECRET');}catch(e){return res.status(503).json({error:'Telemetry ingest is not configured'});}
  const supplied=String(req.get('x-telemetry-key')||'');const a=Buffer.from(supplied),b=Buffer.from(expected);
  if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return res.status(401).json({error:'Invalid telemetry credential'});
  next();
}
app.use('/api/tracking/ingest', authenticateTelemetryDevice, require('./routes/trackingIngest'));

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
app.use('/api/driver-coaching-escalation', authMiddleware, require('./routes/driverCoachingEscalation'));
app.use('/api/transit-safety-workflow', authMiddleware, require('./routes/transitSafetyWorkflow'));

app.use(/^\/api\/(?:gap-|safety-coach-agent|vision-road-hazard|emergency-response-autonomous|insurance-orchestration|passenger-safety-agent)/, (req,res,next) => {
  if (process.env.ENABLE_EXPERIMENTAL_ROUTES === 'true') return next();
  return res.status(501).json({error:'Generated/provider-backed surface is quarantined',required:'ENABLE_EXPERIMENTAL_ROUTES=true plus documented provider configuration'});
});

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

initializeRuntime()
  .then(() => httpServer.listen(PORT, () => console.log(`Transport Safety API running on port ${PORT}`)))
  .catch((error) => {
    console.error('Runtime initialization failed:', error.message);
    process.exit(1);
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
