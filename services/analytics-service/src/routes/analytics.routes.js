const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Protected routes (admin only)
router.get('/dashboard', authenticate, authorize(['admin']), analyticsController.getDashboard);
router.get('/users', authenticate, authorize(['admin']), analyticsController.getUserAnalytics);
router.get('/jobs', authenticate, authorize(['admin']), analyticsController.getJobAnalytics);
router.get('/transactions', authenticate, authorize(['admin']), analyticsController.getTransactionAnalytics);
router.get('/reports', authenticate, authorize(['admin']), analyticsController.generateReport);

module.exports = router;
