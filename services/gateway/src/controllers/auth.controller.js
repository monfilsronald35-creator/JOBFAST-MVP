const axios = require('axios');
const logger = require('../utils/logger');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

class AuthController {
  async register(req, res, next) {
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/register`, req.body);
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Register error:', error.message);
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/login`, req.body);
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Login error:', error.message);
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/refresh`, req.body);
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Refresh token error:', error.message);
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/forgot-password`, req.body);
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Forgot password error:', error.message);
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/reset-password`, req.body);
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Reset password error:', error.message);
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const response = await axios.get(`${AUTH_SERVICE_URL}/api/me`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get me error:', error.message);
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const response = await axios.put(`${AUTH_SERVICE_URL}/api/profile`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Update profile error:', error.message);
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/logout`, {}, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Logout error:', error.message);
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const response = await axios.post(`${AUTH_SERVICE_URL}/api/change-password`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Change password error:', error.message);
      next(error);
    }
  }
}

module.exports = new AuthController();
