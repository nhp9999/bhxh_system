const pool = require('../config/database');
const calculateActualAmount = require('../utils/calculateActualAmount');
const ExcelJS = require('exceljs');
const path = require('path');

// Get employee batches
const getEmployeeBatches = async (req, res) => {
    try {
        const user = req.user;
        const batches = await pool.query(
            `SELECT * FROM declaration_batch 
            WHERE created_by = $1 
            AND deleted_at IS NULL
            ORDER BY created_at DESC`,
            [user.id]
        );

        res.json(batches.rows);
    } catch (error) {
        console.error('Error getting employee batches:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy danh sách đợt kê khai'
        });
    }
};

// Get batch by id
const getBatchById = async (req, res) => {
    try {
        const { id } = req.params;
        const batch = await pool.query(
            'SELECT * FROM declaration_batch WHERE id = $1',
            [id]
        );

        if (batch.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đợt kê khai'
            });
        }

        res.json(batch.rows[0]);
    } catch (error) {
        console.error('Error getting batch:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy thông tin đợt kê khai'
        });
    }
};

// Get declarations by batch id
const getDeclarationsByBatchId = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Kiểm tra quyền truy cập batch
        const batchCheck = await pool.query(
            `SELECT * FROM declaration_batch 
             WHERE id = $1 
             AND created_by = $2
             AND deleted_at IS NULL`,
            [id, userId]
        );

        if (batchCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đợt kê khai hoặc bạn không có quyền truy cập'
            });
        }

        // Lấy danh sách declarations không bị xóa
        const declarations = await pool.query(
            `SELECT d.*, 
                    CONCAT(d.bhxh_code, '-', d.batch_id) as display_code
             FROM declarations d
             WHERE d.batch_id = $1 
             AND d.deleted_at IS NULL
             ORDER BY d.created_at DESC`,
            [id]
        );

        res.json(declarations.rows);
    } catch (error) {
        console.error('Error getting declarations:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy danh sách kê khai'
        });
    }
};

// Create new batch
const createEmployeeBatch = async (req, res) => {
    const client = await pool.connect();
    try {
        const { 
            object_type, 
            service_type,
            month, 
            year, 
            batch_number,
            department_code,
            name 
        } = req.body;

        const userId = req.user.id;

        await client.query('BEGIN');

        // Kiểm tra trùng lặp
        const duplicateCheck = await client.query(
            `SELECT * FROM declaration_batch 
            WHERE month = $1 
            AND year = $2 
            AND batch_number = $3 
            AND department_code = $4
            AND object_type = $5
            AND service_type = $6
            AND deleted_at IS NULL`,
            [month, year, batch_number, department_code, object_type, service_type]
        );

        if (duplicateCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Đợt kê khai này đã tồn tại'
            });
        }

        // Tạo đợt kê khai mới với payment_status mặc định là 'unpaid'
        const result = await client.query(
            `INSERT INTO declaration_batch (
                name, month, year, batch_number, department_code,
                object_type, service_type, status, total_declarations,
                created_by, created_at, updated_at, payment_status
            ) VALUES (
                $1, $2, $3, $4, $5, 
                $6, $7, 'pending', 0,
                $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'unpaid'::text
            ) RETURNING *`,
            [name, month, year, batch_number, department_code, object_type, service_type, userId]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Tạo đợt kê khai thành công',
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating batch:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tạo đợt kê khai',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Update batch
const updateBatch = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { name, object_type, notes } = req.body;
        const userId = req.user.id;

        // Kiểm tra quyền sở hữu đợt kê khai
        const batchCheck = await client.query(
            'SELECT * FROM declaration_batch WHERE id = $1 AND created_by = $2',
            [id, userId]
        );

        if (batchCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đợt kê khai hoặc bạn không có quyền chỉnh sửa'
            });
        }

        const batch = batchCheck.rows[0];

        // Cho phép chỉnh sửa khi đợt ở trạng thái chờ xử lý
        if (batch.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể chỉnh sửa đợt kê khai ở trạng thái chờ xử lý'
            });
        }

        // Kiểm tra trùng lặp
        const duplicateCheck = await client.query(
            `SELECT id FROM declaration_batch 
            WHERE month = $1 
            AND year = $2 
            AND batch_number = $3 
            AND department_code = $4 
            AND object_type = $5 
            AND service_type = $6
            AND id != $7`,
            [
                batch.month,
                batch.year,
                batch.batch_number,
                batch.department_code,
                object_type,
                batch.service_type,
                id
            ]
        );

        let newBatchNumber = batch.batch_number;
        let newName = name;

        if (duplicateCheck.rows.length > 0) {
            // Lấy số đợt cao nhất trong tháng
            const maxBatchResult = await client.query(
                `SELECT MAX(batch_number) as max_batch 
                FROM declaration_batch 
                WHERE month = $1 
                AND year = $2 
                AND department_code = $3 
                AND object_type = $4
                AND service_type = $5`,
                [batch.month, batch.year, batch.department_code, object_type, batch.service_type]
            );

            // Tăng số đợt lên 1
            newBatchNumber = (maxBatchResult.rows[0].max_batch || 0) + 1;

            // Cập nhật lại tên đợt nếu tên đợt chứa số đợt cũ
            if (name.includes(batch.batch_number.toString())) {
                newName = name.replace(
                    batch.batch_number.toString(), 
                    newBatchNumber.toString()
                );
            }
        }

        // Cập nhật thông tin đợt kê khai
        const result = await client.query(
            `UPDATE declaration_batch 
            SET name = $1, 
                object_type = $2, 
                notes = $3,
                batch_number = $4,
                updated_by = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6 
            RETURNING *`,
            [newName, object_type, notes, newBatchNumber, userId, id]
        );

        res.json({
            success: true,
            message: newBatchNumber !== batch.batch_number 
                ? 'Đã tự động cập nhật số đợt do trùng lặp'
                : 'Cập nhật đợt kê khai thành công',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating batch:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật đợt kê khai'
        });
    } finally {
        client.release();
    }
};

