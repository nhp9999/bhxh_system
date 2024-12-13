const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/adminMiddleware');
const declarationController = require('../controllers/declarationController');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const fileUpload = require('express-fileupload');

// Sử dụng middleware fileUpload
router.use(fileUpload({
    createParentPath: true,
    limits: { 
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
}));

// Employee routes
router.get('/employee', authMiddleware, declarationController.getEmployeeDeclarations);
router.get('/employee/:id', authMiddleware, declarationController.getEmployeeDeclarationDetail);

// Upload bill route
router.post('/employee/batch/:id/upload-bill', authMiddleware, async (req, res) => {
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

        // Cập nhật đường dẫn ảnh trong database
        await client.query(
            'UPDATE declaration_batch SET bill_image = $1 WHERE id = $2',
            [fileName, id]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Upload ảnh bill thành công',
            data: { fileName }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error uploading bill image:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể upload ảnh bill: ' + error.message
        });
    } finally {
        client.release();
    }
});

// Batch routes
router.get('/batches', authMiddleware, declarationController.getBatches);
router.post('/batch/:batch_id/submit', authMiddleware, declarationController.submitBatch);
router.get('/batch/:batch_id/status', authMiddleware, declarationController.getBatchStatus);
router.get('/batch/:batch_id/stats', authMiddleware, declarationController.getBatchStats);
router.get('/batch/:batch_id/history', authMiddleware, declarationController.getBatchHistory);
router.get('/batch/:batch_id/list', authMiddleware, declarationController.getDeclarationsByStatus);

// Public routes
router.get('/search', authMiddleware, declarationController.search);
router.get('/', authMiddleware, declarationController.list);
router.get('/batch/:batch_id', authMiddleware, declarationController.listByBatch);
router.post('/', authMiddleware, declarationController.create);

// Admin routes
router.post('/:id/approve', [authMiddleware, adminMiddleware], declarationController.approve);
router.post('/:id/reject', [authMiddleware, adminMiddleware], declarationController.reject);

module.exports = router; 