const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class FraudService {
  async reportFraud(reporterId, { reportedUserId, reason, description, evidence }) {
    // Calculate fraud score for the reported user
    const fraudScore = await this.calculateFraudScore(reportedUserId);

    // Create fraud report
    const report = await prisma.fraudReport.create({
      data: {
        reporterId,
        reportedUserId,
        reason,
        description,
        evidence,
        status: 'pending',
        fraudScore
      }
    });

    // If fraud score is high, flag the user
    if (fraudScore > process.env.FRAUD_THRESHOLD || 0.7) {
      await this.flagUser(reportedUserId, fraudScore);
    }

    return {
      id: report.id,
      reason: report.reason,
      status: report.status,
      fraudScore: report.fraudScore,
      createdAt: report.createdAt
    };
  }

  async getFraudReports(userId, { page = 1, limit = 20, status }) {
    const skip = (page - 1) * limit;
    const where = {
      reporterId: userId,
      ...(status && { status })
    };

    const [reports, total] = await Promise.all([
      prisma.fraudReport.findMany({
        where,
        include: {
          reportedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.fraudReport.count({ where })
    ]);

    return {
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getFraudScore(userId) {
    const score = await this.calculateFraudScore(userId);
    return {
      userId,
      fraudScore: score,
      riskLevel: this.getRiskLevel(score),
      factors: await this.getFraudFactors(userId)
    };
  }

  async verifyDevice(userId, { fingerprint, userAgent, ip }) {
    // Check if device fingerprint exists for this user
    const existingDevice = await prisma.userDevice.findFirst({
      where: {
        userId,
        fingerprint
      }
    });

    if (existingDevice) {
      // Update last seen
      await prisma.userDevice.update({
        where: { id: existingDevice.id },
        data: {
          lastSeen: new Date(),
          userAgent,
          ip
        }
      });

      return {
        verified: true,
        isNewDevice: false,
        deviceId: existingDevice.id
      };
    }

    // New device detected
    const newDevice = await prisma.userDevice.create({
      data: {
        userId,
        fingerprint,
        userAgent,
        ip,
        isTrusted: false
      }
    });

    // Flag as potential fraud if multiple devices
    const deviceCount = await prisma.userDevice.count({
      where: { userId }
    });

    if (deviceCount > 3) {
      await this.flagUser(userId, 0.8);
    }

    return {
      verified: false,
      isNewDevice: true,
      deviceId: newDevice.id,
      warning: deviceCount > 3 ? 'Multiple devices detected' : null
    };
  }

  async checkDuplicateAccount({ email, phone, deviceFingerprint }) {
    const duplicates = [];

    // Check email
    if (email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });
      if (emailExists) {
        duplicates.push({ type: 'email', value: email });
      }
    }

    // Check phone
    if (phone) {
      const phoneExists = await prisma.user.findFirst({
        where: { phone }
      });
      if (phoneExists) {
        duplicates.push({ type: 'phone', value: phone });
      }
    }

    // Check device fingerprint
    if (deviceFingerprint) {
      const deviceExists = await prisma.userDevice.findFirst({
        where: { fingerprint: deviceFingerprint }
      });
      if (deviceExists) {
        duplicates.push({ type: 'device', value: deviceFingerprint });
      }
    }

    return {
      hasDuplicates: duplicates.length > 0,
      duplicates,
      riskLevel: duplicates.length > 1 ? 'high' : duplicates.length === 1 ? 'medium' : 'low'
    };
  }

  async getScamKeywords() {
    const keywords = await prisma.scamKeyword.findMany({
      orderBy: { severity: 'desc' }
    });

    return keywords.map(k => ({
      id: k.id,
      keyword: k.keyword,
      severity: k.severity,
      createdAt: k.createdAt
    }));
  }

  async addScamKeyword({ keyword, severity = 'medium' }) {
    const existing = await prisma.scamKeyword.findFirst({
      where: { keyword: keyword.toLowerCase() }
    });

    if (existing) {
      throw new Error('Keyword already exists');
    }

    const keywordData = await prisma.scamKeyword.create({
      data: {
        keyword: keyword.toLowerCase(),
        severity
      }
    });

    return {
      id: keywordData.id,
      keyword: keywordData.keyword,
      severity: keywordData.severity,
      createdAt: keywordData.createdAt
    };
  }

  async deleteScamKeyword(keywordId) {
    const keyword = await prisma.scamKeyword.findUnique({
      where: { id: keywordId }
    });

    if (!keyword) {
      throw new Error('Keyword not found');
    }

    await prisma.scamKeyword.delete({
      where: { id: keywordId }
    });
  }

  async calculateFraudScore(userId) {
    let score = 0;

    // Factor 1: Number of fraud reports
    const reportCount = await prisma.fraudReport.count({
      where: { reportedUserId: userId }
    });
    score += Math.min(reportCount * 0.1, 0.3);

    // Factor 2: Device count
    const deviceCount = await prisma.userDevice.count({
      where: { userId }
    });
    score += Math.min(deviceCount * 0.05, 0.2);

    // Factor 3: Account age (newer accounts have higher risk)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (user) {
      const accountAge = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24); // days
      score += Math.max(0, 0.2 - (accountAge * 0.01));
    }

    // Factor 4: Suspicious activity patterns
    const suspiciousActivity = await prisma.suspiciousActivity.count({
      where: { userId }
    });
    score += Math.min(suspiciousActivity * 0.05, 0.15);

    // Factor 5: Verified status
    if (user && !user.isVerified) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  async getFraudFactors(userId) {
    const factors = [];

    const reportCount = await prisma.fraudReport.count({
      where: { reportedUserId: userId }
    });
    if (reportCount > 0) {
      factors.push({ name: 'Fraud Reports', value: reportCount, impact: 'high' });
    }

    const deviceCount = await prisma.userDevice.count({
      where: { userId }
    });
    if (deviceCount > 3) {
      factors.push({ name: 'Multiple Devices', value: deviceCount, impact: 'medium' });
    }

    const suspiciousActivity = await prisma.suspiciousActivity.count({
      where: { userId }
    });
    if (suspiciousActivity > 0) {
      factors.push({ name: 'Suspicious Activity', value: suspiciousActivity, impact: 'high' });
    }

    return factors;
  }

  getRiskLevel(score) {
    if (score >= 0.8) return 'critical';
    if (score >= 0.6) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  async flagUser(userId, fraudScore) {
    await prisma.fraudFlag.create({
      data: {
        userId,
        fraudScore,
        status: 'active'
      }
    });

    // Log the flag
    logger.warn(`User ${userId} flagged for fraud with score ${fraudScore}`);
  }

  async checkContentForScam(content) {
    const keywords = await this.getScamKeywords();
    const foundKeywords = [];

    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword.keyword)) {
        foundKeywords.push({
          keyword: keyword.keyword,
          severity: keyword.severity
        });
      }
    }

    return {
      hasScamContent: foundKeywords.length > 0,
      foundKeywords,
      riskLevel: foundKeywords.some(k => k.severity === 'high') ? 'high' : 'medium'
    };
  }
}

module.exports = new FraudService();
