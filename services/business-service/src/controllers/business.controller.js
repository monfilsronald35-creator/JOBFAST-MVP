const businessService = require('../services/business.service');
const logger = require('../utils/logger');

class BusinessController {
  async createBusiness(req, res, next) {
    try {
      const businessData = req.body;
      const business = await businessService.createBusiness(req.user.id, businessData);
      res.status(201).json(business);
    } catch (error) {
      logger.error('Create business error:', error.message);
      next(error);
    }
  }

  async getMyBusinesses(req, res, next) {
    try {
      const businesses = await businessService.getMyBusinesses(req.user.id);
      res.status(200).json(businesses);
    } catch (error) {
      logger.error('Get my businesses error:', error.message);
      next(error);
    }
  }

  async getBusinessById(req, res, next) {
    try {
      const business = await businessService.getBusinessById(req.params.id, req.user.id);
      res.status(200).json(business);
    } catch (error) {
      logger.error('Get business by id error:', error.message);
      next(error);
    }
  }

  async updateBusiness(req, res, next) {
    try {
      const updates = req.body;
      const business = await businessService.updateBusiness(req.params.id, req.user.id, updates);
      res.status(200).json(business);
    } catch (error) {
      logger.error('Update business error:', error.message);
      next(error);
    }
  }

  async deleteBusiness(req, res, next) {
    try {
      await businessService.deleteBusiness(req.params.id, req.user.id);
      res.status(200).json({ message: 'Business deleted successfully' });
    } catch (error) {
      logger.error('Delete business error:', error.message);
      next(error);
    }
  }

  async addEmployee(req, res, next) {
    try {
      const { employeeId, role, permissions } = req.body;
      const employee = await businessService.addEmployee(req.params.id, req.user.id, { employeeId, role, permissions });
      res.status(201).json(employee);
    } catch (error) {
      logger.error('Add employee error:', error.message);
      next(error);
    }
  }

  async removeEmployee(req, res, next) {
    try {
      await businessService.removeEmployee(req.params.id, req.user.id, req.params.employeeId);
      res.status(200).json({ message: 'Employee removed successfully' });
    } catch (error) {
      logger.error('Remove employee error:', error.message);
      next(error);
    }
  }

  async getEmployees(req, res, next) {
    try {
      const employees = await businessService.getEmployees(req.params.id, req.user.id);
      res.status(200).json(employees);
    } catch (error) {
      logger.error('Get employees error:', error.message);
      next(error);
    }
  }
}

module.exports = new BusinessController();
