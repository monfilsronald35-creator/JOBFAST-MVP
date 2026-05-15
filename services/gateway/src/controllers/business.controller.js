const axios = require('axios');
const logger = require('../utils/logger');

const BUSINESS_SERVICE_URL = process.env.BUSINESS_SERVICE_URL || 'http://localhost:3004';

class BusinessController {
  async createBusiness(req, res, next) {
    try {
      const response = await axios.post(`${BUSINESS_SERVICE_URL}/api/businesses`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Create business error:', error.message);
      next(error);
    }
  }

  async getBusinessById(req, res, next) {
    try {
      const response = await axios.get(`${BUSINESS_SERVICE_URL}/api/businesses/${req.params.id}`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get business by id error:', error.message);
      next(error);
    }
  }

  async updateBusiness(req, res, next) {
    try {
      const response = await axios.put(`${BUSINESS_SERVICE_URL}/api/businesses/${req.params.id}`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Update business error:', error.message);
      next(error);
    }
  }

  async deleteBusiness(req, res, next) {
    try {
      const response = await axios.delete(`${BUSINESS_SERVICE_URL}/api/businesses/${req.params.id}`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Delete business error:', error.message);
      next(error);
    }
  }

  async getMyBusinesses(req, res, next) {
    try {
      const response = await axios.get(`${BUSINESS_SERVICE_URL}/api/businesses/my`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get my businesses error:', error.message);
      next(error);
    }
  }

  async addEmployee(req, res, next) {
    try {
      const response = await axios.post(`${BUSINESS_SERVICE_URL}/api/businesses/${req.params.id}/employees`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Add employee error:', error.message);
      next(error);
    }
  }

  async removeEmployee(req, res, next) {
    try {
      const response = await axios.delete(`${BUSINESS_SERVICE_URL}/api/businesses/${req.params.id}/employees/${req.params.employeeId}`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Remove employee error:', error.message);
      next(error);
    }
  }

  async getEmployees(req, res, next) {
    try {
      const response = await axios.get(`${BUSINESS_SERVICE_URL}/api/businesses/${req.params.id}/employees`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get employees error:', error.message);
      next(error);
    }
  }
}

module.exports = new BusinessController();
