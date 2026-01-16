const db = require('./db');

const migrate = async () => {
    try {
        const connection = await db.getConnection();
        console.log('Connected to database...');

        console.log('Updating assets table status column...');
        await connection.query(`
            ALTER TABLE assets 
            MODIFY COLUMN status ENUM('NORMAL', 'BROKEN', 'REPAIRING', 'SOLD', 'WITHDRAWN', 'WAIT_FOR_DISPOSAL') 
            NOT NULL DEFAULT 'NORMAL'
        `);

        console.log('✅ Migration successful: Added WAIT_FOR_DISPOSAL to status enum');
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
};

migrate();
