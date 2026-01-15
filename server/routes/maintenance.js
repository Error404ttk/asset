const express = require('express');
const router = express.Router();
const db = require('../db');

// Get maintenance statistics (repairs per month)
router.get('/stats', async (req, res) => {
    try {
        const { year } = req.query;
        // Default to current year if not provided
        const targetYear = year || new Date().getFullYear() + 543;

        // Convert Thai year to AD for database query if needed, 
        // essentially assuming the `date` field in maintenance_records is standard MySQL DATE (YYYY-MM-DD)
        // detailed logic:
        // The asset fiscal_year is often string like "2567". 
        // But maintenance_records.date is DATE type.
        // If the user selects "2567", we want records from that fiscal year or calendar year? 
        // usually fiscal year in Thailand starts Oct previous year. 
        // For simplicity, let's assume the user selection is roughly the calendar year of the record, 
        // or we just filter by the year part of the date column.

        // However, standard MySQL DATE is AD. So 2567 BE is 2024 AD.
        const adYear = parseInt(targetYear) - 543;

        const [rows] = await db.query(`
            SELECT 
                MONTH(date) as month,
                COUNT(*) as count
            FROM maintenance_records
            WHERE YEAR(date) = ?
            GROUP BY MONTH(date)
            ORDER BY MONTH(date)
        `, [adYear]);

        // Map numeric months to Thai abbreviations
        const thaiMonths = [
            'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
            'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
        ];

        // Create a map of 1-12 to counts
        const statsMap = {};
        rows.forEach(row => {
            statsMap[row.month] = row.count;
        });

        // Generate full array for all 12 months (or just returning what we have?)
        // The dashboard expects: { name: 'ม.ค.', repairs: 4 }
        const stats = thaiMonths.map((name, index) => ({
            name,
            repairs: statsMap[index + 1] || 0
        }));

        res.json(stats);

    } catch (err) {
        console.error('Error fetching maintenance stats:', err);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
