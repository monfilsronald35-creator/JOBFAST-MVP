const axios = require('axios');
const logger = require('../utils/logger');

const JOB_SERVICE_URL = process.env.JOB_SERVICE_URL || 'http://localhost:3003';

class JobController {
  async getAllJobs(req, res, next) {
    try {
      const response = await axios.get(`${JOB_SERVICE_URL}/api/jobs`, { params: req.query });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get all jobs error:', error.message);
      next(error);
    }
  }

  async getJobById(req, res, next) {
    try {
      const response = await axios.get(`${JOB_SERVICE_URL}/api/jobs/${req.params.id}`);
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get job by id error:', error.message);
      next(error);
    }
  }

  async createJob(req, res, next) {
    try {
      const response = await axios.post(`${JOB_SERVICE_URL}/api/jobs`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Create job error:', error.message);
      next(error);
    }
  }

  async updateJob(req, res, next) {
    try {
      const response = await axios.put(`${JOB_SERVICE_URL}/api/jobs/${req.params.id}`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Update job error:', error.message);
      next(error);
    }
  }

  async deleteJob(req, res, next) {
    try {
      const response = await axios.delete(`${JOB_SERVICE_URL}/api/jobs/${req.params.id}`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Delete job error:', error.message);
      next(error);
    }
  }

  async applyForJob(req, res, next) {
    try {
      const response = await axios.post(`${JOB_SERVICE_URL}/api/jobs/${req.params.id}/apply`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Apply for job error:', error.message);
      next(error);
    }
  }

  async getMyApplications(req, res, next) {
    try {
      const response = await axios.get(`${JOB_SERVICE_URL}/api/jobs/my/applications`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get my applications error:', error.message);
      next(error);
    }
  }

  async getMyPostings(req, res, next) {
    try {
      const response = await axios.get(`${JOB_SERVICE_URL}/api/jobs/my/postings`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get my postings error:', error.message);
      next(error);
    }
  }

  async saveJob(req, res, next) {
    try {
      const response = await axios.post(`${JOB_SERVICE_URL}/api/jobs/${req.params.id}/save`, {}, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Save job error:', error.message);
      next(error);
    }
  }

  async unsaveJob(req, res, next) {
    try {
      const response = await axios.delete(`${JOB_SERVICE_URL}/api/jobs/${req.params.id}/save`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Unsave job error:', error.message);
      next(error);
    }
  }
}

module.exports = new JobController();
