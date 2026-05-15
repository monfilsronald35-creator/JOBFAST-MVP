const authService = require('../services/auth.service');
const logger = require('../utils/logger');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone, role, professions, deviceInfo } = req.body;
      
      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
        phone,
        role,
        professions,
        deviceInfo
      });

      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Register error:', error.message);
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password, deviceInfo } = req.body;
      
      const result = await authService.login({
        email,
        password,
        deviceInfo
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Login error:', error.message);
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      
      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Refresh token error:', error.message);
      next(error);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      
      const result = await authService.forgotPassword(email);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Forgot password error:', error.message);
      next(error);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      
      const result = await authService.resetPassword(token, newPassword);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Reset password error:', error.message);
      next(error);
    }
  }

  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;
      
      const result = await authService.verifyEmail(token);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Verify email error:', error.message);
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.id);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Get me error:', error.message);
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const updates = req.body;
      const user = await authService.updateProfile(req.user.id, updates);

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      logger.error('Update profile error:', error.message);
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const result = await authService.logout(req.user.id, req.headers.authorization);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Logout error:', error.message);
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Change password error:', error.message);
      next(error);
    }
  }
}

module.exports = new AuthController();
