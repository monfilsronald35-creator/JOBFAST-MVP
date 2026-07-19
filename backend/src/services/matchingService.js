// =========================================================================
// JOBFAST — MATCHING SERVICE (Supabase)
// =========================================================================
import supabase from '../config/supabaseClient.js';
import notificationRepo from '../repositories/notification.repository.js';
import { getProfessionsByCategory } from '../config/categories.js';

/**
 * Find users matching a job/service criteria and create notifications
 */
export const createMatchNotifications = async (job) => {
  try {
    const { category, profession, userId, title, description, location } = job;

    const professions = getProfessionsByCategory(category);

    const { data: matchingUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('category', category)
      .in('profession', professions.length ? professions : [profession])
      .neq('id', userId)
      .limit(100);

    if (!matchingUsers?.length) return;

    const notifications = matchingUsers.map(user => ({
      userId:       user.id,
      type:         'job_match',
      category,
      title:        `Nouvo ${profession} pou ${location}`,
      message:      `${title} - ${description?.substring(0, 100) || ''}...`,
      data:         { jobId: job._id || job.id, profession, location },
      actionUrl:    `/job/${job._id || job.id}`,
      sourceUserId: userId,
      expiresAt:    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    await notificationRepo.broadcast(notifications);
    console.log(`Created ${notifications.length} match notifications for job ${job._id || job.id}`);
  } catch (error) {
    console.error('Error creating match notifications:', error.message);
  }
};

/**
 * Notify users when a new user registers in their category
 */
export const notifyNewCategoryMember = async (newUser) => {
  try {
    const { category, profession, _id, id, name, location } = newUser;
    const newUserId = _id || id;

    if (!category) return;

    const professions = getProfessionsByCategory(category);

    const { data: recipients } = await supabase
      .from('profiles')
      .select('id')
      .eq('category', category)
      .in('profession', professions.length ? professions : [profession].filter(Boolean))
      .neq('id', newUserId)
      .eq('is_available', true)
      .limit(50);

    if (!recipients?.length) return;

    const cityName = typeof location === 'string'
      ? location
      : location?.city || 'nan zòn ou';

    const notifications = recipients.map(user => ({
      userId:       user.id,
      type:         'system',
      category,
      title:        `Nouvo moun nan ${profession || category}`,
      message:      `${name} soti nan ${cityName}`,
      data:         { newUserId, profession },
      actionUrl:    `/user/${newUserId}`,
      sourceUserId: newUserId,
      expiresAt:    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    await notificationRepo.broadcast(notifications);
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
    const { data: affectedUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('category', category)
      .limit(100);

    if (!affectedUsers?.length) return;

    const notifications = affectedUsers.map(user => ({
      userId:    user.id,
      type:      'alert',
      category,
      title,
      message,
      data:      { location, radius },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }));

    await notificationRepo.broadcast(notifications);
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
    await notificationRepo.deleteExpired();
    console.log('Cleaned up expired notifications');
  } catch (error) {
    console.error('Error cleaning up notifications:', error.message);
  }
};