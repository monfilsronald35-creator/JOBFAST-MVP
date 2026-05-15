const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');

// Protected routes
router.post('/recommendations', authenticate, aiController.getRecommendations);
router.post('/detect-role', authenticate, aiController.detectUserRole);
router.get('/trust-score/:userId', authenticate, aiController.getTrustScore);
router.get('/fraud-score/:userId', authenticate, aiController.getFraudScore);
router.post('/smart-notify', authenticate, aiController.sendSmartNotification);

module.exports = router;
