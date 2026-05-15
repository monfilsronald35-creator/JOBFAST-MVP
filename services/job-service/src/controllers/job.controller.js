const jobService = require('../services/job.service');
const logger = require('../utils/logger');

class JobController {
  async getAllJobs(req, res, next) {
    try {
      const { page, limit, profession, location, salaryRange, status } = req.query;
      const jobs = await jobService.getAllJobs({ page, limit, profession, location, salaryRange, status });
      res.status(200).json(jobs);
    } catch (error) {
      logger.error('Get all jobs error:', error.message);
      next(error);
    }
  }

  async getJobById(req, res, next) {
    try {
      const job = await jobService.getJobById(req.params.id);
      res.status(200).json(job);
    } catch (error) {
      logger.error('Get job by id error:', error.message);
      next(error);
    }
  }

  async createJob(req, res, next) {
    try {
      const jobData = req.body;
      const job = await jobService.createJob(req.user.id, jobData);
      res.status(201).json(job);
    } catch (error) {
      logger.error('Create job error:', error.message);
      next(error);
    }
  }

  async updateJob(req, res, next) {
    try {
      const updates = req.body;
      const job = await jobService.updateJob(req.params.id, req.user.id, updates);
      res.status(200).json(job);
    } catch (error) {
      logger.error('Update job error:', error.message);
      next(error);
    }
  }

  async deleteJob(req, res, next) {
    try {
      await jobService.deleteJob(req.params.id, req.user.id);
      res.status(200).json({ message: 'Job deleted successfully' });
    } catch (error) {
      logger.error('Delete job error:', error.message);
      next(error);
    }
  }

  async applyForJob(req, res, next) {
    try {
      const { coverLetter, expectedSalary, availability } = req.body;
      const application = await jobService.applyForJob(req.user.id, req.params.id, { coverLetter, expectedSalary, availability });
      res.status(201).json(application);
    } catch (error) {
      logger.error('Apply for job error:', error.message);
      next(error);
    }
  }

  async getMyApplications(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const applications = await jobService.getMyApplications(req.user.id, { page, limit, status });
      res.status(200).json(applications);
    } catch (error) {
      logger.error('Get my applications error:', error.message);
      next(error);
    }
  }

  async getMyPostings(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const postings = await jobService.getMyPostings(req.user.id, { page, limit, status });
      res.status(200).json(postings);
    } catch (error) {
      logger.error('Get my postings error:', error.message);
      next(error);
    }
  }

  async saveJob(req, res, next) {
    try {
      await jobService.saveJob(req.user.id, req.params.id);
      res.status(200).json({ message: 'Job saved successfully' });
    } catch (error) {
      logger.error('Save job error:', error.message);
      next(error);
    }
  }

  async unsaveJob(req, res, next) {
    try {
      await jobService.unsaveJob(req.user.id, req.params.id);
      res.status(200).json({ message: 'Job unsaved successfully' });
    } catch (error) {
      logger.error('Unsave job error:', error.message);
      next(error);
    }
  }

  async getJobApplications(req, res, next) {
    try {
      const { page, limit, status } = req.query;
      const applications = await jobService.getJobApplications(req.params.id, req.user.id, { page, limit, status });
      res.status(200).json(applications);
    } catch (error) {
      logger.error('Get job applications error:', error.message);
      next(error);
    }
  }
}

module.exports = new JobController();
