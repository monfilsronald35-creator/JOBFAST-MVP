const express = require('express');
const router = express.Router();
const businessController = require('../controllers/business.controller');
const { authenticate } = require('../middleware/auth');

// Protected routes
router.post('/', authenticate, businessController.createBusiness);
router.get('/', authenticate, businessController.getMyBusinesses);
router.get('/:id', authenticate, businessController.getBusinessById);
router.put('/:id', authenticate, businessController.updateBusiness);
router.delete('/:id', authenticate, businessController.deleteBusiness);
router.post('/:id/employees', authenticate, businessController.addEmployee);
router.delete('/:id/employees/:employeeId', authenticate, businessController.removeEmployee);
router.get('/:id/employees', authenticate, businessController.getEmployees);

module.exports = router;
