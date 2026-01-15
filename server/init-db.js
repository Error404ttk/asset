const db = require('./db');

const initDb = async () => {
  try {
    const connection = await db.getConnection();
    console.log('Connected to MySQL database!');

    // 1. Assets
    await connection.query(`
      CREATE TABLE IF NOT EXISTS assets (
        id VARCHAR(36) PRIMARY KEY,
        asset_code VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        type ENUM('COMPUTER', 'MONITOR', 'PRINTER', 'UPS', 'NETWORK', 'OTHER') NOT NULL,
        status ENUM('NORMAL', 'BROKEN', 'REPAIRING', 'SOLD', 'WITHDRAWN') NOT NULL DEFAULT 'NORMAL',
        brand VARCHAR(100),
        model VARCHAR(100),
        serial_number VARCHAR(100),
        fiscal_year VARCHAR(4),
        location VARCHAR(255),
        department VARCHAR(100),
        \`current_user\` VARCHAR(100),
        image_url TEXT,
        acquired_date DATE,
        warranty_expire_date DATE,
        cpu VARCHAR(100),
        ram VARCHAR(50),
        storage VARCHAR(100),
        gpu VARCHAR(100),
        os VARCHAR(100),
        license_type VARCHAR(50),
        product_key VARCHAR(255),
        ip_address VARCHAR(45),
        mac_address VARCHAR(17),
        hostname VARCHAR(100),
        display_size VARCHAR(50),
        wattage VARCHAR(50),
        print_type VARCHAR(50),
        note TEXT,
        replaced_asset_id VARCHAR(36),
        replacement_asset_id VARCHAR(36),
        disposal_id VARCHAR(50),
        disposal_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Table assets created/ensured');

    // 2. Maintenance
    await connection.query(`
      CREATE TABLE IF NOT EXISTS maintenance_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        asset_id VARCHAR(36) NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        cost DECIMAL(10, 2) DEFAULT 0.00,
        performer VARCHAR(100),
        resulting_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
      )
    `);
    console.log('Table maintenance_records created/ensured');

    // 3. Asset Logs
    await connection.query(`
      CREATE TABLE IF NOT EXISTS asset_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        asset_id VARCHAR(36) NOT NULL,
        action VARCHAR(50) NOT NULL,
        user VARCHAR(100),
        details TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
      )
    `);
    console.log('Table asset_logs created/ensured');

    // 4. System Settings
    await connection.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value JSON NOT NULL
      )
    `);
    console.log('Table system_settings created/ensured');

    connection.release();
    process.exit(0);

  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  }
};

initDb();
