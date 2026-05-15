const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Protected routes (admin only)
router.get('/users', authenticate, authorize(['admin']), adminController.getAllUsers);
router.put('/users/:id/status', authenticate, authorize(['admin']), adminController.updateUserStatus);
router.put('/users/:id/verify', authenticate, authorize(['admin']), adminController.verifyUser);
router.get('/fraud/reviews', authenticate, authorize(['admin']), adminController.getFraudReviews);
router.put('/fraud/reviews/:id', authenticate, authorize(['admin']), adminController.reviewFraudCase);
router.get('/payouts', authenticate, authorize(['admin']), adminController.getPayouts);
router.put('/payouts/:id', authenticate, authorize(['admin']), adminController.approvePayout);
router.get('/cards', authenticate, authorize(['admin']), adminController.getAllCards);
router.delete('/cards/:id', authenticate, authorize(['admin']), adminController.blockCard);

module.exports = router;
