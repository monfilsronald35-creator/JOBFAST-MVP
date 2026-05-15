const fraudService = require('../services/fraud.service');
const logger = require('../utils/logger');

class FraudController {
  async reportFraud(req, res, next) {
    try {
      const { reportedUserId, reason, description, evidence } = req.body;
      const report = await fraudService.reportFraud(req.user.id, { reportedUserId, reason, description, evidence });
      res.status(201).json(report);
    } catch (error) {
      logger.error('Report fraud error:', error.message);
      next(error);
    }
  }

  async getFraudReports(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const reports = await fraudService.getFraudReports(req.user.id, { page, limit, status });
      res.status(200).json(reports);
    } catch (error) {
      logger.error('Get fraud reports error:', error.message);
      next(error);
    }
  }

  async getFraudScore(req, res, next) {
    try {
      const score = await fraudService.getFraudScore(req.params.userId);
      res.status(200).json(score);
    } catch (error) {
      logger.error('Get fraud score error:', error.message);
      next(error);
    }
  }

  async verifyDevice(req, res, next) {
    try {
      const { fingerprint, userAgent, ip } = req.body;
      const result = await fraudService.verifyDevice(req.user.id, { fingerprint, userAgent, ip });
      res.status(200).json(result);
    } catch (error) {
      logger.error('Verify device error:', error.message);
      next(error);
    }
  }

  async checkDuplicateAccount(req, res, next) {
    try {
      const { email, phone, deviceFingerprint } = req.body;
      const result = await fraudService.checkDuplicateAccount({ email, phone, deviceFingerprint });
      res.status(200).json(result);
    } catch (error) {
      logger.error('Check duplicate account error:', error.message);
      next(error);
    }
  }

  async getScamKeywords(req, res, next) {
    try {
      const keywords = await fraudService.getScamKeywords();
      res.status(200).json(keywords);
    } catch (error) {
      logger.error('Get scam keywords error:', error.message);
      next(error);
    }
  }

  async addScamKeyword(req, res, next) {
    try {
      const { keyword, severity } = req.body;
      const keywordData = await fraudService.addScamKeyword({ keyword, severity });
      res.status(201).json(keywordData);
    } catch (error) {
      logger.error('Add scam keyword error:', error.message);
      next(error);
    }
  }

  async deleteScamKeyword(req, res, next) {
    try {
      await fraudService.deleteScamKeyword(req.params.id);
      res.status(200).json({ message: 'Scam keyword deleted successfully' });
    } catch (error) {
      logger.error('Delete scam keyword error:', error.message);
      next(error);
    }
  }
}

module.exports = new FraudController();
