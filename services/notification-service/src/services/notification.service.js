const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class NotificationService {
  async getNotifications(userId, { page = 1, limit = 20, type, isRead }) {
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(type && { type }),
      ...(isRead !== undefined && { isRead: isRead === 'true' })
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId, isRead: false }
      })
    ]);

    return {
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }

  async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });

    return {
      id: updatedNotification.id,
      isRead: updatedNotification.isRead
    };
  }

  async markAllAsRead(userId) {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });
  }

  async deleteNotification(notificationId, userId) {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId
      }
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });
  }

  async updateNotificationSettings(userId, settings) {
    const { pushEnabled, emailEnabled, jobAlerts, moneyAlerts, nearbyOffers, profileMessages } = settings;

    const notificationSettings = await prisma.notificationSettings.upsert({
      where: { userId },
      create: {
        userId,
        pushEnabled: pushEnabled ?? true,
        emailEnabled: emailEnabled ?? true,
        jobAlerts: jobAlerts ?? true,
        moneyAlerts: moneyAlerts ?? true,
        nearbyOffers: nearbyOffers ?? true,
        profileMessages: profileMessages ?? true
      },
      update: {
        ...(pushEnabled !== undefined && { pushEnabled }),
        ...(emailEnabled !== undefined && { emailEnabled }),
        ...(jobAlerts !== undefined && { jobAlerts }),
        ...(moneyAlerts !== undefined && { moneyAlerts }),
        ...(nearbyOffers !== undefined && { nearbyOffers }),
        ...(profileMessages !== undefined && { profileMessages })
      }
    });

    return {
      pushEnabled: notificationSettings.pushEnabled,
      emailEnabled: notificationSettings.emailEnabled,
      jobAlerts: notificationSettings.jobAlerts,
      moneyAlerts: notificationSettings.moneyAlerts,
      nearbyOffers: notificationSettings.nearbyOffers,
      profileMessages: notificationSettings.profileMessages
    };
  }

  async getNotificationSettings(userId) {
    const settings = await prisma.notificationSettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      return {
        pushEnabled: true,
        emailEnabled: true,
        jobAlerts: true,
        moneyAlerts: true,
        nearbyOffers: true,
        profileMessages: true
      };
    }

    return {
      pushEnabled: settings.pushEnabled,
      emailEnabled: settings.emailEnabled,
      jobAlerts: settings.jobAlerts,
      moneyAlerts: settings.moneyAlerts,
      nearbyOffers: settings.nearbyOffers,
      profileMessages: settings.profileMessages
    };
  }

  async createNotification(userId, data) {
    const { type, title, message, metadata } = data;

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: metadata || {}
      }
    });

    // Get user's notification settings
    const settings = await this.getNotificationSettings(userId);

    // Emit real-time notification if push is enabled
    if (settings.pushEnabled) {
      global.io?.to(`user:${userId}`).emit('notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata,
        isRead: notification.isRead,
        createdAt: notification.createdAt
      });
    }

    return notification;
  }

  async sendBulkNotifications(userIds, data) {
    const notifications = await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {}
      }))
    });

    // Emit real-time notifications to all users
    userIds.forEach(userId => {
      global.io?.to(`user:${userId}`).emit('notification', {
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata || {},
        isRead: false,
        createdAt: new Date()
      });
    });

    return { count: notifications.count };
  }
}

module.exports = new NotificationService();
