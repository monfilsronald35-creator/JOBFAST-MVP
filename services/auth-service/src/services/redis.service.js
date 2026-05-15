const redis = require('redis');
const logger = require('../utils/logger');

let redisClient;

class RedisService {
  async connect() {
    try {
      redisClient = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD
      });

      await redisClient.connect();
      logger.info('Connected to Redis');
    } catch (error) {
      logger.error('Redis connection error:', error);
      throw error;
    }
  }

  async storeRefreshToken(userId, refreshToken) {
    const key = `refresh_token:${userId}`;
    await redisClient.setEx(key, 30 * 24 * 60 * 60, refreshToken); // 30 days
  }

  async getRefreshToken(userId) {
    const key = `refresh_token:${userId}`;
    return await redisClient.get(key);
  }

  async deleteRefreshToken(userId) {
    const key = `refresh_token:${userId}`;
    await redisClient.del(key);
  }

  async blacklistToken(token, ttl) {
    const key = `blacklist:${token}`;
    await redisClient.setEx(key, ttl, '1');
  }

  async isTokenBlacklisted(token) {
    const key = `blacklist:${token}`;
    const result = await redisClient.get(key);
    return result === '1';
  }

  async disconnect() {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Disconnected from Redis');
    }
  }
}

// Initialize connection
if (process.env.NODE_ENV !== 'test') {
  RedisService.prototype.connect().catch(console.error);
}

module.exports = new RedisService();
