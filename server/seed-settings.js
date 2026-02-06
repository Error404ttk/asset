const db = require('./db');

const DEFAULT_SETTINGS = {
    agencyName: 'หน่วยงานราชการ',
    address: '',
    departments: ['สำนักปลัด', 'กองคลัง', 'กองช่าง'],
    commonOS: ['Windows 11', 'Windows 10'],
    commonRam: ['8GB', '16GB'],
    commonStorage: ['256GB SSD', '512GB SSD'],
    commonCpu: ['Intel Core i5', 'Intel Core i7'],
    commonLicenseTypes: ['มีลิขสิทธิ์', 'ไม่มีลิขสิทธิ์'],
    commonAssetNames: [],
    commonBrands: [],
    commonModels: [],
    commonAssetTypes: ['คอมพิวเตอร์', 'จอภาพ', 'เครื่องพิมพ์', 'UPS', 'อุปกรณ์เครือข่าย', 'อื่นๆ']
};

const seedSettings = async () => {
    try {
        console.log('Connecting to database...');
        const connection = await db.getConnection();

        console.log('Seeding system_settings with default values...');

        const queries = Object.keys(DEFAULT_SETTINGS).map(key => {
            return connection.query(
                'INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
                [key, JSON.stringify(DEFAULT_SETTINGS[key]), JSON.stringify(DEFAULT_SETTINGS[key])]
            );
        });

        await Promise.all(queries);

        console.log('✅ Settings seeded successfully!');
        connection.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding settings:', err);
        process.exit(1);
    }
};

seedSettings();
