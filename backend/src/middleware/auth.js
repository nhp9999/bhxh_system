const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Kiểm tra user trong database
        const result = await pool.query(
            'SELECT id, username, full_name, role, department_code FROM users WHERE id = $1 AND status = $2',
            [decoded.id, 'active']
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Người dùng không tồn tại hoặc đã bị khóa' });
        }

        req.user = result.rows[0];
        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
};

const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Không tìm thấy thông tin người dùng' });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập tính năng này' });
        }

        next();
    } catch (error) {
        console.error('Admin check error:', error);
        return res.status(500).json({ message: 'Có lỗi xảy ra khi kiểm tra quyền admin' });
    }
};

module.exports = {
    authenticateToken,
    requireAdmin
}; 