// Delete employee batch
const deleteEmployeeBatch = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await client.query('BEGIN');

        // Kiểm tra batch có tồn tại không
        const batchCheck = await client.query(
            'SELECT * FROM declaration_batch WHERE id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (batchCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đợt kê khai'
            });
        }

        // Soft delete batch
        const result = await client.query(
            `UPDATE declaration_batch 
            SET deleted_at = CURRENT_TIMESTAMP,
                deleted_by = $1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND deleted_at IS NULL
            RETURNING *`,
            [userId, id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Xóa đợt kê khai thành công',
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting batch:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa đợt kê khai',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Hàm cập nhật tổng số tiền của đợt kê khai
const updateBatchTotalAmount = async (client, batchId) => {
    await client.query(`
        UPDATE declaration_batch 
        SET total_amount = (
            SELECT COALESCE(SUM(actual_amount), 0)
            FROM declarations
            WHERE batch_id = $1 
            AND deleted_at IS NULL
        )
        WHERE id = $1
    `, [batchId]);
};

// Create declaration
const createDeclaration = async (req, res) => {
    const client = await pool.connect();
    let result;
    let isIdentityChanged = false;
    
    try {
        await client.query('BEGIN');

        const {
            batch_id, object_type, bhxh_code, full_name, birth_date,
            gender, cccd, phone_number, receipt_date, receipt_number,
            old_card_expiry_date, new_card_effective_date, months,
            plan, commune, hamlet, participant_number, hospital_code,
            isEdit, originalBhxhCode, originalCccd
        } = req.body;
        const user = req.user;

        // Validate dữ liệu đầu vào
        if (!batch_id || !bhxh_code || !full_name || !cccd || !phone_number || 
            !receipt_date || !months || !plan || !commune || !participant_number) {
            throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
        }

        // Validate format dữ liệu
        if (!/^\d{10}$/.test(bhxh_code)) {
            throw new Error('Mã BHXH phải có 10 chữ số');
        }

        if (!/^\d{12}$/.test(cccd)) {
            throw new Error('CCCD phải có 12 chữ số');
        }

        if (!/^\d{10}$/.test(phone_number)) {
            throw new Error('Số điện thoại phải có 10 chữ số');
        }

        // Kiểm tra batch tồn tại và trạng thái
        const batchCheck = await client.query(
            'SELECT status FROM declaration_batch WHERE id = $1 FOR UPDATE',
            [batch_id]
        );

        if (batchCheck.rows.length === 0) {
            throw new Error('Không tìm thấy đợt kê khai');
        }

        if (batchCheck.rows[0].status !== 'pending') {
            throw new Error('Đợt kê khai đã đóng');
        }

        // Tính actual_amount
        const actual_amount = calculateActualAmount(
            object_type,
            participant_number,
            months
        );

        if (isEdit) {
            // Kiểm tra xem mã BHXH có thay đổi không
            const isBHXHChanged = bhxh_code !== originalBhxhCode;
            
            // Nếu mã BHXH thay đổi, kiểm tra trùng
            if (isBHXHChanged) {
                const existingBHXH = await client.query(
                    `SELECT id, full_name FROM declarations 
                    WHERE bhxh_code = $1 
                    AND batch_id = $2
                    AND deleted_at IS NULL`,
                    [bhxh_code, batch_id]
                );

                if (existingBHXH.rows.length > 0) {
                    throw new Error(`Mã BHXH ${bhxh_code} đã được kê khai cho người tham gia ${existingBHXH.rows[0].full_name} trong đợt này`);
                }
            }

            // Kiểm tra trùng CCCD với các bản ghi khác
            const existingCCCD = await client.query(
                `SELECT id, full_name FROM declarations 
                WHERE cccd = $1 
                AND batch_id = $2 
                AND bhxh_code != $3
                AND deleted_at IS NULL`,
                [cccd, batch_id, originalBhxhCode]
            );

            if (existingCCCD.rows.length > 0) {
                throw new Error(`CCCD ${cccd} đã được kê khai cho người tham gia ${existingCCCD.rows[0].full_name} trong đợt này`);
            }

            // Nếu mã BHXH thay đổi, tạạạạạạạạạạạạo bản ghi mới
            if (isBHXHChanged) {
                result = await client.query(
                    `INSERT INTO declarations (
                        user_id, batch_id, object_type,
                        bhxh_code, full_name, birth_date, gender, cccd,
                        phone_number, receipt_date, receipt_number,
                        old_card_expiry_date, new_card_effective_date,
                        months, plan, commune, hamlet,
                        participant_number, hospital_code, actual_amount,
                        status, created_by
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'pending', $21)
                    RETURNING *`,
                    [
                        user.id, batch_id, object_type,
                        bhxh_code.trim(), full_name.trim(), birth_date, gender, cccd,
                        phone_number, receipt_date, receipt_number?.trim(),
                        old_card_expiry_date, new_card_effective_date,
                        months, plan, commune, hamlet?.trim(),
                        participant_number, hospital_code, actual_amount,
                        user.id
                    ]
                );
            } else {
                // Cập nhật bản ghi hiện tại nếu không thay đổi mã BHXH
                result = await client.query(
                    `UPDATE declarations 
                    SET 
                        object_type = $1,
                        full_name = $2,
                        birth_date = $3,
                        gender = $4,
                        phone_number = $5,
                        receipt_date = $6,
                        receipt_number = $7,
                        old_card_expiry_date = $8,
                        new_card_effective_date = $9,
                        months = $10,
                        plan = $11,
                        commune = $12,
                        hamlet = $13,
                        participant_number = $14,
                        hospital_code = $15,
                        actual_amount = $16,
                        cccd = $17,
                        updated_at = CURRENT_TIMESTAMP,
                        updated_by = $18
                    WHERE bhxh_code = $19 AND batch_id = $20
                    RETURNING *`,
                    [
                        object_type,
                        full_name.trim(),
                        birth_date,
                        gender,
                        phone_number,
                        receipt_date,
                        receipt_number?.trim(),
                        old_card_expiry_date,
                        new_card_effective_date,
                        months,
                        plan,
                        commune,
                        hamlet?.trim(),
                        participant_number,
                        hospital_code,
                        actual_amount,
                        cccd,
                        user.id,
                        originalBhxhCode,
                        batch_id
                    ]
                );
            }
        } else {
            // Kiểm tra mã BHXH đã được kê khai trong bất kỳ batch nào chưa
            const existingBHXH = await client.query(
                `SELECT d.id, d.full_name, b.name as batch_name, b.month, b.year 
                FROM declarations d
                JOIN declaration_batch b ON d.batch_id = b.id
                WHERE d.bhxh_code = $1 
                AND d.deleted_at IS NULL
                AND b.deleted_at IS NULL
                AND b.status = 'pending'`,
                [bhxh_code]
            );

            if (existingBHXH.rows.length > 0) {
                const existingRecord = existingBHXH.rows[0];
                throw new Error(
                    `Mã BHXH ${bhxh_code} đã được kê khai cho người tham gia ${existingRecord.full_name} ` +
                    `trong đợt "${existingRecord.batch_name}" (tháng ${existingRecord.month}/${existingRecord.year})`
                );
            }

            // Kiểm tra trùng CCCD chỉ trong cùng batch
            const existingCCCD = await client.query(
                `SELECT d.id, d.full_name, b.name as batch_name 
                FROM declarations d
                JOIN declaration_batch b ON d.batch_id = b.id
                WHERE d.cccd = $1 
                AND d.deleted_at IS NULL
                AND b.deleted_at IS NULL
                AND b.status = 'pending'
                AND d.bhxh_code != $2`,
                [cccd, bhxh_code]
            );

            if (existingCCCD.rows.length > 0) {
                const existingRecord = existingCCCD.rows[0];
                throw new Error(
                    `CCCD ${cccd} đã được kê khai cho người tham gia ${existingRecord.full_name} trong đợt "${existingRecord.batch_name}"`
                );
            }

            // Tạo bản ghi mới
            result = await client.query(
                `INSERT INTO declarations (
                    user_id, batch_id, object_type,
                    bhxh_code, full_name, birth_date, gender, cccd,
                    phone_number, receipt_date, receipt_number,
                    old_card_expiry_date, new_card_effective_date,
                    months, plan, commune, hamlet,
                    participant_number, hospital_code, actual_amount,
                    status, created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'pending', $21)
                RETURNING *`,
                [
                    user.id, batch_id, object_type,
                    bhxh_code.trim(), full_name.trim(), birth_date, gender, cccd,
                    phone_number, receipt_date, receipt_number?.trim(),
                    old_card_expiry_date, new_card_effective_date,
                    months, plan, commune, hamlet?.trim(),
                    participant_number, hospital_code, actual_amount,
                    user.id
                ]
            );

            // Cập nhật số lượng kê khai trong đợt
            await client.query(
                `UPDATE declaration_batch 
                SET total_declarations = total_declarations + 1,
                updated_at = CURRENT_TIMESTAMP
                WHERE id = $1`,
                [batch_id]
            );
        }

        // Cập nhật tổng số tiền của đợt
        await updateBatchTotalAmount(client, batch_id);

        await client.query('COMMIT');

        // Thêm display_code vào response
        const response = {
            ...result.rows[0],
            display_code: `${result.rows[0].bhxh_code}-${result.rows[0].batch_id}`
        };

        res.json({
            success: true,
            message: isEdit 
                ? `Đã cập nhật thông tin kê khai cho mã BHXH ${bhxh_code}`
                : `Đã tạo kê khai mới với mã BHXH ${bhxh_code}`,
            data: response
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Create declaration error:', error);

        if (error.code === '23505') { // Unique violation
            res.status(400).json({
                success: false,
                message: 'Dữ liệu bị trùng lặp',
                error: error.detail
            });
        } else if (error.code === '23503') { // Foreign key violation
            res.status(400).json({
                success: false,
                message: 'Dữ liệu tham chiếu không tồn tại',
                error: error.detail
            });
        } else {
            res.status(400).json({
                success: false,
                message: error.message || 'Có lỗi xảy ra khi tạo kê khai',
                error: error.message
            });
        }
    } finally {
        client.release();
    }
};

// Delete declaration
const deleteDeclaration = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { id } = req.params;

        // Lấy batch_id trước khi xóa
        const declaration = await client.query(
            'SELECT batch_id FROM declarations WHERE id = $1',
            [id]
        );

        if (declaration.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy kê khai'
            });
        }

        const batch_id = declaration.rows[0].batch_id;

        // Soft delete kê khai
        await client.query(
            'UPDATE declarations SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );

        // Cập nhật số lượng kê khai trong đợt
        await client.query(
            `UPDATE declaration_batch 
             SET total_declarations = total_declarations - 1
             WHERE id = $1`,
            [batch_id]
        );

        // Cập nhật tổng số tiền của đợt
        await updateBatchTotalAmount(client, batch_id);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Xóa kê khai thành công'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting declaration:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa kê khai'
        });
    } finally {
        client.release();
    }
};

