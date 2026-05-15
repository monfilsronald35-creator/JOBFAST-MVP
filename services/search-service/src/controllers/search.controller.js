const searchService = require('../services/search.service');
const logger = require('../utils/logger');

class SearchController {
  async searchJobs(req, res, next) {
    try {
      const { query, location, profession, salaryRange, experience, page, limit, radius } = req.query;
      const results = await searchService.searchJobs({ query, location, profession, salaryRange, experience, page, limit, radius });
      res.status(200).json(results);
    } catch (error) {
      logger.error('Search jobs error:', error.message);
      next(error);
    }
  }

  async searchWorkers(req, res, next) {
    try {
      const { query, location, profession, skills, experience, page, limit, radius } = req.query;
      const results = await searchService.searchWorkers({ query, location, profession, skills, experience, page, limit, radius });
      res.status(200).json(results);
    } catch (error) {
      logger.error('Search workers error:', error.message);
      next(error);
    }
  }

  async searchBusinesses(req, res, next) {
    try {
      const { query, location, industry, page, limit, radius } = req.query;
      const results = await searchService.searchBusinesses({ query, location, industry, page, limit, radius });
      res.status(200).json(results);
    } catch (error) {
      logger.error('Search businesses error:', error.message);
      next(error);
    }
  }

  async saveSearch(req, res, next) {
    try {
      const { searchType, searchParams, name } = req.body;
      const savedSearch = await searchService.saveSearch(req.user.id, { searchType, searchParams, name });
      res.status(201).json(savedSearch);
    } catch (error) {
      logger.error('Save search error:', error.message);
      next(error);
    }
  }

  async getSavedSearches(req, res, next) {
    try {
      const searches = await searchService.getSavedSearches(req.user.id);
      res.status(200).json(searches);
    } catch (error) {
      logger.error('Get saved searches error:', error.message);
      next(error);
    }
  }

  async deleteSavedSearch(req, res, next) {
    try {
      await searchService.deleteSavedSearch(req.params.id, req.user.id);
      res.status(200).json({ message: 'Saved search deleted successfully' });
    } catch (error) {
      logger.error('Delete saved search error:', error.message);
      next(error);
    }
  }
}

module.exports = new SearchController();
