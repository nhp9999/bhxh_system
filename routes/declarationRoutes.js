const express = require('express');
const router = express.Router();

router.get('/declarations/batches/:id', async (req, res) => {
  try {
    const batchId = req.params.id;
    const batchData = {
      id: batchId,
      name: `Batch ${batchId}`,
      createdAt: new Date(),
      status: 'active'
    };
    
    if (!batchData) {
      return res.status(404).json({ message: 'Không tìm thấy batch' });
    }
    
    res.json(batchData);
  } catch (error) {
    console.error('Lỗi khi lấy thông tin batch:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/declarations', async (req, res) => {
  try {
    const newDeclaration = {
      id: Date.now(),
      createdAt: new Date(),
      status: 'draft',
      ...req.body
    };
    
    console.log('Đã tạo kê khai mới:', newDeclaration);
    
    res.status(201).json(newDeclaration);
  } catch (error) {
    console.error('Lỗi khi tạo kê khai:', error);
    res.status(500).json({ message: 'Lỗi server khi tạo kê khai' });
  }
});

module.exports = router; 