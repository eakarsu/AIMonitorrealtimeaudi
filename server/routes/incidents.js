const express = require('express');
const router = express.Router();
const pool = require('../db');
const { broadcast } = require('../lib/broadcast');

router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    if (req.query.page) {
      const result = await pool.query('SELECT * FROM incidents ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
      const count = await pool.query('SELECT COUNT(*) FROM incidents');
      return res.json({ data: result.rows, total: parseInt(count.rows[0].count), page, limit });
    }
    const result = await pool.query('SELECT * FROM incidents ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM incidents WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { type, severity, description, location, driver_id, vehicle_id, status } = req.body;
    if (!type) return res.status(400).json({ error: 'type is required' });
    const result = await pool.query(
      `INSERT INTO incidents (type, severity, description, location, driver_id, vehicle_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [type, severity || 'medium', description, location, driver_id, vehicle_id, status || 'open']
    );
    const incident = result.rows[0];

    // Auto-incident workflow for high severity
    if (severity === 'high' || severity === 'critical') {
      broadcast('high_severity_incident', { id: incident.id, driver_id: incident.driver_id, severity: incident.severity, type: incident.type });

      // Auto-create compliance report
      pool.query(
        `INSERT INTO compliance_reports (title, category, description, status) VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [`Auto: Incident #${incident.id} - ${type}`, 'Incident Report', `Auto-generated compliance record for ${severity} severity incident: ${description || type}`, 'pending']
      ).catch(() => {
        pool.query(
          `INSERT INTO compliance_reports (title, category, description, status) VALUES ($1, $2, $3, $4)`,
          [`Auto: Incident #${incident.id} - ${type}`, 'Incident Report', `Auto-generated for ${severity} incident`, 'pending']
        ).catch(() => {});
      });
    }

    res.status(201).json(incident);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { type, severity, description, location, driver_id, vehicle_id, status } = req.body;
    const result = await pool.query(
      `UPDATE incidents SET type=$1, severity=$2, description=$3, location=$4, driver_id=$5, vehicle_id=$6, status=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [type, severity, description, location, driver_id, vehicle_id, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM incidents WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
