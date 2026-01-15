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
        console.log('🔌 Checking for missing columns...');

        // GPU
        const [gpuCol] = await connection.query("SHOW COLUMNS FROM assets LIKE 'gpu'");
        if (gpuCol.length === 0) {
            console.log('⚠️ GPU column missing. Adding...');
            await connection.query("ALTER TABLE assets ADD COLUMN gpu VARCHAR(100) AFTER storage");
            console.log('✅ GPU column added.');
        } else {
            console.log('✅ GPU column already exists.');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await connection.end();
    }
}

main();
