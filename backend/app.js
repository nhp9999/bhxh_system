const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    abortOnLimit: true,
    createParentPath: true // Tự động tạo thư mục nếu chưa tồn tại
}));

// Log all requests
app.use((req, res, next) => {
    console.log('Request:', {
        method: req.method,
        url: req.url,
        body: req.body,
        files: req.files
    });
    next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./src/routes/auth');
const declarationRoutes = require('./src/routes/declaration');
const apiRoutes = require('./src/routes/api');

// Mount routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/declarations', declarationRoutes);
app.use('/api', apiRoutes);

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi: ' + err.message
    });
});

// 404 handler
app.use((req, res) => {
    console.log('404 Not Found:', req.url);
    res.status(404).json({
        status: 'error',
        type: 'NOT_FOUND',
        message: 'Không tìm thấy tài nguyên yêu cầu'
    });
});

module.exports = app; 