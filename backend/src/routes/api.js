const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const declarationController = require('../controllers/declarationController');
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

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
router.post('/declarations/admin/batches/update-total-amount', auth.authenticateToken, auth.requireAdmin, declarationController.updateAllBatchesTotalAmount);

// Employee declaration routes
router.get('/declarations/search/bhxh', auth.authenticateToken, declarationController.searchBHXH);
router.post('/declarations/employee/declaration', auth.authenticateToken, declarationController.createDeclaration);
router.delete('/declarations/employee/declaration/:id', auth.authenticateToken, declarationController.deleteDeclaration);

// Payment routes
router.post('/declarations/batch/:id/confirm-payment', auth.authenticateToken, declarationController.confirmBatchPayment);

// Admin process routes
router.post('/declarations/admin/batch/:id/process', auth.authenticateToken, auth.requireAdmin, declarationController.processBatch);
router.post('/declarations/admin/batch/:id/complete', auth.authenticateToken, auth.requireAdmin, declarationController.completeBatch);

module.exports = router; 