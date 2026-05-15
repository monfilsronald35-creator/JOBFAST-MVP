const logger = require('./logger');

module.exports = (io) => {
  // Store for connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Join user's personal room
    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
      connectedUsers.set(userId, socket.id);
      logger.info(`User ${userId} joined their room`);
    });

    // Leave user's personal room
    socket.on('leave', (userId) => {
      socket.leave(`user:${userId}`);
      connectedUsers.delete(userId);
      logger.info(`User ${userId} left their room`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
      // Remove from connected users
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          break;
        }
      }
    });

    // Handle custom events
    socket.on('notification:read', (notificationId) => {
      socket.emit('notification:read:ack', { notificationId });
    });

    socket.on('notification:delete', (notificationId) => {
      socket.emit('notification:delete:ack', { notificationId });
    });
  });

  // Make io globally accessible for other modules
  global.io = io;
};
