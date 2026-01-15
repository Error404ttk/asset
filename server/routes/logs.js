const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all logs
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM asset_logs ORDER BY timestamp DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
