const pool = require('../config/database');
const bcrypt = require('bcrypt');

// Lấy danh sách người dùng
const getUsers = async (req, res) => {
    const client = await pool.connect();
    try {
        const result = await client.query(`
            SELECT id, username, full_name, role, department_code, email, phone_number, status,
                   province, district, commune
            FROM users
            ORDER BY created_at DESC
        `);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy danh sách người dùng'
        });
    } finally {
        client.release();
    }
};

// Tạo người dùng mới
const createUser = async (req, res) => {
    const client = await pool.connect();
    try {
        const { 
            username, password, full_name, role, department_code, 
            email, phone_number, province, district, commune 
        } = req.body;

        // Validate required fields
        if (!username || !password || !full_name || !role || !department_code) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
            });
        }

        // Kiểm tra username đã tồn tại chưa
        const existingUser = await client.query(
            'SELECT id FROM users WHERE username = $1',
            [username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Tên đăng nhập đã tồn tại'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user mới
        const result = await client.query(`
            INSERT INTO users (
                username, password, full_name, role, department_code, 
                email, phone_number, status, province, district, commune
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, $9, $10)
            RETURNING id, username, full_name, role, department_code, 
                      email, phone_number, status, province, district, commune
        `, [username, hashedPassword, full_name, role, department_code, 
            email, phone_number, province, district, commune]);

        res.json({
            success: true,
            message: 'Tạo người dùng thành công',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tạo người dùng'
        });
    } finally {
        client.release();
    }
};

// Cập nhật thông tin người dùng
const updateUser = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { 
            full_name, role, department_code, email, phone_number,
            province, district, commune 
        } = req.body;

        // Validate required fields
        if (!full_name || !role || !department_code) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
            });
        }

        // Cập nhật thông tin
        const result = await client.query(`
            UPDATE users 
            SET full_name = $1,
                role = $2,
                department_code = $3,
                email = $4,
                phone_number = $5,
                province = $6,
                district = $7,
                commune = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9
            RETURNING id, username, full_name, role, department_code, 
                      email, phone_number, status, province, district, commune
        `, [full_name, role, department_code, email, phone_number, 
            province, district, commune, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật thông tin'
        });
    } finally {
        client.release();
    }
};

// Khóa/mở khóa tài khoản
const toggleUserStatus = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        const result = await client.query(`
            UPDATE users 
            SET status = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, username, full_name, role, department_code, email, phone_number, status
        `, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            message: status === 'active' ? 'Mở khóa tài khoản thành công' : 'Khóa tài khoản thành công',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi thay đổi trạng thái tài khoản'
        });
    } finally {
        client.release();
    }
};

// Xóa người dùng
const deleteUser = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        // Kiểm tra xem có phải admin không
        const userCheck = await client.query(
            'SELECT role FROM users WHERE id = $1',
            [id]
        );

        if (userCheck.rows[0]?.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa tài khoản admin'
            });
        }

        // Xóa user
        const result = await client.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        res.json({
            success: true,
            message: 'Xóa người dùng thành công'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa người dùng'
        });
    } finally {
        client.release();
    }
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    toggleUserStatus,
    deleteUser
}; 