const walletService = require('../services/wallet.service');
const logger = require('../utils/logger');

class WalletController {
  async getWallet(req, res, next) {
    try {
      const wallet = await walletService.getWallet(req.user.id);
      res.status(200).json(wallet);
    } catch (error) {
      logger.error('Get wallet error:', error.message);
      next(error);
    }
  }

  async deposit(req, res, next) {
    try {
      const { amount, paymentMethod, paymentDetails } = req.body;
      const transaction = await walletService.deposit(req.user.id, { amount, paymentMethod, paymentDetails });
      res.status(200).json(transaction);
    } catch (error) {
      logger.error('Deposit error:', error.message);
      next(error);
    }
  }

  async withdraw(req, res, next) {
    try {
      const { amount, withdrawalMethod, withdrawalDetails } = req.body;
      const transaction = await walletService.withdraw(req.user.id, { amount, withdrawalMethod, withdrawalDetails });
      res.status(200).json(transaction);
    } catch (error) {
      logger.error('Withdraw error:', error.message);
      next(error);
    }
  }

  async transfer(req, res, next) {
    try {
      const { recipientId, amount, description } = req.body;
      const transaction = await walletService.transfer(req.user.id, { recipientId, amount, description });
      res.status(200).json(transaction);
    } catch (error) {
      logger.error('Transfer error:', error.message);
      next(error);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const { page, limit, type, status } = req.query;
      const transactions = await walletService.getTransactions(req.user.id, { page, limit, type, status });
      res.status(200).json(transactions);
    } catch (error) {
      logger.error('Get transactions error:', error.message);
      next(error);
    }
  }

  async getBalance(req, res, next) {
    try {
      const balance = await walletService.getBalance(req.user.id);
      res.status(200).json(balance);
    } catch (error) {
      logger.error('Get balance error:', error.message);
      next(error);
    }
  }

  async recharge(req, res, next) {
    try {
      const { amount, rechargeMethod, rechargeDetails } = req.body;
      const transaction = await walletService.recharge(req.user.id, { amount, rechargeMethod, rechargeDetails });
      res.status(200).json(transaction);
    } catch (error) {
      logger.error('Recharge error:', error.message);
      next(error);
    }
  }

  async requestPayout(req, res, next) {
    try {
      const { amount, payoutMethod, payoutDetails } = req.body;
      const payout = await walletService.requestPayout(req.user.id, { amount, payoutMethod, payoutDetails });
      res.status(200).json(payout);
    } catch (error) {
      logger.error('Request payout error:', error.message);
      next(error);
    }
  }
}

module.exports = new WalletController();
