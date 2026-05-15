const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller');

// Public routes
router.get('/jobs', searchController.searchJobs);
router.get('/workers', searchController.searchWorkers);
router.get('/businesses', searchController.searchBusinesses);

// Protected routes
router.post('/save-search', searchController.saveSearch);
router.get('/saved-searches', searchController.getSavedSearches);
router.delete('/saved-searches/:id', searchController.deleteSavedSearch);

module.exports = router;
