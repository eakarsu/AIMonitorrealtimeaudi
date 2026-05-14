const express = require('express');
const router = express.Router();
const pool = require('../db');
const { broadcast } = require('../lib/broadcast');

// POST /api/tracking/ingest - IoT GPS endpoint (no auth)
router.post('/', async (req, res) => {
  try {
    const { vehicle_id, latitude, longitude, speed_kmh, timestamp } = req.body;
    if (!vehicle_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'vehicle_id, latitude, and longitude are required' });
    }

    // Insert GPS tracking record
    const insertResult = await pool.query(
      `INSERT INTO gps_tracking (vehicle_id, latitude, longitude, speed, status, timestamp)
       VALUES ($1, $2, $3, $4, 'moving', $5) RETURNING *`,
      [vehicle_id, latitude, longitude, speed_kmh || 0, timestamp || new Date()]
    ).catch(async () => {
      // Fallback without timestamp column
      return pool.query(
        `INSERT INTO gps_tracking (vehicle_id, latitude, longitude, speed, status)
         VALUES ($1, $2, $3, $4, 'moving') RETURNING *`,
        [vehicle_id, latitude, longitude, speed_kmh || 0]
      );
    });

    let violationCreated = false;

    // Check speed limit from vehicles table
    if (speed_kmh) {
      const vehicleResult = await pool.query(
        'SELECT * FROM vehicles WHERE id = $1 LIMIT 1',
        [vehicle_id]
      ).catch(() => ({ rows: [] }));

      const vehicle = vehicleResult.rows[0];
      const speedLimit = vehicle?.speed_limit || 120; // default 120 km/h

      if (parseFloat(speed_kmh) > speedLimit) {
        await pool.query(
          `INSERT INTO speed_violations (vehicle_id, speed_recorded, speed_limit, severity, status, location)
           VALUES ($1, $2, $3, $4, 'pending', $5)`,
          [
            vehicle_id,
            speed_kmh,
            speedLimit,
            speed_kmh > speedLimit * 1.2 ? 'critical' : speed_kmh > speedLimit * 1.1 ? 'high' : 'moderate',
            `Lat: ${latitude}, Lng: ${longitude}`,
          ]
        ).catch(() => {});
        violationCreated = true;

        broadcast('speed_violation', { vehicle_id, speed_kmh, speed_limit: speedLimit, latitude, longitude });
      }
    }

    res.json({ received: true, violation_created: violationCreated });
  } catch (err) {
    console.error('GPS ingest error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
