const axios = require('axios');
const logger = require('../utils/logger');

const CARD_SERVICE_URL = process.env.CARD_SERVICE_URL || 'http://localhost:3006';

class CardController {
  async createCard(req, res, next) {
    try {
      const response = await axios.post(`${CARD_SERVICE_URL}/api/cards`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Create card error:', error.message);
      next(error);
    }
  }

  async getCards(req, res, next) {
    try {
      const response = await axios.get(`${CARD_SERVICE_URL}/api/cards`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get cards error:', error.message);
      next(error);
    }
  }

  async getCardById(req, res, next) {
    try {
      const response = await axios.get(`${CARD_SERVICE_URL}/api/cards/${req.params.id}`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get card by id error:', error.message);
      next(error);
    }
  }

  async updateCard(req, res, next) {
    try {
      const response = await axios.put(`${CARD_SERVICE_URL}/api/cards/${req.params.id}`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Update card error:', error.message);
      next(error);
    }
  }

  async deleteCard(req, res, next) {
    try {
      const response = await axios.delete(`${CARD_SERVICE_URL}/api/cards/${req.params.id}`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Delete card error:', error.message);
      next(error);
    }
  }

  async freezeCard(req, res, next) {
    try {
      const response = await axios.post(`${CARD_SERVICE_URL}/api/cards/${req.params.id}/freeze`, {}, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Freeze card error:', error.message);
      next(error);
    }
  }

  async unfreezeCard(req, res, next) {
    try {
      const response = await axios.post(`${CARD_SERVICE_URL}/api/cards/${req.params.id}/unfreeze`, {}, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Unfreeze card error:', error.message);
      next(error);
    }
  }

  async updateCardLimits(req, res, next) {
    try {
      const response = await axios.put(`${CARD_SERVICE_URL}/api/cards/${req.params.id}/limits`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Update card limits error:', error.message);
      next(error);
    }
  }
}

module.exports = new CardController();
