// ... existing code ...

// Upload bill image for batch
exports.uploadBillImage = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!req.files || !req.files.bill_image) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy file ảnh'
            });
        }

        const billImage = req.files.bill_image;
        const fileExtension = billImage.name.split('.').pop();
        const fileName = `bill_${id}_${Date.now()}.${fileExtension}`;
        const uploadPath = path.join(__dirname, '../uploads/bills/', fileName);

        // Tạo thư mục nếu chưa tồn tại
        if (!fs.existsSync(path.join(__dirname, '../uploads/bills'))) {
            fs.mkdirSync(path.join(__dirname, '../uploads/bills'), { recursive: true });
        }

        // Upload file
        await billImage.mv(uploadPath);

        // Cập nhật đường dẫn ảnh trong database
        await pool.query(
            'UPDATE declaration_batches SET bill_image = ? WHERE id = ?',
            [fileName, id]
        );

        res.json({
            success: true,
            message: 'Upload ảnh bill thành công',
            data: { fileName }
        });
    } catch (error) {
        console.error('Error uploading bill image:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể upload ảnh bill'
        });
    }
};

// ... existing code ... 