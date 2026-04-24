const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM safe_routes ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM safe_routes WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, origin, destination, distance_km, risk_level, estimated_time, status } = req.body;
    const result = await pool.query(
      `INSERT INTO safe_routes (name, origin, destination, distance_km, risk_level, estimated_time, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, origin, destination, distance_km, risk_level || 'low', estimated_time, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, origin, destination, distance_km, risk_level, estimated_time, status } = req.body;
    const result = await pool.query(
      `UPDATE safe_routes SET name=$1, origin=$2, destination=$3, distance_km=$4, risk_level=$5, estimated_time=$6, status=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [name, origin, destination, distance_km, risk_level, estimated_time, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM safe_routes WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
