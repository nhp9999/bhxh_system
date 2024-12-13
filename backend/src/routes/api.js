const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const declarationController = require('../controllers/declarationController');
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');
const fs = require('fs');
const path = require('path');
const pool = require('../config/database');
const fileUpload = require('express-fileupload');

// Sử dụng middleware fileUpload
router.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
}));

// Auth routes
router.post('/auth/login', authController.login);
router.get('/auth/me', auth.authenticateToken, authController.me);

// Admin dashboard routes
router.get('/admin/dashboard/stats', auth.authenticateToken, auth.requireAdmin, dashboardController.getAdminStats);

// Admin user management routes
router.get('/admin/users', auth.authenticateToken, auth.requireAdmin, userController.getUsers);
router.post('/admin/users', auth.authenticateToken, auth.requireAdmin, userController.createUser);
router.put('/admin/users/:id', auth.authenticateToken, auth.requireAdmin, userController.updateUser);
router.post('/admin/users/:id/toggle-status', auth.authenticateToken, auth.requireAdmin, userController.toggleUserStatus);
router.delete('/admin/users/:id', auth.authenticateToken, auth.requireAdmin, userController.deleteUser);

// Employee dashboard routes
router.get('/employee/dashboard/stats', auth.authenticateToken, dashboardController.getEmployeeStats);

// Employee batch routes
router.get('/declarations/employee/batches', auth.authenticateToken, declarationController.getEmployeeBatches);
router.get('/declarations/employee/batch/:id', auth.authenticateToken, declarationController.getBatchById);
router.get('/declarations/employee/batch/:id/declarations', auth.authenticateToken, declarationController.getDeclarationsByBatchId);
router.get('/declarations/employee/batch/:id/export-excel', auth.authenticateToken, declarationController.exportBatchToExcel);
router.post('/declarations/employee/batch', auth.authenticateToken, declarationController.createEmployeeBatch);
router.put('/declarations/employee/batch/:id', auth.authenticateToken, declarationController.updateBatch);
router.delete('/declarations/employee/batch/:id', auth.authenticateToken, declarationController.deleteEmployeeBatch);
router.post('/declarations/employee/batch/:id/submit', auth.authenticateToken, declarationController.submitBatch);

// Admin batch routes
router.get('/declarations/admin/batches', auth.authenticateToken, auth.requireAdmin, declarationController.getAdminBatches);
router.post('/declarations/admin/batch/:id/approve', auth.authenticateToken, auth.requireAdmin, declarationController.approveBatch);
router.post('/declarations/admin/batch/:id/reject', auth.authenticateToken, auth.requireAdmin, declarationController.rejectBatch);
router.post('/declarations/admin/batch/:id/file-code', auth.authenticateToken, auth.requireAdmin, declarationController.updateBatchFileCode);
router.post('/declarations/admin/batches/update-total-amount', auth.authenticateToken, auth.requireAdmin, declarationController.updateAllBatchesTotalAmount);

// Employee declaration routes
router.get('/declarations/search/bhxh', auth.authenticateToken, declarationController.searchBHXH);
router.post('/declarations/employee/declaration', auth.authenticateToken, declarationController.createDeclaration);
router.delete('/declarations/employee/declaration/:id', auth.authenticateToken, declarationController.deleteDeclaration);

// Payment routes
router.post('/declarations/employee/batch/:id/confirm-payment', auth.authenticateToken, declarationController.confirmBatchPayment);
router.post('/declarations/employee/batch/:id/upload-bill', auth.authenticateToken, async (req, res) => {
    console.log('Upload bill request:', {
        params: req.params,
        files: req.files,
        user: req.user
    });

    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        if (!req.files || !req.files.bill_image) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy file ảnh'
            });
        }

        // Kiểm tra quyền upload
        const batch = await client.query(
            'SELECT * FROM declaration_batch WHERE id = $1 AND created_by = $2',
            [id, userId]
        );

        if (batch.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy đợt kê khai'
            });
        }

        const billImage = req.files.bill_image;
        const fileExtension = billImage.name.split('.').pop();
        const fileName = `bill_${id}_${Date.now()}.${fileExtension}`;
        const uploadDir = path.join(__dirname, '../../uploads/bills');
        const uploadPath = path.join(uploadDir, fileName);

        console.log('Upload path:', {
            uploadDir,
            uploadPath,
            fileName
        });

        // Tạo thư mục nếu chưa tồn tại
        if (!fs.existsSync(uploadDir)) {
            console.log('Creating upload directory:', uploadDir);
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Upload file
        await billImage.mv(uploadPath);

        // Bắt đầu transaction
        await client.query('BEGIN');

        try {
            // Cập nhật đường dẫn ảnh trong database
            await client.query(
                'UPDATE declaration_batch SET bill_image = $1 WHERE id = $2 AND created_by = $3 RETURNING *',
                [fileName, id, userId]
            );

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Upload ảnh bill thành công',
                data: { fileName }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error uploading bill image:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể upload ảnh bill: ' + error.message
        });
    } finally {
        client.release();
    }
});

// Admin process routes
router.post('/declarations/admin/batch/:id/process', auth.authenticateToken, auth.requireAdmin, declarationController.processBatch);
router.post('/declarations/admin/batch/:id/complete', auth.authenticateToken, auth.requireAdmin, declarationController.completeBatch);

module.exports = router; 