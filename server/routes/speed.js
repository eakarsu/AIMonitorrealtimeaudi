const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM speed_violations ORDER BY recorded_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM speed_violations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { driver_id, driver_name, vehicle_id, speed_recorded, speed_limit, location, severity, status } = req.body;
    const result = await pool.query(
      `INSERT INTO speed_violations (driver_id, driver_name, vehicle_id, speed_recorded, speed_limit, location, severity, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [driver_id, driver_name, vehicle_id, speed_recorded, speed_limit, location, severity || 'moderate', status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { driver_id, driver_name, vehicle_id, speed_recorded, speed_limit, location, severity, status } = req.body;
    const result = await pool.query(
      `UPDATE speed_violations SET driver_id=$1, driver_name=$2, vehicle_id=$3, speed_recorded=$4, speed_limit=$5, location=$6, severity=$7, status=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [driver_id, driver_name, vehicle_id, speed_recorded, speed_limit, location, severity, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM speed_violations WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
