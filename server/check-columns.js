require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log('🔌 Checking columns...');
        const [columns] = await connection.query(`SHOW COLUMNS FROM assets`);
        const colNames = columns.map(c => c.Field);

        console.log('Columns found:', colNames.join(', '));

        const required = ['license_type', 'image_url', 'gpu'];
        required.forEach(req => {
            if (colNames.includes(req)) {
                console.log(`✅ ${req} exists`);
            } else {
                console.log(`❌ ${req} MISSING`);
            }
        });

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await connection.end();
    }
}

main();
