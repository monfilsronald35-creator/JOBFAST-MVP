import Notification from '../models/notification.model.js';
import User from '../models/user.model.js';
import { getProfessionsByCategory } from '../config/categories.js';

/**
 * Find users matching a job/service criteria and create notifications
 */
export const createMatchNotifications = async (job) => {
  try {
    const { category, profession, userId, title, description, location } = job;

    // Find all users in the same category
    const matchingUsers = await User.find({
      category,
      profession: { $in: getProfessionsByCategory(category) },
      _id: { $ne: userId }, // Don't notify the poster
    })
      .select('_id email location')
      .lean();

    if (matchingUsers.length === 0) return;

    // Create notifications for matching users
    const notifications = matchingUsers.map(user => ({
      userId: user._id,
      type: 'job_match',
      category,
      title: `Nouvo ${profession} pou ${location}`,
      message: `${title} - ${description?.substring(0, 100)}...`,
      data: {
        jobId: job._id,
        profession,
        location,
      },
      actionUrl: `/job/${job._id}`,
      sourceUserId: userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }));

    await Notification.insertMany(notifications);
    console.log(`Created ${notifications.length} match notifications for job ${job._id}`);
  } catch (error) {
    console.error('Error creating match notifications:', error.message);
  }
};

/**
 * Notify users when a new user registers in their category
 */
export const notifyNewCategoryMember = async (newUser) => {
  try {
    const { category, profession, _id, name, location } = newUser;

    // Find active businesses/service providers in same category
    const recipients = await User.find({
      category,
      profession: { $in: getProfessionsByCategory(category) },
      _id: { $ne: _id },
      isAvailable: true,
    })
      .select('_id')
      .lean()
      .limit(50); // Limit to prevent spam

    if (recipients.length === 0) return;

    const notifications = recipients.map(user => ({
      userId: user._id,
      type: 'system',
      category,
      title: `Nouvo moun nan ${profession}`,
      message: `${name} soti nan ${location || 'nan zòn ou'}`,
      data: {
        newUserId: _id,
        profession,
      },
      actionUrl: `/user/${_id}`,
      sourceUserId: _id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }));

    await Notification.insertMany(notifications);
    console.log(`Notified ${notifications.length} users about new member`);
  } catch (error) {
    console.error('Error notifying new category member:', error.message);
  }
};

/**
 * Send alert notification to users near a location
 */
export const sendLocationAlert = async (category, radius, location, title, message) => {
  try {
    // For MVP, simple category + location match
    const affectedUsers = await User.find({
      category,
      location: { $ne: null },
    })
      .select('_id')
      .lean()
      .limit(100);

    if (affectedUsers.length === 0) return;

    const notifications = affectedUsers.map(user => ({
      userId: user._id,
      type: 'alert',
      category,
      title,
      message,
      data: {
        location,
        radius,
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
    }));

    await Notification.insertMany(notifications);
    console.log(`Sent ${notifications.length} location alerts`);
  } catch (error) {
    console.error('Error sending location alerts:', error.message);
  }
};

/**
 * Clean up expired notifications (called by cron job)
 */
export const cleanupExpiredNotifications = async () => {
  try {
    const result = await Notification.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    console.log(`Cleaned up ${result.deletedCount} expired notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up notifications:', error.message);
  }
};
