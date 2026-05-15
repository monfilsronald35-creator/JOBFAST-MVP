const express = require('express');
const router = express.Router();
const cardController = require('../controllers/card.controller');
const { authenticate } = require('../middleware/auth');

// Protected routes
router.post('/', authenticate, cardController.createCard);
router.get('/', authenticate, cardController.getCards);
router.get('/:id', authenticate, cardController.getCardById);
router.put('/:id', authenticate, cardController.updateCard);
router.delete('/:id', authenticate, cardController.deleteCard);
router.post('/:id/freeze', authenticate, cardController.freezeCard);
router.post('/:id/unfreeze', authenticate, cardController.unfreezeCard);
router.put('/:id/limits', authenticate, cardController.updateCardLimits);
router.get('/:id/transactions', authenticate, cardController.getCardTransactions);

module.exports = router;
