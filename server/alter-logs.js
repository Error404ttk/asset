require('dotenv').config();
const db = require('./db');

async function migrate() {
    try {
        console.log('🔄 Modifying asset_logs table...');
        await db.query('ALTER TABLE asset_logs MODIFY asset_id VARCHAR(36) NULL');
        await db.query('ALTER TABLE asset_logs MODIFY asset_id VARCHAR(36) NULL DEFAULT NULL');
        console.log('✅ asset_logs table updated: asset_id is now NULLABLE');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
