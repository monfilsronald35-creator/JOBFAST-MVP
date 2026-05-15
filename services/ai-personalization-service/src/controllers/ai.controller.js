const aiService = require('../services/ai.service');
const logger = require('../utils/logger');

class AIController {
  async getRecommendations(req, res, next) {
    try {
      const { type, limit } = req.body;
      const recommendations = await aiService.getRecommendations(req.user.id, { type, limit });
      res.status(200).json(recommendations);
    } catch (error) {
      logger.error('Get recommendations error:', error.message);
      next(error);
    }
  }

  async detectUserRole(req, res, next) {
    try {
      const { userProfile } = req.body;
      const role = await aiService.detectUserRole(userProfile);
      res.status(200).json(role);
    } catch (error) {
      logger.error('Detect user role error:', error.message);
      next(error);
    }
  }

  async getTrustScore(req, res, next) {
    try {
      const score = await aiService.getTrustScore(req.params.userId);
      res.status(200).json(score);
    } catch (error) {
      logger.error('Get trust score error:', error.message);
      next(error);
    }
  }

  async getFraudScore(req, res, next) {
    try {
      const score = await aiService.getFraudScore(req.params.userId);
      res.status(200).json(score);
    } catch (error) {
      logger.error('Get fraud score error:', error.message);
      next(error);
    }
  }

  async sendSmartNotification(req, res, next) {
    try {
      const { notificationData } = req.body;
      const result = await aiService.sendSmartNotification(req.user.id, notificationData);
      res.status(200).json(result);
    } catch (error) {
      logger.error('Send smart notification error:', error.message);
      next(error);
    }
  }

  async analyzeProfile(req, res, next) {
    try {
      const analysis = await aiService.analyzeProfile(req.user.id);
      res.status(200).json(analysis);
    } catch (error) {
      logger.error('Analyze profile error:', error.message);
      next(error);
    }
  }
}

module.exports = new AIController();
