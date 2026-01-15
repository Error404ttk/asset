import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const db = require('./server/db.js');

async function checkDatabase() {
    try {
        const connection = await db.getConnection();
        console.log('✅ Connected to database');

        // Check table structure
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'asset_pro' 
            AND TABLE_NAME = 'assets'
        `);

        console.log('\n📋 Column definitions:');
        columns.forEach(col => {
            console.log(`  ${col.COLUMN_NAME}: ${col.COLUMN_TYPE}`);
        });

        // Check existing data
        const [assets] = await connection.query(`
            SELECT id, asset_code, name, type, status 
            FROM assets 
            LIMIT 5
        `);

        console.log('\n📦 Sample assets:');
        console.log(JSON.stringify(assets, null, 2));

        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

checkDatabase();
