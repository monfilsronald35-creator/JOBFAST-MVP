import Notification from '../models/notification.model.js';

/**
 * @desc    Get user notifications
 * @route   GET /api/v1/notifications
 * @access  Private
 */
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { category, type, isRead, limit = 20, skip = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Otentifikasyon obligatwa',
        },
      });
    }

    const filter = { userId };
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

    return res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          pages: Math.ceil(total / limit),
        },
        stats: {
          unreadCount,
        },
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

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Otentifikasyon obligatwa' },
      });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notifikasyon pa jwenn' },
      });
    }

    return res.status(200).json({
      success: true,
      data: { notification },
    });
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

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Otentifikasyon obligatwa' },
      });
    }

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
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

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Otentifikasyon obligatwa' },
      });
    }

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notifikasyon pa jwenn' },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notifikasyon efase',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save notification preferences
 * @route   POST /api/v1/notifications/preferences
 * @access  Private
 */
export const saveNotificationPreferences = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { preferences } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Otentifikasyon obligatwa' },
      });
    }

    // Preferences would be stored in user document
    // For now, we just acknowledge receipt
    return res.status(200).json({
      success: true,
      message: 'Preferans sove',
      data: { preferences },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create notification (internal)
 * @route   POST /api/v1/notifications (internal use only)
 * @access  Private
 */
export const createNotification = async (req, res, next) => {
  try {
    const { userId, type, category, title, message, data, actionUrl, sourceUserId } = req.body;

    const notification = new Notification({
      userId,
      type,
      category,
      title,
      message,
      data: data || {},
      actionUrl,
      sourceUserId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await notification.save();

    return res.status(201).json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    next(error);
  }
};
