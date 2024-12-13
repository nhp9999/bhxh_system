const pool = require('../config/database');

const getAdminStats = async (req, res) => {
    const client = await pool.connect();
    try {
        // Lấy thống kê tổng số đợt kê khai theo trạng thái
        const batchStats = await client.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM declaration_batch
            GROUP BY status
        `);

        // Lấy thống kê tổng số kê khai theo trạng thái
        const declarationStats = await client.query(`
            SELECT 
                status,
                COUNT(*) as count,
                SUM(actual_amount) as total_amount
            FROM declarations
            WHERE deleted_at IS NULL
            GROUP BY status
        `);

        // Lấy thống kê theo loại đối tượng
        const objectTypeStats = await client.query(`
            SELECT 
                object_type,
                COUNT(*) as count
            FROM declaration_batch
            GROUP BY object_type
        `);

        // Lấy thống kê theo phòng ban
        const departmentStats = await client.query(`
            SELECT 
                department_code,
                COUNT(*) as count
            FROM declaration_batch
            GROUP BY department_code
        `);

        // Format kết quả
        const stats = {
            batches: {
                total: batchStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
                byStatus: batchStats.rows.reduce((acc, row) => {
                    acc[row.status] = parseInt(row.count);
                    return acc;
                }, {})
            },
            declarations: {
                total: declarationStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
                totalAmount: declarationStats.rows.reduce((sum, row) => sum + parseInt(row.total_amount || 0), 0),
                byStatus: declarationStats.rows.reduce((acc, row) => {
                    acc[row.status] = {
                        count: parseInt(row.count),
                        amount: parseInt(row.total_amount || 0)
                    };
                    return acc;
                }, {})
            },
            objectTypes: objectTypeStats.rows.reduce((acc, row) => {
                acc[row.object_type] = parseInt(row.count);
                return acc;
            }, {}),
            departments: departmentStats.rows.reduce((acc, row) => {
                acc[row.department_code] = parseInt(row.count);
                return acc;
            }, {})
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting admin stats:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy thống kê'
        });
    } finally {
        client.release();
    }
};

const getEmployeeStats = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;

        // Lấy thống kê tổng số đợt kê khai theo trạng thái
        const batchStats = await client.query(`
            SELECT 
                status,
                COUNT(*) as count
            FROM declaration_batch
            WHERE created_by = $1
            GROUP BY status
        `, [userId]);

        // Lấy thống kê tổng số kê khai theo trạng thái
        const declarationStats = await client.query(`
            SELECT 
                d.status,
                COUNT(*) as count,
                SUM(d.actual_amount) as total_amount
            FROM declarations d
            JOIN declaration_batch b ON d.batch_id = b.id
            WHERE b.created_by = $1 AND d.deleted_at IS NULL
            GROUP BY d.status
        `, [userId]);

        // Lấy thống kê theo loại đối tượng
        const objectTypeStats = await client.query(`
            SELECT 
                object_type,
                COUNT(*) as count
            FROM declaration_batch
            WHERE created_by = $1
            GROUP BY object_type
        `, [userId]);

        // Format kết quả
        const stats = {
            batches: {
                total: batchStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
                byStatus: batchStats.rows.reduce((acc, row) => {
                    acc[row.status] = parseInt(row.count);
                    return acc;
                }, {})
            },
            declarations: {
                total: declarationStats.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
                totalAmount: declarationStats.rows.reduce((sum, row) => sum + parseInt(row.total_amount || 0), 0),
                byStatus: declarationStats.rows.reduce((acc, row) => {
                    acc[row.status] = {
                        count: parseInt(row.count),
                        amount: parseInt(row.total_amount || 0)
                    };
                    return acc;
                }, {})
            },
            objectTypes: objectTypeStats.rows.reduce((acc, row) => {
                acc[row.object_type] = parseInt(row.count);
                return acc;
            }, {})
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting employee stats:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy thống kê'
        });
    } finally {
        client.release();
    }
};

module.exports = {
    getAdminStats,
    getEmployeeStats
}; 