const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/', jobController.getAllJobs);
router.get('/:id', jobController.getJobById);

// Protected routes
router.post('/', authenticate, jobController.createJob);
router.put('/:id', authenticate, jobController.updateJob);
router.delete('/:id', authenticate, jobController.deleteJob);
router.post('/:id/apply', authenticate, jobController.applyForJob);
router.get('/my/applications', authenticate, jobController.getMyApplications);
router.get('/my/postings', authenticate, jobController.getMyPostings);
router.post('/:id/save', authenticate, jobController.saveJob);
router.delete('/:id/save', authenticate, jobController.unsaveJob);

module.exports = router;
