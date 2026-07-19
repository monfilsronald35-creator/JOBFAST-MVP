import notificationRepo from '../repositories/notification.repository.js';

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Otentifikasyon obligatwa' } });

    const limit   = Math.min(parseInt(req.query.limit) || 20, 100);
    const page    = Math.max(parseInt(req.query.page)  || 1, 1);
    const unreadOnly = req.query.isRead === 'false';

    const result   = await notificationRepo.getUserNotifications(userId, { page, limit, unreadOnly });
    const unreadCount = await notificationRepo.countUnread(userId);

    return res.status(200).json({
      success: true,
      data: {
        notifications: result.notifications,
        pagination: {
          total: result.total,
          limit,
          page,
          pages: Math.ceil(result.total / limit),
        },
        stats: { unreadCount },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark notification as read
 * @route   PATCH /api/v1/notifications/:id/read
 * @access  Private
 */
export const markNotificationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Otentifikasyon obligatwa' } });

    const notification = await notificationRepo.markRead(id, userId);
    if (!notification) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notifikasyon pa jwenn' } });

    return res.status(200).json({ success: true, data: { notification } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark all notifications as read
 * @route   PATCH /api/v1/notifications/read-all
 * @access  Private
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Otentifikasyon obligatwa' } });

    await notificationRepo.markAllRead(userId);
    return res.status(200).json({ success: true, data: { modifiedCount: -1 } }); // count not available from Supabase update
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete notification
 * @route   DELETE /api/v1/notifications/:id
 * @access  Private
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Otentifikasyon obligatwa' } });

    await notificationRepo.delete(id);
    return res.status(200).json({ success: true, message: 'Notifikasyon efase' });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save notification preferences (acknowledged, not persisted yet)
 * @route   POST /api/v1/notifications/preferences
 * @access  Private
 */
export const saveNotificationPreferences = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Otentifikasyon obligatwa' } });

    const { preferences } = req.body;
    return res.status(200).json({ success: true, message: 'Preferans sove', data: { preferences } });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create notification (internal use)
 * @route   POST /api/v1/notifications
 * @access  Private
 */
export const createNotification = async (req, res, next) => {
  try {
    const { userId, type, category, title, message, data, actionUrl, sourceUserId } = req.body;

    const notification = await notificationRepo.insert({
      userId,
      type,
      category,
      title,
      message,
      data: data || {},
      actionUrl,
      sourceUserId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return res.status(201).json({ success: true, data: { notification } });
  } catch (error) {
    next(error);
  }
};