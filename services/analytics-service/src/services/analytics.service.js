const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class AnalyticsService {
  async getDashboard({ period = '7d' }) {
    const dateRange = this.getDateRange(period);

    const [totalUsers, activeUsers, totalJobs, activeJobs, totalTransactions, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          updatedAt: { gte: dateRange.start }
        }
      }),
      prisma.job.count(),
      prisma.job.count({
        where: {
          status: 'active',
          createdAt: { gte: dateRange.start }
        }
      }),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        where: {
          status: 'completed',
          createdAt: { gte: dateRange.start }
        },
        _sum: {
          amount: true
        }
      })
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        growth: await this.calculateGrowth('users', period)
      },
      jobs: {
        total: totalJobs,
        active: activeJobs,
        growth: await this.calculateGrowth('jobs', period)
      },
      transactions: {
        total: totalTransactions,
        revenue: totalRevenue._sum.amount || 0,
        growth: await this.calculateGrowth('transactions', period)
      },
      period,
      generatedAt: new Date()
    };
  }

  async getUserAnalytics({ period = '7d', role, status }) {
    const dateRange = this.getDateRange(period);
    const where = {
      ...(role && { role }),
      ...(status === 'verified' && { isVerified: true }),
      ...(status === 'unverified' && { isVerified: false }),
      createdAt: { gte: dateRange.start }
    };

    const [totalUsers, usersByRole, usersByVerification] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.groupBy({
        by: ['role'],
        where,
        _count: true
      }),
      prisma.user.groupBy({
        by: ['isVerified'],
        where,
        _count: true
      })
    ]);

    return {
      total: totalUsers,
      byRole: usersByRole.map(r => ({ role: r.role, count: r._count })),
      byVerification: usersByVerification.map(v => ({ verified: v.isVerified, count: v._count })),
      period,
      generatedAt: new Date()
    };
  }

  async getJobAnalytics({ period = '7d', status, profession }) {
    const dateRange = this.getDateRange(period);
    const where = {
      ...(status && { status }),
      ...(profession && { profession: { name: { contains: profession, mode: 'insensitive' } } }),
      createdAt: { gte: dateRange.start }
    };

    const [totalJobs, jobsByStatus, jobsByProfession] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.job.groupBy({
        by: ['professionId'],
        where,
        _count: true,
        include: {
          profession: true
        }
      })
    ]);

    return {
      total: totalJobs,
      byStatus: jobsByStatus.map(s => ({ status: s.status, count: s._count })),
      byProfession: jobsByProfession.map(j => ({
        profession: j.profession.name,
        count: j._count
      })),
      period,
      generatedAt: new Date()
    };
  }

  async getTransactionAnalytics({ period = '7d', type, status }) {
    const dateRange = this.getDateRange(period);
    const where = {
      ...(type && { type }),
      ...(status && { status }),
      createdAt: { gte: dateRange.start }
    };

    const [totalTransactions, transactionsByType, transactionsByStatus, totalAmount] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.groupBy({
        by: ['type'],
        where,
        _count: true,
        _sum: { amount: true }
      }),
      prisma.transaction.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      prisma.transaction.aggregate({
        where,
        _sum: { amount: true }
      })
    ]);

    return {
      total: totalTransactions,
      totalAmount: totalAmount._sum.amount || 0,
      byType: transactionsByType.map(t => ({
        type: t.type,
        count: t._count,
        amount: t._sum.amount || 0
      })),
      byStatus: transactionsByStatus.map(s => ({ status: s.status, count: s._count })),
      period,
      generatedAt: new Date()
    };
  }

  async generateReport({ reportType, startDate, endDate, filters }) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let data = {};

    switch (reportType) {
      case 'users':
        data = await this.generateUserReport(start, end, filters);
        break;
      case 'jobs':
        data = await this.generateJobReport(start, end, filters);
        break;
      case 'transactions':
        data = await this.generateTransactionReport(start, end, filters);
        break;
      case 'revenue':
        data = await this.generateRevenueReport(start, end, filters);
        break;
      default:
        throw new Error('Invalid report type');
    }

    return {
      reportType,
      startDate: start,
      endDate: end,
      data,
      generatedAt: new Date()
    };
  }

  async generateUserReport(start, end, filters) {
    const where = {
      createdAt: { gte: start, lte: end },
      ...(filters?.role && { role: filters.role })
    };

    const [totalUsers, newUsers, verifiedUsers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({
        where: { ...where, createdAt: { gte: start, lte: end } }
      }),
      prisma.user.count({
        where: { ...where, isVerified: true }
      })
    ]);

    return {
      totalUsers,
      newUsers,
      verifiedUsers,
      verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0
    };
  }

  async generateJobReport(start, end, filters) {
    const where = {
      createdAt: { gte: start, lte: end },
      ...(filters?.status && { status: filters.status })
    };

    const [totalJobs, activeJobs, completedJobs] = await Promise.all([
      prisma.job.count({ where }),
      prisma.job.count({
        where: { ...where, status: 'active' }
      }),
      prisma.job.count({
        where: { ...where, status: 'completed' }
      })
    ]);

    return {
      totalJobs,
      activeJobs,
      completedJobs,
      completionRate: totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
    };
  }

  async generateTransactionReport(start, end, filters) {
    const where = {
      createdAt: { gte: start, lte: end },
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status })
    };

    const [totalTransactions, completedTransactions, totalAmount] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.count({
        where: { ...where, status: 'completed' }
      }),
      prisma.transaction.aggregate({
        where,
        _sum: { amount: true }
      })
    ]);

    return {
      totalTransactions,
      completedTransactions,
      totalAmount: totalAmount._sum.amount || 0,
      successRate: totalTransactions > 0 ? (completedTransactions / totalTransactions) * 100 : 0
    };
  }

  async generateRevenueReport(start, end, filters) {
    const where = {
      status: 'completed',
      createdAt: { gte: start, lte: end },
      ...(filters?.type && { type: filters.type })
    };

    const revenueByType = await prisma.transaction.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true }
    });

    const totalRevenue = revenueByType.reduce((sum, r) => sum + (r._sum.amount || 0), 0);

    return {
      totalRevenue,
      byType: revenueByType.map(r => ({
        type: r.type,
        amount: r._sum.amount || 0,
        percentage: totalRevenue > 0 ? ((r._sum.amount || 0) / totalRevenue) * 100 : 0
      }))
    };
  }

  getDateRange(period) {
    const end = new Date();
    let start;

    switch (period) {
      case '1d':
        start = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        start = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  async calculateGrowth(metric, period) {
    const currentRange = this.getDateRange(period);
    const previousRange = this.getDateRange(period);

    // Adjust previous range to be before current range
    const duration = currentRange.end.getTime() - currentRange.start.getTime();
    previousRange.start = new Date(currentRange.start.getTime() - duration);
    previousRange.end = currentRange.start;

    let currentCount, previousCount;

    switch (metric) {
      case 'users':
        currentCount = await prisma.user.count({
          where: { createdAt: { gte: currentRange.start, lte: currentRange.end } }
        });
        previousCount = await prisma.user.count({
          where: { createdAt: { gte: previousRange.start, lte: previousRange.end } }
        });
        break;
      case 'jobs':
        currentCount = await prisma.job.count({
          where: { createdAt: { gte: currentRange.start, lte: currentRange.end } }
        });
        previousCount = await prisma.job.count({
          where: { createdAt: { gte: previousRange.start, lte: previousRange.end } }
        });
        break;
      case 'transactions':
        currentCount = await prisma.transaction.count({
          where: { createdAt: { gte: currentRange.start, lte: currentRange.end } }
        });
        previousCount = await prisma.transaction.count({
          where: { createdAt: { gte: previousRange.start, lte: previousRange.end } }
        });
        break;
      default:
        return 0;
    }

    if (previousCount === 0) {
      return currentCount > 0 ? 100 : 0;
    }

    return ((currentCount - previousCount) / previousCount) * 100;
  }
}

module.exports = new AnalyticsService();
