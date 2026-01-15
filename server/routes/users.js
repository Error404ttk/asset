const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

// GET all users
router.get('/', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, username, name, email, role, status, created_at FROM users ORDER BY created_at DESC');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// CREATE user
router.post('/', async (req, res) => {
    const { username, password, name, email, role, actionUser } = req.body; // Added actionUser

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)',
            [username, hashedPassword, name, email, role]
        );

        // Log creation
        const performer = actionUser || 'System';
        await db.query('INSERT INTO asset_logs (asset_id, action, user, details) VALUES (NULL, ?, ?, ?)',
            ['CREATE_USER', performer, `Created user: ${username} (${role})`]);

        res.status(201).json({ message: 'User created successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// UPDATE user
router.put('/:id', async (req, res) => {
    const { username, password, name, email, role, status, actionUser } = req.body;

    try {
        const updates = [];
        const values = [];

        if (username) { updates.push('username = ?'); values.push(username); }
        if (name) { updates.push('name = ?'); values.push(name); }
        if (email) { updates.push('email = ?'); values.push(email); }
        if (role) { updates.push('role = ?'); values.push(role); }
        if (status) { updates.push('status = ?'); values.push(status); }

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }

        if (updates.length > 0) {
            values.push(req.params.id);
            await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
        }

        // Log update
        const performer = actionUser || 'System';
        await db.query('INSERT INTO asset_logs (asset_id, action, user, details) VALUES (NULL, ?, ?, ?)',
            ['UPDATE_USER', performer, `Updated user: ${username || req.params.id}`]);

        res.json({ message: 'User updated successfully' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

// DELETE user
router.delete('/:id', async (req, res) => {
    try {
        const actionUser = req.query.user || 'System'; // Get performer from query
        // Fetch user info for logging
        const [users] = await db.query('SELECT username FROM users WHERE id = ?', [req.params.id]);
        const targetUsername = users[0] ? users[0].username : 'Unknown';

        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);

        // Log deletion
        await db.query('INSERT INTO asset_logs (asset_id, action, user, details) VALUES (NULL, ?, ?, ?)',
            ['DELETE_USER', actionUser, `Deleted user: ${targetUsername}`]);

        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
