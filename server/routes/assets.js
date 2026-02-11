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
    budgetType: row.budget_type || 'ครุภัณฑ์',
    subtype: row.subtype || '',
    status: row.status,
    brand: row.brand || '',
    model: row.model || '',
    rackUnit: row.rack_unit || '',
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
        subtype: sanitize(asset.subtype),
        status: sanitize(asset.status),
        brand: sanitize(asset.brand),
        model: sanitize(asset.model),
        rack_unit: sanitize(asset.rackUnit),
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

// CREATE multiple assets (Bulk)
router.post('/bulk', async (req, res) => {
    const assets = req.body;
    if (!Array.isArray(assets) || assets.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty asset array' });
    }
    console.log(`📦 Bulk Creating ${assets.length} Assets`);

    // Helper to map DB row from Asset object (strict column mapping)
    const mapAssetToRow = (asset, newId) => {
        return [
            newId,
            sanitize(asset.assetCode),
            sanitize(asset.name),
            sanitize(asset.type),
            sanitize(asset.budgetType),
            sanitize(asset.subtype),
            sanitize(asset.status),
            sanitize(asset.brand),
            sanitize(asset.model),
            sanitize(asset.rackUnit),
            sanitize(asset.serialNumber),
            sanitize(asset.fiscalYear),
            sanitize(asset.location),
            sanitize(asset.department),
            sanitize(asset.currentUser),
            sanitize(asset.imageUrl),
            formatDateForDb(asset.acquiredDate),
            formatDateForDb(asset.warrantyExpireDate),
            sanitize(asset.cpu),
            sanitize(asset.ram),
            sanitize(asset.storage),
            sanitize(asset.gpu),
            sanitize(asset.os),
            sanitize(asset.licenseType),
            sanitize(asset.productKey),
            sanitize(asset.ipAddress),
            sanitize(asset.macAddress),
            sanitize(asset.hostname),
            sanitize(asset.displaySize),
            sanitize(asset.wattage),
            sanitize(asset.printType),
            sanitize(asset.note),
            sanitize(asset.replacedAssetId),
            sanitize(asset.replacementAssetId),
            sanitize(asset.disposalId),
            formatDateForDb(asset.disposalDate)
        ];
    };

    const columns = [
        'id', 'asset_code', 'name', 'type', 'budget_type', 'subtype', 'status', 'brand', 'model', 'rack_unit', 'serial_number',
        'fiscal_year', 'location', 'department', 'current_user', 'image_url', 'acquired_date',
        'warranty_expire_date', 'cpu', 'ram', 'storage', 'gpu', 'os', 'license_type', 'product_key',
        'ip_address', 'mac_address', 'hostname', 'display_size', 'wattage', 'print_type', 'note',
        'replaced_asset_id', 'replacement_asset_id', 'disposal_id', 'disposal_date'
    ];

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const values = assets.map(asset => {
            const newId = uuidv4();
            return mapAssetToRow(asset, newId);
        });

        // Perform Bulk Insert
        const sql = `INSERT INTO assets (${columns.map(c => `\`${c}\``).join(', ')}) VALUES ?`;
        await connection.query(sql, [values]);

        // Log bulk action (Single log entry to avoid spam)
        const actionUser = assets[0].actionUser || 'System';
        await connection.query('INSERT INTO asset_logs (asset_id, action, user, details) VALUES (?, ?, ?, ?)',
            ['BULK', 'IMPORT', actionUser, `Imported ${assets.length} assets via CSV`]);

        await connection.commit();
        console.log(`✅ Automatically imported ${assets.length} items.`);
        res.status(201).json({ message: `Successfully imported ${assets.length} assets` });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('❌ Bulk Import Error:', err.message);
        res.status(500).json({ error: err.message, sqlMessage: err.sqlMessage });
    } finally {
        if (connection) connection.release();
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
        subtype: sanitize(asset.subtype),
        status: sanitize(asset.status),
        brand: sanitize(asset.brand),
        model: sanitize(asset.model),
        rack_unit: sanitize(asset.rackUnit),
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

// BULK DELETE assets
router.post('/delete-bulk', async (req, res) => {
    const { ids, actionUser } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid or empty IDs array' });
    }

    console.log(`🗑️ Bulk Deleting ${ids.length} assets...`);

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Fetch assets to get image URLs and Names for logging
        const placeholders = ids.map(() => '?').join(',');
        const [assets] = await connection.query(`SELECT id, asset_code, name, image_url FROM assets WHERE id IN (${placeholders})`, ids);

        if (assets.length === 0) {
            await connection.commit();
            return res.json({ message: 'No matching assets found to delete' });
        }

        // 2. Delete from DB
        await connection.query(`DELETE FROM assets WHERE id IN (${placeholders})`, ids);

        // 3. Log Action (Single log for bulk)
        const user = actionUser || 'System';
        await connection.query('INSERT INTO asset_logs (asset_id, action, user, details) VALUES (?, ?, ?, ?)',
            ['BULK', 'DELETE', user, `Deleted ${assets.length} items via Bulk Action`]);

        await connection.commit();

        // 4. Cleanup Files (Async - doesn't block response)
        // We do this AFTER commit to ensure DB consistency first
        assets.forEach(asset => {
            if (asset.image_url) {
                const filePath = path.join(__dirname, '..', asset.image_url.startsWith('/') ? asset.image_url.slice(1) : asset.image_url);
                if (fs.existsSync(filePath)) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (e) {
                        console.error(`Failed to delete file for asset ${asset.asset_code}:`, e.message);
                    }
                }
            }
        });

        console.log(`✅ Bulk Deleted ${assets.length} items`);
        res.json({ message: `Successfully deleted ${assets.length} items`, deletedCount: assets.length });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('❌ Bulk Delete Error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        if (connection) connection.release();
    }
});

module.exports = router;
