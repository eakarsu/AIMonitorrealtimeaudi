const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.SERVER_PORT || 4000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/routes', require('./routes/safeRoutes'));
app.use('/api/passengers', require('./routes/passengers'));
app.use('/api/emergencies', require('./routes/emergencies'));
app.use('/api/behavior', require('./routes/behavior'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/compliance', require('./routes/compliance'));
app.use('/api/threats', require('./routes/threats'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/fatigue', require('./routes/fatigue'));
app.use('/api/speed', require('./routes/speed'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚛 Transport Safety API running on port ${PORT}`);
});
