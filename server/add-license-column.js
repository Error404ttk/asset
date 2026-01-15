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
        console.log('🔌 Connected to database');

        // Check if column exists
        const [columns] = await connection.query(`
            SHOW COLUMNS FROM assets LIKE 'license_type'
        `);

        if (columns.length > 0) {
            console.log('✅ Column license_type already exists.');
        } else {
            console.log('⚠️ Column license_type missing. Adding...');
            await connection.query(`
                ALTER TABLE assets 
                ADD COLUMN license_type VARCHAR(50) DEFAULT NULL AFTER os
            `);
            console.log('✅ Column license_type added successfully.');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await connection.end();
    }
}

main();
