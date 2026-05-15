const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

class NotificationController {
  async getNotifications(req, res, next) {
    try {
      const { page, limit, type, isRead } = req.query;
      const notifications = await notificationService.getNotifications(req.user.id, { page, limit, type, isRead });
      res.status(200).json(notifications);
    } catch (error) {
      logger.error('Get notifications error:', error.message);
      next(error);
    }
  }

  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user.id);
      res.status(200).json(notification);
    } catch (error) {
      logger.error('Mark as read error:', error.message);
      next(error);
    }
  }

  async markAllAsRead(req, res, next) {
    try {
      await notificationService.markAllAsRead(req.user.id);
      res.status(200).json({ message: 'All notifications marked as read' });
    } catch (error) {
      logger.error('Mark all as read error:', error.message);
      next(error);
    }
  }

  async deleteNotification(req, res, next) {
    try {
      await notificationService.deleteNotification(req.params.id, req.user.id);
      res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      logger.error('Delete notification error:', error.message);
      next(error);
    }
  }

  async updateNotificationSettings(req, res, next) {
    try {
      const settings = req.body;
      const notificationSettings = await notificationService.updateNotificationSettings(req.user.id, settings);
      res.status(200).json(notificationSettings);
    } catch (error) {
      logger.error('Update notification settings error:', error.message);
      next(error);
    }
  }

  async getNotificationSettings(req, res, next) {
    try {
      const settings = await notificationService.getNotificationSettings(req.user.id);
      res.status(200).json(settings);
    } catch (error) {
      logger.error('Get notification settings error:', error.message);
      next(error);
    }
  }
}

module.exports = new NotificationController();
