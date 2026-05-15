const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class SearchService {
  async searchJobs({ query, location, profession, salaryRange, experience, page = 1, limit = 20, radius }) {
    const skip = (page - 1) * limit;
    const where = {
      status: 'active',
      ...(query && {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      }),
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

    // Filter by radius if location coordinates are provided
    let filteredJobs = jobs;
    if (radius && location) {
      filteredJobs = this.filterByRadius(jobs, location, parseFloat(radius));
    }

    return {
      jobs: filteredJobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async searchWorkers({ query, location, profession, skills, experience, page = 1, limit = 20, radius }) {
    const skip = (page - 1) * limit;
    const where = {
      role: 'worker',
      ...(query && {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } }
        ]
      }),
      ...(profession && {
        professions: {
          some: {
            profession: {
              name: { contains: profession, mode: 'insensitive' }
            }
          }
        }
      }),
      ...(location && {
        location: {
          OR: [
            { city: { contains: location, mode: 'insensitive' } },
            { state: { contains: location, mode: 'insensitive' } },
            { country: { contains: location, mode: 'insensitive' } }
          ]
        }
      })
    };

    const [workers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          professions: {
            include: {
              profession: true
            }
          },
          location: true
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    // Filter by radius if location coordinates are provided
    let filteredWorkers = workers;
    if (radius && location) {
      filteredWorkers = this.filterByRadius(workers, location, parseFloat(radius));
    }

    return {
      workers: filteredWorkers.map(w => ({
        id: w.id,
        firstName: w.firstName,
        lastName: w.lastName,
        avatarUrl: w.avatarUrl,
        bio: w.bio,
        professions: w.professions.map(p => ({
          name: p.profession.name,
          category: p.profession.category
        })),
        location: w.location,
        trustScore: w.trustScore
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async searchBusinesses({ query, location, industry, page = 1, limit = 20, radius }) {
    const skip = (page - 1) * limit;
    const where = {
      ...(query && {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      }),
      ...(industry && { industry: { contains: industry, mode: 'insensitive' } }),
      ...(location && {
        OR: [
          { city: { contains: location, mode: 'insensitive' } },
          { state: { contains: location, mode: 'insensitive' } },
          { country: { contains: location, mode: 'insensitive' } }
        ]
      })
    };

    const [businesses, total] = await Promise.all([
      prisma.business.findMany({
        where,
        include: {
          _count: {
            select: {
              employees: true,
              jobs: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.business.count({ where })
    ]);

    // Filter by radius if location coordinates are provided
    let filteredBusinesses = businesses;
    if (radius && location) {
      filteredBusinesses = this.filterByRadius(businesses, location, parseFloat(radius));
    }

    return {
      businesses: filteredBusinesses.map(b => ({
        id: b.id,
        name: b.name,
        email: b.email,
        logoUrl: b.logoUrl,
        industry: b.industry,
        size: b.size,
        description: b.description,
        isVerified: b.isVerified,
        employeeCount: b._count.employees,
        jobCount: b._count.jobs
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async saveSearch(userId, { searchType, searchParams, name }) {
    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId,
        searchType,
        searchParams,
        name: name || `${searchType} search`
      }
    });

    return {
      id: savedSearch.id,
      name: savedSearch.name,
      searchType: savedSearch.searchType,
      searchParams: savedSearch.searchParams,
      createdAt: savedSearch.createdAt
    };
  }

  async getSavedSearches(userId) {
    const searches = await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return searches.map(s => ({
      id: s.id,
      name: s.name,
      searchType: s.searchType,
      searchParams: s.searchParams,
      createdAt: s.createdAt
    }));
  }

  async deleteSavedSearch(searchId, userId) {
    const savedSearch = await prisma.savedSearch.findFirst({
      where: {
        id: searchId,
        userId
      }
    });

    if (!savedSearch) {
      throw new Error('Saved search not found');
    }

    await prisma.savedSearch.delete({
      where: { id: searchId }
    });
  }

  filterByRadius(items, location, radiusKm) {
    // This is a simplified implementation
    // In production, use proper geospatial queries with PostGIS
    return items.filter(item => {
      if (!item.latitude || !item.longitude) return true; // Include items without coordinates
      const distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        item.latitude,
        item.longitude
      );
      return distance <= radiusKm;
    });
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

module.exports = new SearchService();
