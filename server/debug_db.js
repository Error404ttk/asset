const db = require('./db');

async function test() {
    try {
        console.log('Testing DB Connection...');
        const [rows] = await db.query('SELECT 1 as val');
        console.log('✅ DB Connection OK:', rows);

        console.log('Checking hardware_imports table...');
        const [table] = await db.query('DESCRIBE hardware_imports');
        console.log('✅ Table hardware_imports exists with columns:', table.map(c => c.Field).join(', '));

    } catch (err) {
        console.error('❌ Error:', err.message);
        if (err.sqlMessage) console.error('SQL Error:', err.sqlMessage);
    } finally {
        process.exit();
    }
}

test();
