const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class AdminService {
  async getAllUsers({ page = 1, limit = 20, role, status, search }) {
    const skip = (page - 1) * limit;
    const where = {
      ...(role && { role }),
      ...(status === 'active' && { isSuspended: false }),
      ...(status === 'suspended' && { isSuspended: true }),
      ...(status === 'verified' && { isVerified: true }),
      ...(status === 'unverified' && { isVerified: false }),
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
          isSuspended: true,
          trustScore: true,
          createdAt: true
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateUserStatus(userId, { status, reason }) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: status === 'suspended',
        suspensionReason: reason || null
      }
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      isSuspended: updatedUser.isSuspended,
      suspensionReason: updatedUser.suspensionReason
    };
  }

  async verifyUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      isVerified: updatedUser.isVerified
    };
  }

  async getFraudReviews({ page = 1, limit = 20, status }) {
    const skip = (page - 1) * limit;
    const where = {
      ...(status && { status })
    };

    const [reviews, total] = await Promise.all([
      prisma.fraudReport.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
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
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async reviewFraudCase(reportId, { status, notes, action }) {
    const report = await prisma.fraudReport.findUnique({
      where: { id: reportId }
    });

    if (!report) {
      throw new Error('Fraud report not found');
    }

    const updatedReport = await prisma.fraudReport.update({
      where: { id: reportId },
      data: {
        status,
        reviewedAt: new Date(),
        notes
      }
    });

    // Take action based on review
    if (action === 'suspend' && status === 'resolved') {
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { isSuspended: true, suspensionReason: 'Fraud detected' }
      });
    } else if (action === 'flag' && status === 'resolved') {
      await prisma.fraudFlag.create({
        data: {
          userId: report.reportedUserId,
          fraudScore: report.fraudScore,
          status: 'active'
        }
      });
    }

    return {
      id: updatedReport.id,
      status: updatedReport.status,
      reviewedAt: updatedReport.reviewedAt
    };
  }

  async getPayouts({ page = 1, limit = 20, status, method }) {
    const skip = (page - 1) * limit;
    const where = {
      ...(status && { status }),
      ...(method && { payoutMethod: method })
    };

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        include: {
          user: {
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
      prisma.payout.count({ where })
    ]);

    return {
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async approvePayout(payoutId, { status, processedBy, notes }) {
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId }
    });

    if (!payout) {
      throw new Error('Payout not found');
    }

    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: {
        status,
        processedBy,
        processedAt: new Date(),
        notes
      }
    });

    // If approved, process the payout
    if (status === 'approved') {
      // In production, integrate with payment processor
      logger.info(`Processing payout ${payoutId} for amount ${payout.amount}`);
    }

    return {
      id: updatedPayout.id,
      status: updatedPayout.status,
      processedAt: updatedPayout.processedAt
    };
  }

  async getAllCards({ page = 1, limit = 20, status, userId }) {
    const skip = (page - 1) * limit;
    const where = {
      ...(status === 'active' && { status: 'active' }),
      ...(status === 'frozen' && { isFrozen: true }),
      ...(status === 'blocked' && { status: 'blocked' }),
      ...(userId && { userId })
    };

    const [cards, total] = await Promise.all([
      prisma.virtualCard.findMany({
        where,
        include: {
          user: {
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
      prisma.virtualCard.count({ where })
    ]);

    return {
      cards,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async blockCard(cardId, { reason }) {
    const card = await prisma.virtualCard.findUnique({
      where: { id: cardId }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    const updatedCard = await prisma.virtualCard.update({
      where: { id: cardId },
      data: {
        status: 'blocked',
        isFrozen: true,
        blockReason: reason
      }
    });

    // Cancel Stripe card
    // In production, integrate with Stripe API
    logger.info(`Blocking card ${cardId} for reason: ${reason}`);

    return {
      id: updatedCard.id,
      status: updatedCard.status,
      isFrozen: updatedCard.isFrozen
    };
  }
}

module.exports = new AdminService();
