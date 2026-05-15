const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } = require('../utils/errors');
const emailService = require('./email.service');
const redisService = require('./redis.service');

const prisma = new PrismaClient();

class AuthService {
  async register({ email, password, firstName, lastName, phone, role, professions, deviceInfo }) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password with stronger salt rounds
      const hashedPassword = await bcrypt.hash(password, 12);

      // Detect role if not provided using enhanced detection
      const detectedRole = role || await this.detectRole({ professions, firstName, lastName, email });

      // Create user with transaction
      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone,
            role: detectedRole,
            isVerified: false,
            deviceInfo: deviceInfo || {},
            trustScore: 50 // Initial trust score
          }
        });

        // Add professions if provided
        if (professions && professions.length > 0) {
          await tx.userProfession.createMany({
            data: professions.map(professionId => ({
              userId: newUser.id,
              professionId
            }))
          });
        }

        return newUser;
      });

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          type: 'EMAIL_VERIFICATION',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });

      // Send verification email
      await emailService.sendVerificationEmail(email, verificationToken);

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      // Store refresh token in Redis with expiry
      await redisService.storeRefreshToken(user.id, refreshToken);

      logger.info(`User registered successfully: ${email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
          trustScore: user.trustScore
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Registration error:', error);
      if (error instanceof ConflictError) throw error;
      throw new BadRequestError('Registration failed. Please try again.');
    }
  }

  async login({ email, password, deviceInfo }) {
    try {
      // Find user
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Update device info
      if (deviceInfo) {
        await prisma.user.update({
          where: { id: user.id },
          data: { deviceInfo, lastLoginAt: new Date() }
        });
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user);

      // Store refresh token in Redis
      await redisService.storeRefreshToken(user.id, refreshToken);

      logger.info(`User logged in successfully: ${email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
          trustScore: user.trustScore
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Login error:', error);
      if (error instanceof UnauthorizedError) throw error;
      throw new BadRequestError('Login failed. Please try again.');
    }
  }

  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

      // Check if refresh token exists in Redis
      const storedToken = await redisService.getRefreshToken(decoded.userId);
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // Get user
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      // Update refresh token in Redis
      await redisService.storeRefreshToken(user.id, tokens.refreshToken);

      logger.info(`Token refreshed for user: ${user.email}`);

      return tokens;
    } catch (error) {
      logger.error('Refresh token error:', error);
      if (error instanceof UnauthorizedError || error instanceof NotFoundError) throw error;
      throw new UnauthorizedError('Token refresh failed');
    }
  }

  async forgotPassword(email) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Don't reveal if user exists for security
        logger.info(`Password reset requested for non-existent email: ${email}`);
        return { message: 'If the email exists, a reset link has been sent' };
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Store reset token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        }
      });

      // Send reset email
      await emailService.sendPasswordResetEmail(email, resetToken);

      logger.info(`Password reset email sent to: ${email}`);

      return { message: 'If the email exists, a reset link has been sent' };
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw new BadRequestError('Failed to process password reset request');
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

      const resetToken = await prisma.passwordResetToken.findFirst({
        where: {
          token: hashedToken,
          expiresAt: { gt: new Date() }
        }
      });

      if (!resetToken) {
        throw new BadRequestError('Invalid or expired reset token');
      }

      // Hash new password with stronger salt rounds
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user password
      await prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      });

      // Delete reset token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id }
      });

      logger.info(`Password reset successful for user: ${resetToken.userId}`);

      return { message: 'Password reset successful' };
    } catch (error) {
      logger.error('Reset password error:', error);
      if (error instanceof BadRequestError) throw error;
      throw new BadRequestError('Failed to reset password');
    }
  }

  async verifyEmail(token) {
    try {
      const verificationToken = await prisma.verificationToken.findFirst({
        where: {
          token,
          type: 'EMAIL_VERIFICATION',
          expiresAt: { gt: new Date() }
        }
      });

      if (!verificationToken) {
        throw new BadRequestError('Invalid or expired verification token');
      }

      // Verify user
      const user = await prisma.user.update({
        where: { id: verificationToken.userId },
        data: { isVerified: true }
      });

      // Delete verification token
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id }
      });

      logger.info(`Email verified for user: ${user.email}`);

      return { message: 'Email verified successfully' };
    } catch (error) {
      logger.error('Verify email error:', error);
      if (error instanceof BadRequestError) throw error;
      throw new BadRequestError('Failed to verify email');
    }
  }

  async getUserById(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isVerified: true,
          trustScore: true,
          bio: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          professions: {
            include: {
              profession: true
            }
          }
        }
      });

      if (!user) {
        throw new NotFoundError('User not found');
      }

      return user;
    } catch (error) {
      logger.error('Get user error:', error);
      if (error instanceof NotFoundError) throw error;
      throw new BadRequestError('Failed to fetch user');
    }
  }

  async updateProfile(userId, updates) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          isVerified: true,
          trustScore: true,
          bio: true,
          avatarUrl: true,
          updatedAt: true
        }
      });

      logger.info(`Profile updated for user: ${user.email}`);

      return user;
    } catch (error) {
      logger.error('Update profile error:', error);
      throw new BadRequestError('Failed to update profile');
    }
  }

  async logout(userId, authHeader) {
    try {
      // Remove refresh token from Redis
      await redisService.deleteRefreshToken(userId);

      // Add access token to blacklist
      const token = authHeader.substring(7);
      const decoded = jwt.decode(token);
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await redisService.blacklistToken(token, ttl);
      }

      logger.info(`User logged out: ${userId}`);

      return { message: 'Logged out successfully' };
    } catch (error) {
      logger.error('Logout error:', error);
      throw new BadRequestError('Failed to logout');
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      logger.info(`Password changed for user: ${user.email}`);

      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Change password error:', error);
      if (error instanceof UnauthorizedError || error instanceof NotFoundError) throw error;
      throw new BadRequestError('Failed to change password');
    }
  }

  async detectRole({ professions, firstName, lastName, email }) {
    // Enhanced role detection based on professions and user info
    // This uses keyword analysis for intelligent role assignment
    
    if (!professions || professions.length === 0) {
      // Analyze name and email for hints
      const fullName = `${firstName} ${lastName}`.toLowerCase();
      const emailDomain = email?.split('@')[1]?.toLowerCase() || '';
      
      // Business indicators
      const businessKeywords = ['ceo', 'manager', 'director', 'owner', 'entrepreneur', 'founder', 'boss', 'lead', 'head', 'president', 'executive'];
      const hasBusinessKeyword = businessKeywords.some(kw => fullName.includes(kw) || emailDomain.includes(kw));
      
      if (hasBusinessKeyword) return 'boss';
      
      // Trade indicators
      const tradeKeywords = ['trader', 'merchant', 'seller', 'vendor', 'trade', 'market', 'sales', 'commerce'];
      const hasTradeKeyword = tradeKeywords.some(kw => fullName.includes(kw) || emailDomain.includes(kw));
      
      if (hasTradeKeyword) return 'tradex';
      
      return 'worker';
    }

    // Analyze professions for role indicators
    const professionStrings = professions.map(p => p.toString().toLowerCase()).join(' ');
    
    // Business-related professions
    const businessProfessions = ['ceo', 'manager', 'director', 'owner', 'entrepreneur', 'founder', 'business', 'executive', 'administrator', 'supervisor'];
    const hasBusinessProfession = businessProfessions.some(bp => professionStrings.includes(bp));

    if (hasBusinessProfession) {
      return 'boss';
    }

    // Trade-related professions
    const tradeProfessions = ['trader', 'merchant', 'seller', 'vendor', 'sales', 'commerce', 'trade', 'marketing', 'broker'];
    const hasTradeProfession = tradeProfessions.some(tp => professionStrings.includes(tp));

    if (hasTradeProfession) {
      return 'tradex';
    }

    // If user has multiple types of professions, assign hybrid
    const hasWorkerProfession = professionStrings.includes('developer') || 
                                professionStrings.includes('engineer') || 
                                professionStrings.includes('worker') ||
                                professionStrings.includes('technician');
    
    if (hasBusinessProfession || hasTradeProfession) {
      if (hasWorkerProfession) {
        return 'hybrid';
      }
    }

    // Default to worker
    return 'worker';
  }

  async generateTokens(user) {
    const accessToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        isVerified: user.isVerified 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
    );

    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();
