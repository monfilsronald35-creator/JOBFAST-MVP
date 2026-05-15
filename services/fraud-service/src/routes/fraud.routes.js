const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraud.controller');
const { authenticate } = require('../middleware/auth');

// Protected routes
router.post('/report', authenticate, fraudController.reportFraud);
router.get('/reports', authenticate, fraudController.getFraudReports);
router.get('/score/:userId', authenticate, fraudController.getFraudScore);
router.post('/verify-device', authenticate, fraudController.verifyDevice);
router.post('/check-duplicate', authenticate, fraudController.checkDuplicateAccount);
router.get('/keywords', authenticate, fraudController.getScamKeywords);
router.post('/keywords', authenticate, fraudController.addScamKeyword);
router.delete('/keywords/:id', authenticate, fraudController.deleteScamKeyword);

module.exports = router;
