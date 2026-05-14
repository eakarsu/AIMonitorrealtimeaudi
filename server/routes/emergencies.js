const express = require('express');
const router = express.Router();
const pool = require('../db');
const { broadcast } = require('../lib/broadcast');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM emergencies ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM emergencies WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { type, priority, description, location, responder, driver_id, vehicle_id, status } = req.body;
    if (!type) return res.status(400).json({ error: 'type is required' });
    const result = await pool.query(
      `INSERT INTO emergencies (type, priority, description, location, responder, driver_id, vehicle_id, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [type, priority || 'high', description, location, responder, driver_id, vehicle_id, status || 'active']
    );
    const emergency = result.rows[0];

    // Broadcast new emergency to all WebSocket clients
    broadcast('new_emergency', { id: emergency.id, priority: emergency.priority, type: emergency.type, location: emergency.location });

    res.status(201).json(emergency);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { type, priority, description, location, responder, driver_id, vehicle_id, status } = req.body;
    const result = await pool.query(
      `UPDATE emergencies SET type=$1, priority=$2, description=$3, location=$4, responder=$5, driver_id=$6, vehicle_id=$7, status=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [type, priority, description, location, responder, driver_id, vehicle_id, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM emergencies WHERE id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
