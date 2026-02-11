const db = require('./db');

async function main() {
    try {
        console.log('Adding budget_type column to assets table...');
        await db.query(`ALTER TABLE assets ADD COLUMN budget_type VARCHAR(50) DEFAULT 'ครุภัณฑ์' AFTER type`);
        console.log('✅ Column budget_type added successfully.');
    } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ Column budget_type already exists.');
        } else {
            console.error('❌ Error:', e.message);
        }
    } finally {
        process.exit(0);
    }
}

main();
