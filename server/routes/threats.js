const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM threat_assessments ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM threat_assessments WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, threat_type, risk_level, location, description, affected_routes, recommended_action, status } = req.body;
    const result = await pool.query(
      `INSERT INTO threat_assessments (title, threat_type, risk_level, location, description, affected_routes, recommended_action, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, threat_type, risk_level || 'medium', location, description, affected_routes, recommended_action, status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, threat_type, risk_level, location, description, affected_routes, recommended_action, status } = req.body;
    const result = await pool.query(
      `UPDATE threat_assessments SET title=$1, threat_type=$2, risk_level=$3, location=$4, description=$5, affected_routes=$6, recommended_action=$7, status=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title, threat_type, risk_level, location, description, affected_routes, recommended_action, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM threat_assessments WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
