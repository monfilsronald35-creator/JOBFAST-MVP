const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class JobService {
  async getAllJobs({ page = 1, limit = 20, profession, location, salaryRange, status = 'active' }) {
    const skip = (page - 1) * limit;
    const where = {
      status,
      ...(profession && { profession: { name: { contains: profession, mode: 'insensitive' } } }),
      ...(location && {
        OR: [
          { city: { contains: location, mode: 'insensitive' } },
          { state: { contains: location, mode: 'insensitive' } },
          { country: { contains: location, mode: 'insensitive' } }
        ]
      })
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          business: true,
          profession: true
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.job.count({ where })
    ]);

    return {
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getJobById(jobId) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        business: true,
        profession: true,
        applications: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true
              }
            }
          }
        }
      }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return job;
  }

  async createJob(userId, jobData) {
    const { title, description, salary, businessId, professionId, latitude, longitude, city, state, country, address, requirements, benefits } = jobData;

    // Verify business ownership
    const business = await prisma.business.findFirst({
      where: {
        id: businessId,
        ownerId: userId
      }
    });

    if (!business) {
      throw new Error('Business not found or you are not the owner');
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        salary,
        businessId,
        professionId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        city,
        state,
        country,
        address,
        requirements,
        benefits,
        status: 'active'
      },
      include: {
        business: true,
        profession: true
      }
    });

    return job;
  }

  async updateJob(jobId, userId, updates) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { business: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.business.ownerId !== userId) {
      throw new Error('You are not authorized to update this job');
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updates,
      include: {
        business: true,
        profession: true
      }
    });

    return updatedJob;
  }

  async deleteJob(jobId, userId) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { business: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.business.ownerId !== userId) {
      throw new Error('You are not authorized to delete this job');
    }

    await prisma.job.delete({
      where: { id: jobId }
    });
  }

  async applyForJob(userId, jobId, { coverLetter, expectedSalary, availability }) {
    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Check if already applied
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        jobId,
        userId
      }
    });

    if (existingApplication) {
      throw new Error('You have already applied for this job');
    }

    const application = await prisma.jobApplication.create({
      data: {
        jobId,
        userId,
        coverLetter,
        expectedSalary,
        availability,
        status: 'pending'
      },
      include: {
        job: {
          include: {
            business: true
          }
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return application;
  }

  async getMyApplications(userId, { page = 1, limit = 20, status }) {
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(status && { status })
    };

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        include: {
          job: {
            include: {
              business: true,
              profession: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.jobApplication.count({ where })
    ]);

    return {
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getMyPostings(userId, { page = 1, limit = 20, status }) {
    const skip = (page - 1) * limit;
    const where = {
      business: {
        ownerId: userId
      },
      ...(status && { status })
    };

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          business: true,
          profession: true,
          _count: {
            select: { applications: true }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.job.count({ where })
    ]);

    return {
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async saveJob(userId, jobId) {
    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Check if already saved
    const existing = await prisma.savedJob.findFirst({
      where: {
        userId,
        jobId
      }
    });

    if (existing) {
      throw new Error('Job already saved');
    }

    await prisma.savedJob.create({
      data: {
        userId,
        jobId
      }
    });
  }

  async unsaveJob(userId, jobId) {
    const savedJob = await prisma.savedJob.findFirst({
      where: {
        userId,
        jobId
      }
    });

    if (!savedJob) {
      throw new Error('Saved job not found');
    }

    await prisma.savedJob.delete({
      where: { id: savedJob.id }
    });
  }

  async getJobApplications(jobId, userId, { page = 1, limit = 20, status }) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { business: true }
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.business.ownerId !== userId) {
      throw new Error('You are not authorized to view applications for this job');
    }

    const skip = (page - 1) * limit;
    const where = {
      jobId,
      ...(status && { status })
    };

    const [applications, total] = await Promise.all([
      prisma.jobApplication.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              professions: {
                include: {
                  profession: true
                }
              }
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.jobApplication.count({ where })
    ]);

    return {
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new JobService();
