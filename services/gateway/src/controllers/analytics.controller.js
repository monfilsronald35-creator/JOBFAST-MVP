const axios = require('axios');
const logger = require('../utils/logger');

const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3011';

class AnalyticsController {
  async getDashboard(req, res, next) {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/analytics/dashboard`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get dashboard error:', error.message);
      next(error);
    }
  }

  async getUserAnalytics(req, res, next) {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/analytics/users`, {
        headers: { Authorization: req.headers.authorization },
        params: req.query
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get user analytics error:', error.message);
      next(error);
    }
  }

  async getJobAnalytics(req, res, next) {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/analytics/jobs`, {
        headers: { Authorization: req.headers.authorization },
        params: req.query
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get job analytics error:', error.message);
      next(error);
    }
  }

  async getTransactionAnalytics(req, res, next) {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/analytics/transactions`, {
        headers: { Authorization: req.headers.authorization },
        params: req.query
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get transaction analytics error:', error.message);
      next(error);
    }
  }

  async generateReport(req, res, next) {
    try {
      const response = await axios.get(`${ANALYTICS_SERVICE_URL}/api/analytics/reports`, {
        headers: { Authorization: req.headers.authorization },
        params: req.query
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Generate report error:', error.message);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
