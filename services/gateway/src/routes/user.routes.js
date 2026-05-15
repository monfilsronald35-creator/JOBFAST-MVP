const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');

// Protected routes
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.get('/professions', authenticate, userController.getProfessions);
router.post('/professions', authenticate, userController.addProfession);
router.delete('/professions/:id', authenticate, userController.removeProfession);
router.get('/location', authenticate, userController.getLocation);
router.put('/location', authenticate, userController.updateLocation);
router.get('/nearby-workers', authenticate, userController.getNearbyWorkers);
router.get('/nearby-jobs', authenticate, userController.getNearbyJobs);

module.exports = router;
