const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM weather_alerts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM weather_alerts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { type, severity, location, description, temperature, wind_speed, visibility, road_condition, status } = req.body;
    const result = await pool.query(
      `INSERT INTO weather_alerts (type, severity, location, description, temperature, wind_speed, visibility, road_condition, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [type, severity || 'moderate', location, description, temperature, wind_speed, visibility, road_condition, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { type, severity, location, description, temperature, wind_speed, visibility, road_condition, status } = req.body;
    const result = await pool.query(
      `UPDATE weather_alerts SET type=$1, severity=$2, location=$3, description=$4, temperature=$5, wind_speed=$6, visibility=$7, road_condition=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [type, severity, location, description, temperature, wind_speed, visibility, road_condition, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM weather_alerts WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
