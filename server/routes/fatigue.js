const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fatigue_records ORDER BY detected_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fatigue_records WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { driver_id, driver_name, fatigue_level, hours_driven, last_rest, alert_type, description, status } = req.body;
    const result = await pool.query(
      `INSERT INTO fatigue_records (driver_id, driver_name, fatigue_level, hours_driven, last_rest, alert_type, description, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [driver_id, driver_name, fatigue_level || 'moderate', hours_driven || 0, last_rest, alert_type || 'warning', description, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { driver_id, driver_name, fatigue_level, hours_driven, last_rest, alert_type, description, status } = req.body;
    const result = await pool.query(
      `UPDATE fatigue_records SET driver_id=$1, driver_name=$2, fatigue_level=$3, hours_driven=$4, last_rest=$5, alert_type=$6, description=$7, status=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [driver_id, driver_name, fatigue_level, hours_driven, last_rest, alert_type, description, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM fatigue_records WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
