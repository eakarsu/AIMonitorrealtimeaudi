const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM driver_behavior ORDER BY recorded_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM driver_behavior WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { driver_id, driver_name, event_type, severity, score, description, location } = req.body;
    const result = await pool.query(
      `INSERT INTO driver_behavior (driver_id, driver_name, event_type, severity, score, description, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [driver_id, driver_name, event_type, severity || 'medium', score || 50, description, location]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { driver_id, driver_name, event_type, severity, score, description, location } = req.body;
    const result = await pool.query(
      `UPDATE driver_behavior SET driver_id=$1, driver_name=$2, event_type=$3, severity=$4, score=$5, description=$6, location=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [driver_id, driver_name, event_type, severity, score, description, location, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM driver_behavior WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