// Search BHXH information
const searchBHXH = async (req, res) => {
    try {
        const { bhxh_code, full_name, cccd, phone_number } = req.query;

        // Xây dựng câu query động
        let queryConditions = [];
        let queryParams = [];
        let paramCount = 1;

        if (bhxh_code) {
            queryConditions.push(`bhxh_code = $${paramCount}`);
            queryParams.push(bhxh_code.trim());
            paramCount++;
        }

        if (full_name) {
            queryConditions.push(`LOWER(full_name) LIKE LOWER($${paramCount})`);
            queryParams.push(`%${full_name}%`);
            paramCount++;
        }

        if (cccd) {
            queryConditions.push(`cccd = $${paramCount}`);
            queryParams.push(cccd);
            paramCount++;
        }

        if (phone_number) {
            queryConditions.push(`phone_number = $${paramCount}`);
            queryParams.push(phone_number);
            paramCount++;
        }

        // Nếu không có điều kiện tìm kiếm
        if (queryConditions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập ít nhất một điều kiện tìm kiếm'
            });
        }

        // Tìm thông tin mới nhất từ bảng declarations, bao gồm cả records đã xóa
        const result = await pool.query(
            `WITH RankedDeclarations AS (
                SELECT 
                    d.*,
                    ROW_NUMBER() OVER (
                        PARTITION BY d.bhxh_code 
                        ORDER BY d.created_at DESC
                    ) as rn
                FROM declarations d
                WHERE (${queryConditions.join(' OR ')})
            )
            SELECT 
                bhxh_code, full_name, birth_date, gender, cccd,
                phone_number, old_card_expiry_date, new_card_effective_date,
                months, plan, commune, hamlet, participant_number, hospital_code,
                object_type, receipt_date, receipt_number
            FROM RankedDeclarations
            WHERE rn = 1`,
            queryParams
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin BHYT'
            });
        }

        // Format dates
        const data = result.rows[0];
        if (data.birth_date) {
            data.birth_date = data.birth_date.toISOString().split('T')[0];
        }
        if (data.old_card_expiry_date) {
            data.old_card_expiry_date = data.old_card_expiry_date.toISOString().split('T')[0];
        }
        if (data.new_card_effective_date) {
            data.new_card_effective_date = data.new_card_effective_date.toISOString().split('T')[0];
        }
        if (data.receipt_date) {
            data.receipt_date = data.receipt_date.toISOString().split('T')[0];
        }

        res.json({
            success: true,
            message: 'Tìm thấy thông tin BHYT',
            data: data
        });
    } catch (error) {
        console.error('Error searching BHXH:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi tm kiếm thông tin BHYT'
        });
    }
};

