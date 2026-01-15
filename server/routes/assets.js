const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Helper to map DB row to Frontend Asset object (snake_case -> camelCase)
const formatDateForResponse = (date) => {
    if (!date) return '';
    if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return String(date).split('T')[0]; // Handle string case if string is returned
};

const mapAssetFromDb = (row) => ({
    id: row.id,
    assetCode: row.asset_code,
    name: row.name,
    type: row.type,
    status: row.status,
    brand: row.brand || '',
    model: row.model || '',
    serialNumber: row.serial_number || '',
    fiscalYear: row.fiscal_year || '',
    location: row.location || '',
    department: row.department || '',
    currentUser: row.current_user || '',
    imageUrl: row.image_url || '',
    acquiredDate: formatDateForResponse(row.acquired_date),
    warrantyExpireDate: formatDateForResponse(row.warranty_expire_date),
    cpu: row.cpu || '',
    ram: row.ram || '',
    storage: row.storage || '',
    gpu: row.gpu || '',
    os: row.os || '',
    licenseType: row.license_type || '',
    productKey: row.product_key || '',
    ipAddress: row.ip_address || '',
    macAddress: row.mac_address || '',
    hostname: row.hostname || '',
    displaySize: row.display_size || '',
    wattage: row.wattage || '',
    printType: row.print_type || '',
    note: row.note || '',
    replacedAssetId: row.replaced_asset_id || '',
    replacementAssetId: row.replacement_asset_id || '',
    disposalId: row.disposal_id || '',
    disposalDate: formatDateForResponse(row.disposal_date),
    createdAt: row.created_at,
    updatedAt: row.updated_at
});

