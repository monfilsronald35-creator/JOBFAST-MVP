const axios = require('axios');
const logger = require('../utils/logger');

const SEARCH_SERVICE_URL = process.env.SEARCH_SERVICE_URL || 'http://localhost:3010';

class SearchController {
  async searchJobs(req, res, next) {
    try {
      const response = await axios.get(`${SEARCH_SERVICE_URL}/api/search/jobs`, { params: req.query });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Search jobs error:', error.message);
      next(error);
    }
  }

  async searchWorkers(req, res, next) {
    try {
      const response = await axios.get(`${SEARCH_SERVICE_URL}/api/search/workers`, { params: req.query });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Search workers error:', error.message);
      next(error);
    }
  }

  async searchBusinesses(req, res, next) {
    try {
      const response = await axios.get(`${SEARCH_SERVICE_URL}/api/search/businesses`, { params: req.query });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Search businesses error:', error.message);
      next(error);
    }
  }

  async saveSearch(req, res, next) {
    try {
      const response = await axios.post(`${SEARCH_SERVICE_URL}/api/search/save-search`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Save search error:', error.message);
      next(error);
    }
  }

  async getSavedSearches(req, res, next) {
    try {
      const response = await axios.get(`${SEARCH_SERVICE_URL}/api/search/saved-searches`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get saved searches error:', error.message);
      next(error);
    }
  }

  async deleteSavedSearch(req, res, next) {
    try {
      const response = await axios.delete(`${SEARCH_SERVICE_URL}/api/search/saved-searches/${req.params.id}`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Delete saved search error:', error.message);
      next(error);
    }
  }
}

module.exports = new SearchController();
