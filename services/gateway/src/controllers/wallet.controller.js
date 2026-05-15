const axios = require('axios');
const logger = require('../utils/logger');

const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:3005';

class WalletController {
  async getWallet(req, res, next) {
    try {
      const response = await axios.get(`${WALLET_SERVICE_URL}/api/wallet`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get wallet error:', error.message);
      next(error);
    }
  }

  async deposit(req, res, next) {
    try {
      const response = await axios.post(`${WALLET_SERVICE_URL}/api/wallet/deposit`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Deposit error:', error.message);
      next(error);
    }
  }

  async withdraw(req, res, next) {
    try {
      const response = await axios.post(`${WALLET_SERVICE_URL}/api/wallet/withdraw`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Withdraw error:', error.message);
      next(error);
    }
  }

  async transfer(req, res, next) {
    try {
      const response = await axios.post(`${WALLET_SERVICE_URL}/api/wallet/transfer`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Transfer error:', error.message);
      next(error);
    }
  }

  async getTransactions(req, res, next) {
    try {
      const response = await axios.get(`${WALLET_SERVICE_URL}/api/wallet/transactions`, {
        headers: { Authorization: req.headers.authorization },
        params: req.query
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get transactions error:', error.message);
      next(error);
    }
  }

  async getBalance(req, res, next) {
    try {
      const response = await axios.get(`${WALLET_SERVICE_URL}/api/wallet/balance`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get balance error:', error.message);
      next(error);
    }
  }

  async recharge(req, res, next) {
    try {
      const response = await axios.post(`${WALLET_SERVICE_URL}/api/wallet/recharge`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Recharge error:', error.message);
      next(error);
    }
  }
}

module.exports = new WalletController();
