const axios = require('axios');
const logger = require('../utils/logger');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3002';

class UserController {
  async getProfile(req, res, next) {
    try {
      const response = await axios.get(`${USER_SERVICE_URL}/api/profile`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get profile error:', error.message);
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const response = await axios.put(`${USER_SERVICE_URL}/api/profile`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Update profile error:', error.message);
      next(error);
    }
  }

  async getProfessions(req, res, next) {
    try {
      const response = await axios.get(`${USER_SERVICE_URL}/api/professions`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get professions error:', error.message);
      next(error);
    }
  }

  async addProfession(req, res, next) {
    try {
      const response = await axios.post(`${USER_SERVICE_URL}/api/professions`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Add profession error:', error.message);
      next(error);
    }
  }

  async removeProfession(req, res, next) {
    try {
      const response = await axios.delete(`${USER_SERVICE_URL}/api/professions/${req.params.id}`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Remove profession error:', error.message);
      next(error);
    }
  }

  async getLocation(req, res, next) {
    try {
      const response = await axios.get(`${USER_SERVICE_URL}/api/location`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get location error:', error.message);
      next(error);
    }
  }

  async updateLocation(req, res, next) {
    try {
      const response = await axios.put(`${USER_SERVICE_URL}/api/location`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Update location error:', error.message);
      next(error);
    }
  }

  async getNearbyWorkers(req, res, next) {
    try {
      const response = await axios.get(`${USER_SERVICE_URL}/api/nearby-workers`, {
        headers: { Authorization: req.headers.authorization },
        params: req.query
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get nearby workers error:', error.message);
      next(error);
    }
  }

  async getNearbyJobs(req, res, next) {
    try {
      const response = await axios.get(`${USER_SERVICE_URL}/api/nearby-jobs`, {
        headers: { Authorization: req.headers.authorization },
        params: req.query
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get nearby jobs error:', error.message);
      next(error);
    }
  }
}

module.exports = new UserController();
