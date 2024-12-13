const express = require('express');
const router = express.Router();
const batchController = require('../controllers/batchController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, batchController.create);
// ... các route khác ... 