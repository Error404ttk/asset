const express = require('express');
const router = express.Router();
const db = require('../db');

// GET Settings
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM system_settings');
        const settings = {};
        rows.forEach(row => {
            let value = row.setting_value;
            if (typeof value === 'string') {
                try {
                    value = JSON.parse(value);
                } catch (e) {
                    console.error(`Failed to parse setting ${row.setting_key}`, e);
                }
            }
            settings[row.setting_key] = value;
        });

        // Default values to prevent frontend crash
        const finalSettings = {
            agencyName: 'ระบุหน่วยงาน',
            address: '',
            departments: ['สำนักปลัด', 'กองคลัง', 'กองช่าง'],
            commonOS: ['Windows 11', 'Windows 10'],
            commonRam: ['8GB', '16GB'],
            commonStorage: ['256GB SSD', '512GB SSD'],
            commonCpu: ['Intel Core i5', 'Intel Core i7'],
            commonLicenseTypes: ['มีลิขสิทธิ์', 'ไม่มีลิขสิทธิ์'],
            commonAssetNames: [],
            commonBrands: [],
            commonModels: [],
            commonAssetTypes: ['คอมพิวเตอร์', 'จอภาพ', 'เครื่องพิมพ์', 'UPS', 'อุปกรณ์เครือข่าย', 'อื่นๆ'],
            ...settings
        };

        res.json(finalSettings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE Settings
router.put('/', async (req, res) => {
    const settings = req.body;
    const actionUser = settings.actionUser || 'System'; // Extract user before processing

    // Remove actionUser from settings object if it exists so it doesn't get saved as a setting
    const settingsToSave = { ...settings };
    delete settingsToSave.actionUser;

    try {
        const queries = Object.keys(settingsToSave).map(key => {
            return db.query(
                'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [key, JSON.stringify(settingsToSave[key]), JSON.stringify(settingsToSave[key])]
            );
        });

        await Promise.all(queries);

        // Log settings update
        await db.query('INSERT INTO asset_logs (asset_id, action, user, details) VALUES (NULL, ?, ?, ?)',
            ['UPDATE_SETTINGS', actionUser, 'System settings updated']);

        res.json(settingsToSave);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
