const userService = require('../services/user.service');
const logger = require('../utils/logger');

class UserController {
  async getProfile(req, res, next) {
    try {
      const profile = await userService.getProfile(req.user.id);
      res.status(200).json(profile);
    } catch (error) {
      logger.error('Get profile error:', error.message);
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const updates = req.body;
      const profile = await userService.updateProfile(req.user.id, updates);
      res.status(200).json(profile);
    } catch (error) {
      logger.error('Update profile error:', error.message);
      next(error);
    }
  }

  async getProfessions(req, res, next) {
    try {
      const professions = await userService.getProfessions(req.user.id);
      res.status(200).json(professions);
    } catch (error) {
      logger.error('Get professions error:', error.message);
      next(error);
    }
  }

  async addProfession(req, res, next) {
    try {
      const { professionId, experience, skills } = req.body;
      const profession = await userService.addProfession(req.user.id, { professionId, experience, skills });
      res.status(201).json(profession);
    } catch (error) {
      logger.error('Add profession error:', error.message);
      next(error);
    }
  }

  async removeProfession(req, res, next) {
    try {
      await userService.removeProfession(req.user.id, req.params.id);
      res.status(200).json({ message: 'Profession removed successfully' });
    } catch (error) {
      logger.error('Remove profession error:', error.message);
      next(error);
    }
  }

  async getLocation(req, res, next) {
    try {
      const location = await userService.getLocation(req.user.id);
      res.status(200).json(location);
    } catch (error) {
      logger.error('Get location error:', error.message);
      next(error);
    }
  }

  async updateLocation(req, res, next) {
    try {
      const { latitude, longitude, city, state, country, address } = req.body;
      const location = await userService.updateLocation(req.user.id, { latitude, longitude, city, state, country, address });
      res.status(200).json(location);
    } catch (error) {
      logger.error('Update location error:', error.message);
      next(error);
    }
  }

  async getNearbyWorkers(req, res, next) {
    try {
      const { latitude, longitude, radius, profession } = req.query;
      const workers = await userService.getNearbyWorkers(req.user.id, { latitude, longitude, radius, profession });
      res.status(200).json(workers);
    } catch (error) {
      logger.error('Get nearby workers error:', error.message);
      next(error);
    }
  }

  async getNearbyJobs(req, res, next) {
    try {
      const { latitude, longitude, radius } = req.query;
      const jobs = await userService.getNearbyJobs(req.user.id, { latitude, longitude, radius });
      res.status(200).json(jobs);
    } catch (error) {
      logger.error('Get nearby jobs error:', error.message);
      next(error);
    }
  }

  async uploadAvatar(req, res, next) {
    try {
      const avatarUrl = req.body.avatarUrl;
      const profile = await userService.uploadAvatar(req.user.id, avatarUrl);
      res.status(200).json(profile);
    } catch (error) {
      logger.error('Upload avatar error:', error.message);
      next(error);
    }
  }

  async deleteAvatar(req, res, next) {
    try {
      const profile = await userService.deleteAvatar(req.user.id);
      res.status(200).json(profile);
    } catch (error) {
      logger.error('Delete avatar error:', error.message);
      next(error);
    }
  }
}

module.exports = new UserController();
