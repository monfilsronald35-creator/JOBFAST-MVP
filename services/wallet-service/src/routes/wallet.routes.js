const express = require('express');
const router = express.Router();
const walletController = require('../controllers/wallet.controller');
const { authenticate } = require('../middleware/auth');

// Protected routes
router.get('/', authenticate, walletController.getWallet);
router.post('/deposit', authenticate, walletController.deposit);
router.post('/withdraw', authenticate, walletController.withdraw);
router.post('/transfer', authenticate, walletController.transfer);
router.get('/transactions', authenticate, walletController.getTransactions);
router.get('/balance', authenticate, walletController.getBalance);
router.post('/recharge', authenticate, walletController.recharge);
router.post('/payout', authenticate, walletController.requestPayout);

module.exports = router;
