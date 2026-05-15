const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/jobs', searchController.searchJobs);
router.get('/workers', searchController.searchWorkers);
router.get('/businesses', searchController.searchBusinesses);

// Protected routes
router.post('/save-search', authenticate, searchController.saveSearch);
router.get('/saved-searches', authenticate, searchController.getSavedSearches);
router.delete('/saved-searches/:id', authenticate, searchController.deleteSavedSearch);

module.exports = router;