// Submit batch
const submitBatch = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        
        // Kiểm tra batch tồn tại
        const batchResult = await client.query(
            'SELECT * FROM declaration_batch WHERE id = $1',
            [id]
        );
        
        if (batchResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Không tìm thấy đợt kê khai' 
            });
        }

        const batch = batchResult.rows[0];
        
        // Kiểm tra trạng thái
        if (batch.status !== 'pending') {
            return res.status(400).json({ 
                success: false,
                message: 'ợt kê khai không ở trạng thái chờ gửi' 
            });
        }

        // Kiểm tra có kê khai nào không
        const declarationsResult = await client.query(
            'SELECT COUNT(*) FROM declarations WHERE batch_id = $1 AND deleted_at IS NULL',
            [id]
        );

        if (parseInt(declarationsResult.rows[0].count) === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'Đợt kê khai chưa có bản ghi nào' 
            });
        }

        // Cập nhật tổng số tiền của đợt
        await updateBatchTotalAmount(client, id);

        // Cập nhật trạng thái batch
        const result = await client.query(`
            UPDATE declaration_batch 
            SET status = 'submitted',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `, [id]);

        // Cập nhật trạng thái các kê khai
        await client.query(`
            UPDATE declarations 
            SET status = 'submitted',
                updated_at = CURRENT_TIMESTAMP
            WHERE batch_id = $1 AND status = 'pending' AND deleted_at IS NULL
        `, [id]);

        await client.query('COMMIT');
        res.json({
            success: true,
            message: 'Gửi đợt kê khai thành công',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Submit batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi gửi đợt kê khai',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Get batches for admin
const getAdminBatches = async (req, res) => {
    const client = await pool.connect();
    try {
        // Lấy danh sách đợt kê khai đã ược gửi
        const result = await client.query(`
            SELECT 
                db.*,
                u.username as employee_username,
                u.full_name as employee_name,
                u.department_code,
                COUNT(d.id) as total_declarations,
                db.total_amount
            FROM declaration_batch db
            LEFT JOIN users u ON db.created_by = u.id
            LEFT JOIN declarations d ON db.id = d.batch_id AND d.deleted_at IS NULL
            WHERE db.deleted_at IS NULL
            GROUP BY db.id, u.id, u.username, u.full_name, u.department_code
            ORDER BY db.created_at DESC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error getting admin batches:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy danh sách đợt kê khai'
        });
    } finally {
        client.release();
    }
};

// Approve batch
const approveBatch = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        const { notes } = req.body;
        
        // Kiểm tra batch tồn tại
        const batchResult = await client.query(
            'SELECT * FROM declaration_batch WHERE id = $1',
            [id]
        );
        
        if (batchResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Không tìm thấy đợt kê khai' 
            });
        }

        const batch = batchResult.rows[0];
        
        // Kiểm tra trạng thái
        if (batch.status !== 'submitted') {
            return res.status(400).json({ 
                success: false,
                message: 'Chỉ có thể duyệt đợt kê khai ở trạng thái đã nộp' 
            });
        }

        // Cập nhật trạng thái batch
        const result = await client.query(`
            UPDATE declaration_batch 
            SET status = 'approved',
                approved_by = $1,
                approved_at = CURRENT_TIMESTAMP,
                admin_notes = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [req.user.id, notes, id]);

        // Cập nhật trạng thái các kê khai
        await client.query(`
            UPDATE declarations 
            SET status = 'approved',
                updated_at = CURRENT_TIMESTAMP
            WHERE batch_id = $1 AND status = 'submitted'
        `, [id]);

        await client.query('COMMIT');
        res.json({
            success: true,
            message: 'Duyệt đợt kê khai thành công',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Approve batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi duyệt đợt kê khai',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Reject batch
const rejectBatch = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { id } = req.params;
        const { notes } = req.body;
        
        if (!notes) {
            return res.status(400).json({ 
                success: false,
                message: 'Vui lòng nhập lý do từ chối' 
            });
        }

        // Kiểm tra batch tồn tại
        const batchResult = await client.query(
            'SELECT * FROM declaration_batch WHERE id = $1',
            [id]
        );
        
        if (batchResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Không tìm thấy đợt kê khai' 
            });
        }

        const batch = batchResult.rows[0];
        
        // Kiểm tra trạng thái
        if (batch.status !== 'submitted') {
            return res.status(400).json({ 
                success: false,
                message: 'Chỉ có thể từ chối đợt kê khai ở trạng thái đã nộp' 
            });
        }

        // Cập nhật trạng thái batch
        const result = await client.query(`
            UPDATE declaration_batch 
            SET status = 'rejected',
                rejected_by = $1,
                rejected_at = CURRENT_TIMESTAMP,
                admin_notes = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $3
            RETURNING *
        `, [req.user.id, notes, id]);

        // Cập nhật trạng thái các kê khai
        await client.query(`
            UPDATE declarations 
            SET status = 'rejected',
                updated_at = CURRENT_TIMESTAMP
            WHERE batch_id = $1 AND status = 'submitted'
        `, [id]);

        await client.query('COMMIT');
        res.json({
            success: true,
            message: 'Từ chối đợt kê khai thành công',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Reject batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi từ chối đợt kê khai',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Hàm cập nhật tổng số tiền cho tất cả các đợt kê khai
const updateAllBatchesTotalAmount = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Cập nhật tổng số tiền cho tất cả các đợt kê khai
        await client.query(`
            UPDATE declaration_batch db
            SET total_amount = (
                SELECT COALESCE(SUM(d.actual_amount), 0)
                FROM declarations d
                WHERE d.batch_id = db.id AND d.deleted_at IS NULL
            )
        `);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Có lỗi xảy ra khi cập nhật tổng số tiền cho tất cả các đợt kê khai'
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating all batches total amount:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi cập nhật tổng số tiền'
        });
    } finally {
        client.release();
    }
};

// Xác nhận thanh toán cho batch
const confirmBatchPayment = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const user = req.user;

        await client.query('BEGIN');

        // Kiểm tra batch có tồn tại không và lấy thông tin
        const batchCheck = await client.query(
            'SELECT * FROM declaration_batch WHERE id = $1 FOR UPDATE',
            [id]
        );

        if (batchCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đợt kê khai'
            });
        }

        const batch = batchCheck.rows[0];

        // Kiểm tra trạng thái hiện tại
        if (batch.payment_status === 'paid') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Đợt kê khai này đã được thanh toán'
            });
        }

        // Cập nhật trạng thái đã thanh toán
        const result = await client.query(
            `UPDATE declaration_batch 
            SET payment_status = $1::text,
                payment_date = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP,
                updated_by = $2
            WHERE id = $3
            RETURNING *`,
            ['paid', user.id, id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Xác nhận thanh toán thành công',
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Confirm payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xác nhận thanh toán',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Xử lý hồ sơ
const processBatch = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const user = req.user;

        await client.query('BEGIN');

        // Kiểm tra batch có tồn tại không và lấy thông tin
        const batchCheck = await client.query(
            'SELECT * FROM declaration_batch WHERE id = $1 FOR UPDATE',
            [id]
        );

        if (batchCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đợt kê khai'
            });
        }

        const batch = batchCheck.rows[0];

        // Kiểm tra điều kiện để xử lý
        if (batch.status !== 'approved') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Đợt kê khai chưa được duyệt'
            });
        }

        if (batch.payment_status !== 'paid') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Đợt kê khai chưa được thanh toán'
            });
        }

        // Cập nhật trạng thái đang xử lý
        const result = await client.query(
            `UPDATE declaration_batch 
            SET status = 'processing',
                updated_at = CURRENT_TIMESTAMP,
                updated_by = $1
            WHERE id = $2
            RETURNING *`,
            [user.id, id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Đã chuyển hồ sơ sang trạng thái xử lý',
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Process batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xử lý hồ sơ',
            error: error.message
        });
    } finally {
        client.release();
    }
};

