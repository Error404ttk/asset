const db = require('./db');

const fixSchema = async () => {
    try {
        console.log('Starting Schema Fix for asset_logs...');

        // 1. Find the Foreign Key Constraint Name
        const [rows] = await db.query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_NAME = 'asset_logs' 
            AND REFERENCED_TABLE_NAME = 'assets'
            AND TABLE_SCHEMA = DATABASE();
        `);

        if (rows.length > 0) {
            const constraintName = rows[0].CONSTRAINT_NAME;
            console.log(`Found FK Constraint: ${constraintName}`);

            // 2. Drop the Foreign Key
            await db.query(`ALTER TABLE asset_logs DROP FOREIGN KEY ${constraintName}`);
            console.log('Foreign Key Dropped successfully.');
        } else {
            console.log('No Foreign Key Constraint found (already removed?).');
        }

        // 3. Verify asset_id doesn't crash on insert of non-existent ID
        // We might want to remove the index or simple keep it. Keeping it as a normal index is fine.

        console.log('Schema fix completed.');
        process.exit(0);
    } catch (err) {
        console.error('Error fixing schema:', err);
        process.exit(1);
    }
};

fixSchema();
