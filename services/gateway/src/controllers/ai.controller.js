const axios = require('axios');
const logger = require('../utils/logger');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3008';

class AIController {
  async getRecommendations(req, res, next) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/recommendations`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get recommendations error:', error.message);
      next(error);
    }
  }

  async detectUserRole(req, res, next) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/detect-role`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Detect user role error:', error.message);
      next(error);
    }
  }

  async getTrustScore(req, res, next) {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/api/trust-score/${req.params.userId}`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get trust score error:', error.message);
      next(error);
    }
  }

  async getFraudScore(req, res, next) {
    try {
      const response = await axios.get(`${AI_SERVICE_URL}/api/fraud-score/${req.params.userId}`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get fraud score error:', error.message);
      next(error);
    }
  }

  async sendSmartNotification(req, res, next) {
    try {
      const response = await axios.post(`${AI_SERVICE_URL}/api/smart-notify`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Send smart notification error:', error.message);
      next(error);
    }
  }
}

module.exports = new AIController();
