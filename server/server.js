const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
const assetsRouter = require('./routes/assets');
const settingsRouter = require('./routes/settings');
const logsRouter = require('./routes/logs');

app.use('/api/assets', assetsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/hardware', require('./routes/hardware'));
app.use('/api/software', require('./routes/software'));

// Serve static uploads
app.use('/uploads', express.static('uploads'));

// Serve Frontend (Production)
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Any other request -> serve index.html (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
