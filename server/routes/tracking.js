const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gps_tracking ORDER BY timestamp DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM gps_tracking WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { vehicle_id, vehicle_name, driver_name, latitude, longitude, speed, heading, status } = req.body;
    const result = await pool.query(
      `INSERT INTO gps_tracking (vehicle_id, vehicle_name, driver_name, latitude, longitude, speed, heading, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [vehicle_id, vehicle_name, driver_name, latitude, longitude, speed || 0, heading || 0, status || 'moving']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { vehicle_id, vehicle_name, driver_name, latitude, longitude, speed, heading, status } = req.body;
    const result = await pool.query(
      `UPDATE gps_tracking SET vehicle_id=$1, vehicle_name=$2, driver_name=$3, latitude=$4, longitude=$5, speed=$6, heading=$7, status=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [vehicle_id, vehicle_name, driver_name, latitude, longitude, speed, heading, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM gps_tracking WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
