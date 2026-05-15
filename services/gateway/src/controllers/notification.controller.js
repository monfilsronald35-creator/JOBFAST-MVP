const axios = require('axios');
const logger = require('../utils/logger');

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3007';

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const response = await axios.get(`${NOTIFICATION_SERVICE_URL}/api/notifications`, {
        headers: { Authorization: req.headers.authorization },
        params: req.query
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get notifications error:', error.message);
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const response = await axios.put(`${NOTIFICATION_SERVICE_URL}/api/notifications/${req.params.id}/read`, {}, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Mark as read error:', error.message);
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      const response = await axios.put(`${NOTIFICATION_SERVICE_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Mark all as read error:', error.message);
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      const response = await axios.delete(`${NOTIFICATION_SERVICE_URL}/api/notifications/${req.params.id}`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Delete notification error:', error.message);
      next(error);
    }
  }

  async updateNotificationSettings(req, res, next) {
    try {
      const response = await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/settings`, req.body, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Update notification settings error:', error.message);
      next(error);
    }
  }

  async getNotificationSettings(req, res, next) {
    try {
      const response = await axios.get(`${NOTIFICATION_SERVICE_URL}/api/notifications/settings`, {
        headers: { Authorization: req.headers.authorization }
      });
      res.status(response.status).json(response.data);
    } catch (error) {
      logger.error('Get notification settings error:', error.message);
      next(error);
    }
  }
}

module.exports = new NotificationController();
