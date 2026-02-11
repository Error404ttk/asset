const db = require('./db');

async function main() {
    try {
        console.log('Adding rack_unit column to assets table...');
        // Add after 'model' so it's with basic specs
        await db.query(`ALTER TABLE assets ADD COLUMN rack_unit VARCHAR(50) NULL AFTER model`);
        console.log('✅ Column rack_unit added successfully.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ Column rack_unit already exists.');
        } else {
            console.error('❌ Error:', e.message);
        }
    } finally {
        process.exit(0);
    }
}

main();
