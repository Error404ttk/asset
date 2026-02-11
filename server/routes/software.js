const express = require('express');
const router = express.Router();
const db = require('../db');

// Initialize software_import table
const initTable = async () => {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS software_import (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255),
        category VARCHAR(100),
        license_type VARCHAR(100),
        version VARCHAR(100),
        vendor VARCHAR(255),
        installation_count INT DEFAULT 0,
        license_count INT DEFAULT 0,
        expiry_date DATE,
        cost DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        department VARCHAR(255),
        fiscal_year VARCHAR(10),
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

    try {
        await db.query(createTableQuery);
        console.log('✅ Software Imports table ready');
    } catch (err) {
        console.error('Error creating software_import table:', err);
    }
};

initTable();

// GET all software imports
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM software_import ORDER BY imported_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST bulk import software from CSV
router.post('/import', async (req, res) => {
    try {
        const { data } = req.body;
        if (!data || !Array.isArray(data)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        const insertPromises = data.map(item => {
            return db.query(
                `INSERT INTO software_import 
                (name, category, license_type, version, vendor, installation_count, 
                license_count, expiry_date, cost, notes, department, fiscal_year, computer_name, ip_address) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    item.name || '',
                    item.category || '',
                    item.license_type || '',
                    item.version || '',
                    item.vendor || '',
                    parseInt(item.installation_count) || 0,
                    parseInt(item.license_count) || 0,
                    item.expiry_date || null,
                    parseFloat(item.cost) || 0,
                    item.notes || '',
                    item.department || '',
                    item.fiscal_year || '',
                    item.computer_name || '',
                    item.ip_address || ''
                ]
            );
        });

        await Promise.all(insertPromises);
        res.json({ message: `Imported ${data.length} software records successfully` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE bulk software records (MUST come before /:id route)
router.delete('/delete-bulk', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'No IDs provided' });
        }

        const placeholders = ids.map(() => '?').join(',');
        await db.query(`DELETE FROM software_import WHERE id IN (${placeholders})`, ids);
        res.json({ message: `Deleted ${ids.length} records` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE all software records (MUST come before /:id route)
router.delete('/all', async (req, res) => {
    try {
        await db.query('DELETE FROM software_import');
        res.json({ message: 'All records deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE single software record
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM software_import WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
