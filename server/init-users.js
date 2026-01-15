const db = require('./db');
const bcrypt = require('bcrypt');

const initUsers = async () => {
    try {
        const connection = await db.getConnection();
        console.log('Initializing Users Table...');

        // 1. Create Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100),
                role ENUM('SUPER_ADMIN', 'ADMIN', 'STAFF') NOT NULL DEFAULT 'STAFF',
                status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table users created/ensured');

        // 2. Check for Super Admin
        const [rows] = await connection.query('SELECT * FROM users WHERE role = "SUPER_ADMIN"');
        if (rows.length === 0) {
            console.log('Creating default Super Admin...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await connection.query(
                'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
                ['admin', hashedPassword, 'Super Admin', 'SUPER_ADMIN']
            );
            console.log('Default Admin Created: admin / admin123');
        } else {
            console.log('Super Admin already exists.');
        }

        connection.release();
        process.exit(0);

    } catch (err) {
        console.error('Error initializing users:', err);
        process.exit(1);
    }
};

initUsers();
