const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'asset_db',
    port: process.env.DB_PORT || 3306
};

async function addSubtypeColumn() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database.');

        const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'assets' AND COLUMN_NAME = 'subtype'
    `, [dbConfig.database]);

        if (columns.length > 0) {
            console.log('Column "subtype" already exists.');
        } else {
            await connection.query(`
        ALTER TABLE assets
        ADD COLUMN subtype VARCHAR(50) DEFAULT NULL AFTER type
      `);
            console.log('Added column "subtype" to assets table.');
        }

    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        if (connection) await connection.end();
    }
}

addSubtypeColumn();
