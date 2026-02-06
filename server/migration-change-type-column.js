require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        console.log('🔌 Connected to database...');
        console.log('🔄 Modifying "type" column from ENUM to VARCHAR(100)...');

        // Execute ALTER TABLE
        await connection.query("ALTER TABLE assets MODIFY COLUMN type VARCHAR(100) NOT NULL");

        console.log('✅ Successfully updated "type" column to VARCHAR(100).');
    } catch (err) {
        console.error('❌ Error during migration:', err);
    } finally {
        await connection.end();
        process.exit();
    }
}

migrate();