// GET all assets
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM assets ORDER BY created_at DESC');
        const assets = rows.map(mapAssetFromDb);
        res.json(assets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET single asset
router.get('/:id', async (req, res) => {
    try {
        const [assets] = await db.query('SELECT * FROM assets WHERE id = ?', [req.params.id]);
        if (assets.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }
        const asset = mapAssetFromDb(assets[0]);

        const [maintenance] = await db.query('SELECT * FROM maintenance_records WHERE asset_id = ? ORDER BY date DESC', [req.params.id]);
        asset.maintenanceHistory = maintenance;

        res.json(asset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper to sanitize empty strings to NULL
const sanitize = (val) => (val === '' ? null : val);

// Helper to format date for MySQL (YYYY-MM-DD)
const formatDateForDb = (dateStr) => {
    if (!dateStr) return null;
    // If it's an ISO string (e.g. 2025-01-15T00:00:00.000Z), take the date part
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
        return dateStr.split('T')[0];
    }
    return dateStr;
};

// CREATE asset
router.post('/', async (req, res) => {
    const asset = req.body;
    console.log('📦 Creating Asset:', JSON.stringify(asset, null, 2));
    const newId = uuidv4();

    const dbFields = {
        id: newId,
        asset_code: sanitize(asset.assetCode),
        name: sanitize(asset.name),
        type: sanitize(asset.type),
        status: sanitize(asset.status),
        brand: sanitize(asset.brand),
        model: sanitize(asset.model),
        serial_number: sanitize(asset.serialNumber),
        fiscal_year: sanitize(asset.fiscalYear),
        location: sanitize(asset.location),
        department: sanitize(asset.department),
        current_user: sanitize(asset.currentUser),
        image_url: sanitize(asset.imageUrl),
        acquired_date: formatDateForDb(asset.acquiredDate),
        warranty_expire_date: formatDateForDb(asset.warrantyExpireDate),
        cpu: sanitize(asset.cpu),
        ram: sanitize(asset.ram),
        storage: sanitize(asset.storage),
        gpu: sanitize(asset.gpu),
        os: sanitize(asset.os),
        license_type: sanitize(asset.licenseType),
        product_key: sanitize(asset.productKey),
        ip_address: sanitize(asset.ipAddress),
        mac_address: sanitize(asset.macAddress),
        hostname: sanitize(asset.hostname),
        display_size: sanitize(asset.displaySize),
        wattage: sanitize(asset.wattage),
        print_type: sanitize(asset.printType),
        note: sanitize(asset.note),
        replaced_asset_id: sanitize(asset.replacedAssetId),
        replacement_asset_id: sanitize(asset.replacementAssetId),
        disposal_id: sanitize(asset.disposalId),
        disposal_date: formatDateForDb(asset.disposalDate)
    };

    try {
        const keys = Object.keys(dbFields).filter(k => dbFields[k] !== undefined);
        const values = keys.map(k => dbFields[k]);
        const placeholders = keys.map(() => '?').join(', ');

        const sql = `INSERT INTO assets (` + keys.map(k => `\`${k}\``).join(', ') + `) VALUES (${placeholders})`;

        await db.query(sql, values);

        // Log creation
        const actionUser = req.body.actionUser || 'System';
        await db.query('INSERT INTO asset_logs (asset_id, action, user, details) VALUES (?, ?, ?, ?)',
            [newId, 'CREATE', actionUser, 'Asset created']);

        res.status(201).json({ id: newId, ...asset });
    } catch (err) {
        console.error('❌ Error creating asset:', err.message);
        if (err.sqlMessage) console.error('SQL Error:', err.sqlMessage);
        console.error('Stack:', err.stack);
        res.status(500).json({ error: err.message, sqlMessage: err.sqlMessage });
    }
});

// UPDATE asset
router.put('/:id', async (req, res) => {
    const asset = req.body;
    console.log(`📦 Updating Asset ${req.params.id}:`, JSON.stringify(asset, null, 2));
    const dbFields = {
        asset_code: sanitize(asset.assetCode),
        name: sanitize(asset.name),
        type: sanitize(asset.type),
        status: sanitize(asset.status),
        brand: sanitize(asset.brand),
        model: sanitize(asset.model),
        serial_number: sanitize(asset.serialNumber),
        fiscal_year: sanitize(asset.fiscalYear),
        location: sanitize(asset.location),
        department: sanitize(asset.department),
        current_user: sanitize(asset.currentUser),
        image_url: sanitize(asset.imageUrl),
        acquired_date: formatDateForDb(asset.acquiredDate),
        warranty_expire_date: formatDateForDb(asset.warrantyExpireDate),
        cpu: sanitize(asset.cpu),
        ram: sanitize(asset.ram),
        storage: sanitize(asset.storage),
        gpu: sanitize(asset.gpu),
        os: sanitize(asset.os),
        license_type: sanitize(asset.licenseType),
        product_key: sanitize(asset.productKey),
        ip_address: sanitize(asset.ipAddress),
        mac_address: sanitize(asset.macAddress),
        hostname: sanitize(asset.hostname),
        display_size: sanitize(asset.displaySize),
        wattage: sanitize(asset.wattage),
        print_type: sanitize(asset.printType),
        note: sanitize(asset.note),
        replaced_asset_id: sanitize(asset.replacedAssetId),
        replacement_asset_id: sanitize(asset.replacementAssetId),
        disposal_id: sanitize(asset.disposalId),
        disposal_date: formatDateForDb(asset.disposalDate)
    };

    try {
        // Fetch old image URL for cleanup
        const [oldRows] = await db.query('SELECT image_url FROM assets WHERE id = ?', [req.params.id]);
        const oldImageUrl = oldRows[0] ? oldRows[0].image_url : null;

        const keys = Object.keys(dbFields).filter(k => dbFields[k] !== undefined);
        if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });

        // Fetch old data for diff logging
        const [oldAssets] = await db.query('SELECT * FROM assets WHERE id = ?', [req.params.id]);
        if (oldAssets.length === 0) return res.status(404).json({ error: 'Asset not found' });
        const oldAsset = oldAssets[0];

        // Prepare Update SQL
        const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
        const values = keys.map(k => dbFields[k]);

        await db.query(`UPDATE assets SET ${setClause} WHERE id = ?`, [...values, req.params.id]);

        // Delete old image file if changed
        if (oldImageUrl && oldImageUrl !== dbFields.image_url) {
            const filePath = path.join(__dirname, '..', oldImageUrl.startsWith('/') ? oldImageUrl.slice(1) : oldImageUrl);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log('🗑️ Deleted old image:', filePath);
                } catch (err) {
                    console.error('❌ Failed to delete old image:', err);
                }
            }
        }

        // Calculate Diff
        const formatLogValue = (val) => {
            if (val === null || val === undefined || val === '') return 'Empty';
            if (val instanceof Date) {
                const year = val.getFullYear();
                const month = String(val.getMonth() + 1).padStart(2, '0');
                const day = String(val.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            return String(val);
        };

        const changes = [];
        keys.forEach(key => {
            let oldValue = oldAsset[key];
            let newValue = dbFields[key];

            // Specific handling for dates if they are coming as strings from DB or input
            // But formatLogValue handles Date objects.

            const fmtOld = formatLogValue(oldValue);
            const fmtNew = formatLogValue(newValue);

            // Compare formatted values
            if (fmtOld !== fmtNew) {
                changes.push(`${key}: "${fmtOld}" -> "${fmtNew}"`);
            }
        });

        const logDetails = changes.length > 0 ? changes.join(', ') : 'Asset updated (No detected changes)';

        // Log update
        const actionUser = req.body.actionUser || 'System';
        await db.query('INSERT INTO asset_logs (asset_id, action, user, details) VALUES (?, ?, ?, ?)',
            [req.params.id, 'UPDATE', actionUser, logDetails]);

        res.json({ id: req.params.id, ...asset });
    } catch (err) {
        console.error('❌ Error updating asset:', err.message);
        if (err.sqlMessage) console.error('SQL Error:', err.sqlMessage);
        res.status(500).json({ error: err.message, sqlMessage: err.sqlMessage });
    }
});

// DELETE asset
router.delete('/:id', async (req, res) => {
    try {
        // Fetch asset for image cleanup and logging
        const [rows] = await db.query('SELECT * FROM assets WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Asset not found' });
        const assetInfo = `${rows[0].asset_code} - ${rows[0].name}`;
        const imageUrl = rows[0].image_url;

        await db.query('DELETE FROM assets WHERE id = ?', [req.params.id]);

        // Delete image file if exists
        if (imageUrl) {
            const filePath = path.join(__dirname, '..', imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log('🗑️ Deleted asset image:', filePath);
                } catch (err) {
                    console.error('❌ Failed to delete asset image:', err);
                }
            }
        }

        // Log deletion
        const actionUser = req.query.user || req.body.actionUser || 'System';
        await db.query('INSERT INTO asset_logs (asset_id, action, user, details) VALUES (?, ?, ?, ?)',
            [req.params.id, 'DELETE', actionUser, `Asset deleted: ${assetInfo}`]);

        res.json({ message: 'Asset deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
