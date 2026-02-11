const express = require('express');
const router = express.Router();
const db = require('../db');

// Initialize Table
const initTable = async () => {
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS hardware_imports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client VARCHAR(255),
        computer_type VARCHAR(100),
        computer_name VARCHAR(255),
        ip_address VARCHAR(50),
        domain VARCHAR(255),
        description TEXT,
        group_name VARCHAR(255),
        agent_version VARCHAR(50),
        last_connect DATETIME,
        platform VARCHAR(100),
        os_name VARCHAR(255),
        system_model VARCHAR(255),
        cpu_1 VARCHAR(255),
        cpu_count INT,
        memory VARCHAR(100),
        disk_info JSON,
        serial_number VARCHAR(255),
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`;

    try {
        await db.query(createTableQuery);
        console.log('✅ Hardware Imports table ready');
    } catch (err) {
        console.error('❌ Error initializing hardware table:', err);
    }
};

// Run initialization
initTable();

// Helper: Parse Date (DD/MM/YYYY or YYYY-MM-DD to YYYY-MM-DD HH:mm:ss)
const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

// GET All Hardware
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM hardware_imports ORDER BY imported_at DESC');
        res.json(rows);
    } catch (err) {
        console.error('❌ Error fetching hardware:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// POST Import CSV Data (Bulk Insert)
router.post('/import', async (req, res) => {
    const data = req.body; // Expect array of objects matching CSV columns
    if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Clear existing data? Or Append? 
        // User said "Registry", implies appending/managing. We will append. 
        // If user wants to replace, they can delete all.

        const query = `
            INSERT INTO hardware_imports 
            (client, computer_type, computer_name, ip_address, domain, description, group_name, 
            agent_version, last_connect, platform, os_name, system_model, 
            cpu_1, cpu_count, memory, disk_info, serial_number) 
            VALUES ?
        `;

        const values = data.map(item => [
            item.Client || '',
            item['Computer type'] || '',
            item.Computer || '',
            item['IP address'] || '',
            item.Domain || '',
            item.Description || '',
            item.Group || '',
            item['Agent version'] || '',
            parseDate(item['Last connect']),
            item.Platform || '',
            item['Operating system'] || '',
            item.System || '',
            item['CPU-1'] || '',
            parseInt(item['CPU-1 Number'] || item['CPU-1 Count'] || 1) || 1,
            item.Memory || '',
            JSON.stringify({
                disk1: { capacity: item['Disk-1 Capacity'], partition: item['Disk-1 Partition'] },
                disk2: { capacity: item['Disk-2 Capacity'], partition: item['Disk-2 Partition'] },
                // Add more if needed based on CSV provided
            }),
            item['BIOS-Serial number'] || ''
        ]);

        await connection.query(query, [values]);
        await connection.commit();

        console.log(`✅ Imported ${data.length} hardware records`);
        res.status(201).json({ message: `Successfully imported ${data.length} records` });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('❌ Import Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

// DELETE Single
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM hardware_imports WHERE id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE Bulk
router.post('/delete-bulk', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });

    try {
        await db.query('DELETE FROM hardware_imports WHERE id IN (?)', [ids]);
        res.json({ message: `Deleted ${ids.length} records` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE All
router.delete('/all', async (req, res) => {
    try {
        await db.query('DELETE FROM hardware_imports');
        res.json({ message: 'All records deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
