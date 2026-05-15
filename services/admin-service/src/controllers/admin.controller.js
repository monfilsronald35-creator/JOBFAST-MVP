const adminService = require('../services/admin.service');
const logger = require('../utils/logger');

class AdminController {
  async getAllUsers(req, res, next) {
    try {
      const { page, limit, role, status, search } = req.query;
      const users = await adminService.getAllUsers({ page, limit, role, status, search });
      res.status(200).json(users);
    } catch (error) {
      logger.error('Get all users error:', error.message);
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const { status, reason } = req.body;
      const user = await adminService.updateUserStatus(req.params.id, { status, reason });
      res.status(200).json(user);
    } catch (error) {
      logger.error('Update user status error:', error.message);
      next(error);
    }
  }

  async verifyUser(req, res, next) {
    try {
      const user = await adminService.verifyUser(req.params.id);
      res.status(200).json(user);
    } catch (error) {
      logger.error('Verify user error:', error.message);
      next(error);
    }
  }

  async getFraudReviews(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const reviews = await adminService.getFraudReviews({ page, limit, status });
      res.status(200).json(reviews);
    } catch (error) {
      logger.error('Get fraud reviews error:', error.message);
      next(error);
    }
  }

  async reviewFraudCase(req, res, next) {
    try {
      const { status, notes, action } = req.body;
      const review = await adminService.reviewFraudCase(req.params.id, { status, notes, action });
      res.status(200).json(review);
    } catch (error) {
      logger.error('Review fraud case error:', error.message);
      next(error);
    }
  }

  async getPayouts(req, res, next) {
    try {
      const { page, limit, status, method } = req.query;
      const payouts = await adminService.getPayouts({ page, limit, status, method });
      res.status(200).json(payouts);
    } catch (error) {
      logger.error('Get payouts error:', error.message);
      next(error);
    }
  }

  async approvePayout(req, res, next) {
    try {
      const { status, processedBy, notes } = req.body;
      const payout = await adminService.approvePayout(req.params.id, { status, processedBy, notes });
      res.status(200).json(payout);
    } catch (error) {
      logger.error('Approve payout error:', error.message);
      next(error);
    }
  }

  async getAllCards(req, res, next) {
    try {
      const { page, limit, status, userId } = req.query;
      const cards = await adminService.getAllCards({ page, limit, status, userId });
      res.status(200).json(cards);
    } catch (error) {
      logger.error('Get all cards error:', error.message);
      next(error);
    }
  }

  async blockCard(req, res, next) {
    try {
      const { reason } = req.body;
      const card = await adminService.blockCard(req.params.id, { reason });
      res.status(200).json(card);
    } catch (error) {
      logger.error('Block card error:', error.message);
      next(error);
    }
  }
}

module.exports = new AdminController();
