import express from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
  deleteNotification,
  saveNotificationPreferences,
  createNotification,
} from '../controllers/notificationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get notifications
router.get('/', authMiddleware, getNotifications);

// Mark as read
router.patch('/:id/read', authMiddleware, markNotificationAsRead);

// Mark all as read
router.patch('/read-all', authMiddleware, markAllAsRead);

// Delete notification
router.delete('/:id', authMiddleware, deleteNotification);

// Save preferences
router.post('/preferences', authMiddleware, saveNotificationPreferences);

// Create notification (internal)
router.post('/', authMiddleware, createNotification);

export default router;
