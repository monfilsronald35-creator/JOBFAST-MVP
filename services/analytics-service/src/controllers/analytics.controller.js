const analyticsService = require('../services/analytics.service');
const logger = require('../utils/logger');

class AnalyticsController {
  async getDashboard(req, res, next) {
    try {
      const { period } = req.query;
      const dashboard = await analyticsService.getDashboard({ period });
      res.status(200).json(dashboard);
    } catch (error) {
      logger.error('Get dashboard error:', error.message);
      next(error);
    }
  }

  async getUserAnalytics(req, res, next) {
    try {
      const { period, role, status } = req.query;
      const analytics = await analyticsService.getUserAnalytics({ period, role, status });
      res.status(200).json(analytics);
    } catch (error) {
      logger.error('Get user analytics error:', error.message);
      next(error);
    }
  }

  async getJobAnalytics(req, res, next) {
    try {
      const { period, status, profession } = req.query;
      const analytics = await analyticsService.getJobAnalytics({ period, status, profession });
      res.status(200).json(analytics);
    } catch (error) {
      logger.error('Get job analytics error:', error.message);
      next(error);
    }
  }

  async getTransactionAnalytics(req, res, next) {
    try {
      const { period, type, status } = req.query;
      const analytics = await analyticsService.getTransactionAnalytics({ period, type, status });
      res.status(200).json(analytics);
    } catch (error) {
      logger.error('Get transaction analytics error:', error.message);
      next(error);
    }
  }

  async generateReport(req, res, next) {
    try {
      const { reportType, startDate, endDate, filters } = req.query;
      const report = await analyticsService.generateReport({ reportType, startDate, endDate, filters });
      res.status(200).json(report);
    } catch (error) {
      logger.error('Generate report error:', error.message);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
