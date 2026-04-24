const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/stats', async (req, res) => {
  try {
    const [drivers, vehicles, incidents, emergencies, routes, passengers] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM drivers'),
      pool.query('SELECT COUNT(*) as count FROM vehicles'),
      pool.query('SELECT COUNT(*) as count FROM incidents WHERE status = $1', ['open']),
      pool.query('SELECT COUNT(*) as count FROM emergencies WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*) as count FROM safe_routes WHERE status = $1', ['active']),
      pool.query('SELECT COUNT(*) as count FROM passengers WHERE status = $1', ['active']),
    ]);

    res.json({
      total_drivers: parseInt(drivers.rows[0].count),
      total_vehicles: parseInt(vehicles.rows[0].count),
      active_incidents: parseInt(incidents.rows[0].count),
      active_emergencies: parseInt(emergencies.rows[0].count),
      active_routes: parseInt(routes.rows[0].count),
      active_passengers: parseInt(passengers.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
