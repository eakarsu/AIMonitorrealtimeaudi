const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    if (req.query.page) {
      const result = await pool.query('SELECT * FROM drivers ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
      const count = await pool.query('SELECT COUNT(*) FROM drivers');
      return res.json({ data: result.rows, total: parseInt(count.rows[0].count), page, limit });
    }
    const result = await pool.query('SELECT * FROM drivers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, license_number, phone, status, rating, vehicle_id, experience_years, last_active } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const result = await pool.query(
      `INSERT INTO drivers (name, license_number, phone, status, rating, vehicle_id, experience_years, last_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, license_number, phone, status || 'active', rating || 5.0, vehicle_id, experience_years || 0, last_active || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, license_number, phone, status, rating, vehicle_id, experience_years } = req.body;
    const result = await pool.query(
      `UPDATE drivers SET name=$1, license_number=$2, phone=$3, status=$4, rating=$5, vehicle_id=$6, experience_years=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [name, license_number, phone, status, rating, vehicle_id, experience_years, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM drivers WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
