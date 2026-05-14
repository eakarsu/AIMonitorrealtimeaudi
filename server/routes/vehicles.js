const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    if (req.query.page) {
      const result = await pool.query('SELECT * FROM vehicles ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
      const count = await pool.query('SELECT COUNT(*) FROM vehicles');
      return res.json({ data: result.rows, total: parseInt(count.rows[0].count), page, limit });
    }
    const result = await pool.query('SELECT * FROM vehicles ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST requires plate_number


router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { plate_number, model, type, status, mileage, last_inspection, fuel_level, gps_enabled } = req.body;
    const result = await pool.query(
      `INSERT INTO vehicles (plate_number, model, type, status, mileage, last_inspection, fuel_level, gps_enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [plate_number, model, type, status || 'active', mileage || 0, last_inspection || new Date(), fuel_level || 100, gps_enabled !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { plate_number, model, type, status, mileage, last_inspection, fuel_level, gps_enabled } = req.body;
    const result = await pool.query(
      `UPDATE vehicles SET plate_number=$1, model=$2, type=$3, status=$4, mileage=$5, last_inspection=$6, fuel_level=$7, gps_enabled=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [plate_number, model, type, status, mileage, last_inspection, fuel_level, gps_enabled, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM vehicles WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
