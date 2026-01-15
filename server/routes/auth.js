const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// POST /login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM users WHERE username = ? AND status = "ACTIVE"', [username]);

        if (users.length === 0) {
            return res.status(401).json({ error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
        }

        const user = users[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' });
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log Login Action
        await db.query('INSERT INTO asset_logs (asset_id, action, user, details) VALUES (NULL, ?, ?, ?)',
            ['LOGIN', user.username || 'Unknown', 'User logged in successfully']);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /logout (Logging only)
router.post('/logout', async (req, res) => {
    const { username } = req.body;
    try {
        await db.query('INSERT INTO asset_logs (asset_id, action, user, details) VALUES (NULL, ?, ?, ?)',
            ['LOGOUT', username || 'Unknown', 'User logged out']);
        res.json({ message: 'Logout logged' });
    } catch (err) {
        console.error('Logout log error:', err);
        res.status(500).json({ error: 'Failed to log logout' });
    }
});

module.exports = router;
