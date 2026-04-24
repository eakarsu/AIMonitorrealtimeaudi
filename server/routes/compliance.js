const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_reports ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM compliance_reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { title, category, driver_id, driver_name, description, regulation, compliance_score, status } = req.body;
    const result = await pool.query(
      `INSERT INTO compliance_reports (title, category, driver_id, driver_name, description, regulation, compliance_score, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, category, driver_id, driver_name, description, regulation, compliance_score || 100, status || 'compliant']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { title, category, driver_id, driver_name, description, regulation, compliance_score, status } = req.body;
    const result = await pool.query(
      `UPDATE compliance_reports SET title=$1, category=$2, driver_id=$3, driver_name=$4, description=$5, regulation=$6, compliance_score=$7, status=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title, category, driver_id, driver_name, description, regulation, compliance_score, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM compliance_reports WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
