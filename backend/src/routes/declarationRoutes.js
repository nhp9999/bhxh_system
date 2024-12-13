const express = require('express');
const router = express.Router();
const declarationController = require('../controllers/declarationController');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');
const XlsxPopulate = require('xlsx-populate');
const path = require('path');

// Route xác nhận thanh toán
router.post('/batch/:id/confirm-payment', authenticateToken, declarationController.confirmBatchPayment);

// Route soft delete declaration
router.delete('/employee/:id/soft-delete', authenticateToken, declarationController.softDeleteDeclaration);

// Route lấy danh sách declarations theo batch_id
router.get('/batch/:id', authenticateToken, declarationController.getDeclarationsByBatchId);

// Route tra cứu lịch sử kê khai của một mã BHXH
router.get('/history/:bhxh_code', authenticateToken, declarationController.getBHXHHistory);

// Thêm các routes mới cho admin
router.get('/declarations/admin/batch/:id', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        
        // Lấy th��ng tin batch
        const batchResult = await client.query(`
            SELECT 
                db.*,
                u.username as employee_username,
                u.full_name as employee_name,
                u.department_code
            FROM declaration_batch db
            LEFT JOIN users u ON db.created_by = u.id
            WHERE db.id = $1 AND db.deleted_at IS NULL
        `, [id]);

        if (batchResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Không tìm thấy đợt kê khai'
            });
        }

        res.json(batchResult.rows[0]);
    } catch (error) {
        console.error('Error getting batch details:', error);
        res.status(500).json({
            message: 'Có lỗi xảy ra khi lấy thông tin đợt kê khai'
        });
    } finally {
        client.release();
    }
});

// API lấy danh sách declarations trong batch
router.get('/declarations/admin/batch/:id/declarations', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        
        const declarationsResult = await client.query(`
            SELECT 
                d.*,
                db.name as batch_name,
                db.status as batch_status
            FROM declarations d
            LEFT JOIN declaration_batch db ON d.batch_id = db.id
            WHERE d.batch_id = $1 AND d.deleted_at IS NULL
            ORDER BY d.created_at DESC
        `, [id]);

        res.json(declarationsResult.rows);
    } catch (error) {
        console.error('Error getting batch declarations:', error);
        res.status(500).json({
            message: 'Có lỗi xảy ra khi lấy danh sách kê khai'
        });
    } finally {
        client.release();
    }
});

// Route xuất Excel
router.get('/declarations/admin/batch/:id/export', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        // Lấy thông tin batch và declarations song song
        const [batchResult, declarationsResult] = await Promise.all([
            client.query(`
                SELECT 
                    db.*,
                    u.full_name as employee_name,
                    u.department_code
                FROM declaration_batch db
                LEFT JOIN users u ON db.created_by = u.id
                WHERE db.id = $1
            `, [id]),
            client.query(`
                SELECT 
                    d.*,
                    d.plan,
                    d.hospital_code,
                    d.commune,
                    d.hamlet,
                    db.name as batch_name
                FROM declarations d
                LEFT JOIN declaration_batch db ON d.batch_id = db.id
                WHERE d.batch_id = $1 AND d.deleted_at IS NULL
                ORDER BY d.created_at ASC
            `, [id])
        ]);

        const batch = batchResult.rows[0];
        const declarations = declarationsResult.rows;

        // Đọc file template
        const templatePath = path.join(__dirname, '..', 'templates', 'IMPORT_VNPT_BHXH.xlsx');
        const workbook = await XlsxPopulate.fromFileAsync(templatePath);
        const sheet = workbook.sheet(0);

        // Điền mã đối tượng vào D2 và đối tượng vào D5
        sheet.cell("D2").value(batch.object_type);
        sheet.cell("D5").value(batch.object_type === 'HGD' ? 'Hộ gia đình' : 
                             batch.object_type === 'DTTS' ? 'Dân tộc thiểu số' : 
                             'Nông lâm ngư nghiệp');

        // Điền dữ liệu từ dòng 9
        declarations.forEach((declaration, index) => {
            const row = index + 9;
            
            // Log để debug
            console.log('Row:', row);
            console.log('Payment method:', declaration.payment_method);
            
            // Các cột cũ giữ nguyên
            sheet.cell(`B${row}`).value(declaration.bhxh_code);
            sheet.cell(`C${row}`).value(declaration.full_name);
            sheet.cell(`D${row}`).value(new Date(declaration.birth_date).toLocaleDateString('vi-VN'));
            sheet.cell(`E${row}`).value(declaration.gender === 'female' ? 'Nữ' : 'Nam');
            sheet.cell(`F${row}`).value(declaration.cccd);
            sheet.cell(`G${row}`).value(declaration.phone_number);
            sheet.cell(`H${row}`).value(batch.department_code);
            sheet.cell(`I${row}`).value(declaration.effective_date ? new Date(declaration.effective_date).toLocaleDateString('vi-VN') : '');
            sheet.cell(`J${row}`).value(declaration.receipt_number || '');

            // Thêm các cột mới
            sheet.cell(`K${row}`).value(declaration.old_card_expire_date ? new Date(declaration.old_card_expire_date).toLocaleDateString('vi-VN') : '');
            sheet.cell(`L${row}`).value(declaration.new_card_effective_date ? new Date(declaration.new_card_effective_date).toLocaleDateString('vi-VN') : '');
            sheet.cell(`M${row}`).value(declaration.months || '');
            sheet.cell(`N${row}`).value('1');

            // Phương án đóng - cột O
            const paymentCell = sheet.cell(`O${row}`);
            paymentCell.value(declaration.plan || 'TM');
            paymentCell.style({
                horizontalAlignment: "center",
                verticalAlignment: "center"
            });

            // Các cột địa chỉ và thông tin bệnh viện - điền giá trị mặc định và từ DB
            sheet.cell(`P${row}`).value('An Giang'); // Tỉnh/Thành phố - mặc định An Giang
            sheet.cell(`Q${row}`).value(declaration.hospital_code || ''); // Mã bệnh viện từ DB
            sheet.cell(`R${row}`).value('An Giang'); // Tỉnh/Thành phố - mặc định An Giang
            sheet.cell(`S${row}`).value('Thị xã Tịnh Biên'); // Quận/Huyện - mặc định
            sheet.cell(`T${row}`).value(declaration.commune || ''); // Xã/Phường từ DB
            sheet.cell(`U${row}`).value(declaration.hamlet || ''); // Khóm/Ấp từ DB
            sheet.cell(`W${row}`).value(declaration.member_count || 1);
        });

        // Xuất file
        const fileName = `IMPORT_VNPT_BHXH_${batch.department_code}_${batch.month}_${batch.year}_${batch.batch_number}.xlsx`;
        const buffer = await workbook.outputAsync();

        // Đảm bảo headers chưa được gửi
        if (!res.headersSent) {
            // Set headers
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.setHeader('Content-Length', buffer.length);
            
            // Gửi buffer
            return res.send(buffer);
        }

    } catch (error) {
        console.error('Export error:', error);
        // Chỉ gửi error response nếu headers chưa được gửi
        if (!res.headersSent) {
            return res.status(500).json({
                message: 'Có lỗi xảy ra khi xuất file Excel',
                error: error.message
            });
        }
    } finally {
        await client.release();
    }
});

module.exports = router; 