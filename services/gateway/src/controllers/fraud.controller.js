const axios = require('axios');
const logger = require('../utils/logger');

const FRAUD_SERVICE_URL = process.env.FRAUD_SERVICE_URL || 'http://localhost:3009';

class FraudController {
  async reportFraud(req, res, next) {
    try {
      const response = await axios.post(`${FRAUD_SERVICE_URL}/api/fraud/report`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Report fraud error:', error.message);
      next(error);
    }
  }

  async getFraudReports(req, res, next) {
    try {
      const response = await axios.get(`${FRAUD_SERVICE_URL}/api/fraud/reports`, {
        headers: { Authorization: req.headers.authorization },
        params: req.query
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get fraud reports error:', error.message);
      next(error);
    }
  }

  async getFraudScore(req, res, next) {
    try {
      const response = await axios.get(`${FRAUD_SERVICE_URL}/api/fraud/score/${req.params.userId}`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get fraud score error:', error.message);
      next(error);
    }
  }

  async verifyDevice(req, res, next) {
    try {
      const response = await axios.post(`${FRAUD_SERVICE_URL}/api/fraud/verify-device`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Verify device error:', error.message);
      next(error);
    }
  }

  async checkDuplicateAccount(req, res, next) {
    try {
      const response = await axios.post(`${FRAUD_SERVICE_URL}/api/fraud/check-duplicate`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Check duplicate account error:', error.message);
      next(error);
    }
  }
}

module.exports = new FraudController();
