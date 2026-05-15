const axios = require('axios');
const logger = require('../utils/logger');

const ADMIN_SERVICE_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:3012';

class AdminController {
  async getAllUsers(req, res, next) {
    try {
      const response = await axios.get(`${ADMIN_SERVICE_URL}/api/admin/users`, {
        headers: { Authorization: req.headers.authorization },
        params: req.query
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get all users error:', error.message);
      next(error);
    }
  }

  async updateUserStatus(req, res, next) {
    try {
      const response = await axios.put(`${ADMIN_SERVICE_URL}/api/admin/users/${req.params.id}/status`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Update user status error:', error.message);
      next(error);
    }
  }

  async verifyUser(req, res, next) {
    try {
      const response = await axios.put(`${ADMIN_SERVICE_URL}/api/admin/users/${req.params.id}/verify`, {}, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Verify user error:', error.message);
      next(error);
    }
  }

  async getFraudReviews(req, res, next) {
    try {
      const response = await axios.get(`${ADMIN_SERVICE_URL}/api/admin/fraud/reviews`, {
        headers: { Authorization: req.headers.authorization },
        params: req.query
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get fraud reviews error:', error.message);
      next(error);
    }
  }

  async reviewFraudCase(req, res, next) {
    try {
      const response = await axios.put(`${ADMIN_SERVICE_URL}/api/admin/fraud/reviews/${req.params.id}`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Review fraud case error:', error.message);
      next(error);
    }
  }

  async getPayouts(req, res, next) {
    try {
      const response = await axios.get(`${ADMIN_SERVICE_URL}/api/admin/payouts`, {
        headers: { Authorization: req.headers.authorization },
        params: req.query
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get payouts error:', error.message);
      next(error);
    }
  }

  async approvePayout(req, res, next) {
    try {
      const response = await axios.put(`${ADMIN_SERVICE_URL}/api/admin/payouts/${req.params.id}`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Approve payout error:', error.message);
      next(error);
    }
  }

  async getAllCards(req, res, next) {
    try {
      const response = await axios.get(`${ADMIN_SERVICE_URL}/api/admin/cards`, {
        headers: { Authorization: req.headers.authorization },
        params: req.query
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get all cards error:', error.message);
      next(error);
    }
  }

  async blockCard(req, res, next) {
    try {
      const response = await axios.delete(`${ADMIN_SERVICE_URL}/api/admin/cards/${req.params.id}`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Block card error:', error.message);
      next(error);
    }
  }
}

module.exports = new AdminController();
