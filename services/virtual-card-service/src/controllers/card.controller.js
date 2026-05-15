const cardService = require('../services/card.service');
const logger = require('../utils/logger');

class CardController {
  async createCard(req, res, next) {
    try {
      const { cardType, currency, initialLimit } = req.body;
      const card = await cardService.createCard(req.user.id, { cardType, currency, initialLimit });
      res.status(201).json(card);
    } catch (error) {
      logger.error('Create card error:', error.message);
      next(error);
    }
  }

  async getCards(req, res, next) {
    try {
      const cards = await cardService.getCards(req.user.id);
      res.status(200).json(cards);
    } catch (error) {
      logger.error('Get cards error:', error.message);
      next(error);
    }
  }

  async getCardById(req, res, next) {
    try {
      const card = await cardService.getCardById(req.params.id, req.user.id);
      res.status(200).json(card);
    } catch (error) {
      logger.error('Get card by id error:', error.message);
      next(error);
    }
  }

  async updateCard(req, res, next) {
    try {
      const updates = req.body;
      const card = await cardService.updateCard(req.params.id, req.user.id, updates);
      res.status(200).json(card);
    } catch (error) {
      logger.error('Update card error:', error.message);
      next(error);
    }
  }

  async deleteCard(req, res, next) {
    try {
      await cardService.deleteCard(req.params.id, req.user.id);
      res.status(200).json({ message: 'Card deleted successfully' });
    } catch (error) {
      logger.error('Delete card error:', error.message);
      next(error);
    }
  }

  async freezeCard(req, res, next) {
    try {
      const card = await cardService.freezeCard(req.params.id, req.user.id);
      res.status(200).json(card);
    } catch (error) {
      logger.error('Freeze card error:', error.message);
      next(error);
    }
  }

  async unfreezeCard(req, res, next) {
    try {
      const card = await cardService.unfreezeCard(req.params.id, req.user.id);
      res.status(200).json(card);
    } catch (error) {
      logger.error('Unfreeze card error:', error.message);
      next(error);
    }
  }

  async updateCardLimits(req, res, next) {
    try {
      const { dailyLimit, monthlyLimit, transactionLimit } = req.body;
      const card = await cardService.updateCardLimits(req.params.id, req.user.id, { dailyLimit, monthlyLimit, transactionLimit });
      res.status(200).json(card);
    } catch (error) {
      logger.error('Update card limits error:', error.message);
      next(error);
    }
  }

  async getCardTransactions(req, res, next) {
    try {
      const { page, limit } = req.query;
      const transactions = await cardService.getCardTransactions(req.params.id, req.user.id, { page, limit });
      res.status(200).json(transactions);
    } catch (error) {
      logger.error('Get card transactions error:', error.message);
      next(error);
    }
  }
}

module.exports = new CardController();