// Hoàn thành xử lý hồ sơ
const completeBatch = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const user = req.user;

        await client.query('BEGIN');

        // Kiểm tra batch có tồn tại không và lấy thông tin
        const batchCheck = await client.query(
            'SELECT * FROM declaration_batch WHERE id = $1 FOR UPDATE',
            [id]
        );

        if (batchCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đợt kê khai'
            });
        }

        const batch = batchCheck.rows[0];

        // Kiểm tra điều kiện để hoàn thành
        if (batch.status !== 'processing') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Đợt kê khai chưa được xử lý'
            });
        }

        // Cập nhật trạng thái hoàn thành
        const result = await client.query(
            `UPDATE declaration_batch 
            SET status = 'completed',
                updated_at = CURRENT_TIMESTAMP,
                updated_by = $1
            WHERE id = $2
            RETURNING *`,
            [user.id, id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Đã hoàn thành xử lý hồ sơ',
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Complete batch error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi hoàn thành xử lý hồ sơ',
            error: error.message
        });
    } finally {
        client.release();
    }
};

const exportBatchToExcel = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Lấy thông tin đợt kê khai
        const batchResult = await pool.query(
            'SELECT * FROM declaration_batch WHERE id = $1',
            [id]
        );
        
        if (batchResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đợt kê khai'
            });
        }

        const batch = batchResult.rows[0];

        // Hàm chuyển đổi mã đối tượng sang tên đầy đủ
        const getFullObjectTypeName = (code) => {
            const objectTypes = {
                'DTTS': 'Dân tộc thiểu số đang sinh sống tại vùng có ĐK KTXH khó khăn',
                'HGD': 'Hộ gia đình',
                'NLNN': 'Nông lâm ngư nghiệp',
            };
            return objectTypes[code] || code;
        };

        // Đọc file mẫu Excel
        const templatePath = path.join(__dirname, '../templates/declaration_template.xlsx');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);
        const worksheet = workbook.getWorksheet(1);

        // Điền thông tin số đợt, tháng, năm vào ô G6
        worksheet.getCell('G6').value = `Số ${batch.batch_number} tháng ${batch.month} năm ${batch.year}`;

        // Điền đối tượng tham gia vào ô B8
        worksheet.getCell('B8').value = `Đối tượng tham gia: ${getFullObjectTypeName(batch.object_type)}`;

        // Điền mã đối tượng vào ô E8
        if (batch.object_type === 'HGD') {
            worksheet.getCell('E8').value = 'Mã đối tượng: GD';
        } else if (batch.object_type === 'DTTS') {
            worksheet.getCell('E8').value = 'Mã đối tượng: DT';
        }

        // Lấy danh sách kê khai trong đợt
        const declarations = await pool.query(
            `SELECT * FROM declarations
             WHERE batch_id = $1 
             ORDER BY created_at ASC`,
            [id]
        );

        // Nếu có kê khai, điền thông tin vào các ô
        if (declarations.rows.length > 0) {
            // Tính tổng số tiền của đợt từ cột actual_amount
            const totalAmount = declarations.rows.reduce((sum, declaration) => {
                const amount = parseFloat(declaration.actual_amount) || 0;
                return sum + amount;
            }, 0);

            // Điền tổng số tiền vào ô K18 với định dạng số
            const cellK18 = worksheet.getCell('K18');
            cellK18.value = Math.round(totalAmount); // Làm tròn số
            cellK18.numFmt = '#,##0'; // Định dạng số có dấu phân cách hàng nghìn

            declarations.rows.forEach((declaration, index) => {
                const rowNumber = 15 + index; // Bắt đầu từ dòng 15 và tăng dần
                
                // Thêm dòng mới cho các bản ghi thứ 2 trở đi
                if (index > 0) {
                    worksheet.insertRow(rowNumber, []); // Chèn dòng trống
                    // Copy style từ dòng 15
                    worksheet.getRow(rowNumber).style = worksheet.getRow(15).style;
                    // Set chiều cao cho dòng mới
                    worksheet.getRow(rowNumber).height = 60;
                    
                    // Kẻ bảng cho các ô trong dòng mới
                    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'].forEach(col => {
                        worksheet.getCell(`${col}${rowNumber}`).border = {
                            top: {style:'thin'},
                            left: {style:'thin'},
                            bottom: {style:'thin'},
                            right: {style:'thin'}
                        };
                    });
                }

                // Thêm số thứ tự
                worksheet.getCell(`A${rowNumber}`).value = index + 1;

                // Định dạng ngày sinh
                const birthDate = new Date(declaration.birth_date);
                const formattedBirthDate = birthDate.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });

                // Định dạng địa chỉ
                const address = `${declaration.hamlet ? declaration.hamlet + ', ' : ''}${declaration.address}`;

                // Điền thông tin vào các ô
                worksheet.getCell(`B${rowNumber}`).value = declaration.full_name;
                worksheet.getCell(`C${rowNumber}`).value = declaration.bhxh_code;
                worksheet.getCell(`D${rowNumber}`).value = declaration.cccd;
                worksheet.getCell(`E${rowNumber}`).value = formattedBirthDate;
                worksheet.getCell(`F${rowNumber}`).value = declaration.gender;
                worksheet.getCell(`G${rowNumber}`).value = address;
                worksheet.getCell(`H${rowNumber}`).value = declaration.hospital_code; // Mã bệnh viện đăng ký KCB
                
                // Định dạng ngày biên lai
                const receiptDate = declaration.receipt_date ? new Date(declaration.receipt_date) : null;
                worksheet.getCell(`I${rowNumber}`).value = receiptDate ? receiptDate.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }) : '';
                
                worksheet.getCell(`J${rowNumber}`).value = declaration.receipt_number; // Số biên lai
                worksheet.getCell(`K${rowNumber}`).value = Math.round(parseFloat(declaration.actual_amount) || 0);
                worksheet.getCell(`K${rowNumber}`).numFmt = '#,##0';
                
                // Định dạng ngày thẻ mới có hiệu lực
                const newCardEffectiveDate = declaration.new_card_effective_date ? new Date(declaration.new_card_effective_date) : null;
                worksheet.getCell(`N${rowNumber}`).value = newCardEffectiveDate ? newCardEffectiveDate.toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }) : '';
                
                worksheet.getCell(`O${rowNumber}`).value = declaration.months; // Số th
            });
        }

        // Gửi file Excel về client
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Danh_sach_ke_khai_dot_${batch.batch_number}_${batch.month}_${batch.year}.xlsx`);
        
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Export Excel error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xuất Excel',
            error: error.message
        });
    }
};

// Soft delete declaration
const softDeleteDeclaration = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await client.query('BEGIN');

        // Kiểm tra quyền và tồn tại của bản ghi
        const declarationCheck = await client.query(
            `SELECT d.*, b.status as batch_status 
             FROM declarations d
             JOIN declaration_batch b ON d.batch_id = b.id
             WHERE d.id = $1 AND d.created_by = $2`,
            [id, userId]
        );

        if (declarationCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản ghi hoặc bạn không có quyền xóa'
            });
        }

        const declaration = declarationCheck.rows[0];

        // Chỉ cho phép xóa khi đợt ở trạng thái chờ xử lý
        if (declaration.batch_status !== 'pending') {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể xóa bản ghi trong đợt chờ xử lý'
            });
        }

        // Thực hiện soft delete
        await client.query(
            `UPDATE declarations 
             SET deleted_at = CURRENT_TIMESTAMP,
                 deleted_by = $1
             WHERE id = $2`,
            [userId, id]
        );

        // Cập nhật số lượng bản ghi trong đợt
        await client.query(
            `UPDATE declaration_batch 
             SET total_declarations = total_declarations - 1,
                 updated_at = CURRENT_TIMESTAMP,
                 updated_by = $1
             WHERE id = $2`,
            [userId, declaration.batch_id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Xóa bản ghi thành công'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error soft deleting declaration:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi xóa bản ghi'
        });
    } finally {
        client.release();
    }
};

// Get employee declarations
const getEmployeeDeclarations = async (req, res) => {
    try {
        const userId = req.user.id;
        const declarations = await pool.query(
            `SELECT d.*, 
                    CONCAT(d.bhxh_code, '-', d.batch_id) as display_code
             FROM declarations d
             JOIN declaration_batch b ON d.batch_id = b.id
             WHERE d.created_by = $1 
             AND d.deleted_at IS NULL
             AND b.deleted_at IS NULL
             ORDER BY d.created_at DESC`,
            [userId]
        );

        res.json(declarations.rows);
    } catch (error) {
        console.error('Error getting employee declarations:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy danh sách kê khai'
        });
    }
};

// Tra cứu lịch sử kê khai của một mã BHXH
const getBHXHHistory = async (req, res) => {
    try {
        const { bhxh_code } = req.params;
        
        // Lấy lịch sử kê khai của mã BHXH
        const history = await pool.query(
            `SELECT 
                d.*,
                CONCAT(d.bhxh_code, '-', d.batch_id) as display_code,
                b.name as batch_name,
                b.month as batch_month,
                b.year as batch_year,
                b.status as batch_status,
                b.payment_status,
                b.object_type,
                b.service_type
             FROM declarations d
             JOIN declaration_batch b ON d.batch_id = b.id
             WHERE d.bhxh_code = $1 
             AND d.deleted_at IS NULL
             AND b.deleted_at IS NULL
             ORDER BY b.year DESC, b.month DESC, b.batch_number DESC`,
            [bhxh_code]
        );

        if (history.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy lịch sử kê khai cho mã BHXH này'
            });
        }

        // Định dạng lại dữ liệu để dễ đọc
        const formattedHistory = history.rows.map(record => ({
            id: record.id,
            display_code: record.display_code,
            batch_info: {
                id: record.batch_id,
                name: record.batch_name,
                month: record.batch_month,
                year: record.batch_year,
                status: record.batch_status,
                payment_status: record.payment_status,
                object_type: record.object_type,
                service_type: record.service_type
            },
            personal_info: {
                full_name: record.full_name,
                birth_date: record.birth_date,
                gender: record.gender,
                cccd: record.cccd,
                phone_number: record.phone_number
            },
            declaration_info: {
                months: record.months,
                plan: record.plan,
                participant_number: record.participant_number,
                actual_amount: record.actual_amount,
                status: record.status,
                receipt_date: record.receipt_date,
                receipt_number: record.receipt_number,
                old_card_expiry_date: record.old_card_expiry_date,
                new_card_effective_date: record.new_card_effective_date
            },
            address: {
                commune: record.commune,
                hamlet: record.hamlet
            },
            hospital_code: record.hospital_code,
            created_at: record.created_at
        }));

        res.json({
            success: true,
            message: `Tìm thấy ${history.rows.length} lần kê khai cho mã BHXH ${bhxh_code}`,
            data: formattedHistory
        });

    } catch (error) {
        console.error('Error getting BHXH history:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra khi lấy lịch sử kê khai'
        });
    }
};

module.exports = {
    getEmployeeBatches,
    getBatchById,
    getDeclarationsByBatchId,
    createEmployeeBatch,
    updateBatch,
    deleteEmployeeBatch,
    createDeclaration,
    deleteDeclaration,
    searchBHXH,
    submitBatch,
    getAdminBatches,
    approveBatch,
    rejectBatch,
    updateAllBatchesTotalAmount,
    confirmBatchPayment,
    processBatch,
    completeBatch,
    exportBatchToExcel,
    softDeleteDeclaration,
    getEmployeeDeclarations,
    getBHXHHistory
};