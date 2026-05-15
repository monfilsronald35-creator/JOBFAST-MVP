const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class UserService {
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        professions: {
          include: {
            profession: true
          }
        },
        location: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      trustScore: user.trustScore,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      professions: user.professions.map(p => ({
        id: p.profession.id,
        name: p.profession.name,
        category: p.profession.category,
        experience: p.experience,
        skills: p.skills
      })),
      location: user.location
    };
  }

  async updateProfile(userId, updates) {
    const { firstName, lastName, phone, bio, avatarUrl } = updates;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(bio !== undefined && { bio }),
        ...(avatarUrl !== undefined && { avatarUrl })
      },
      include: {
        professions: {
          include: {
            profession: true
          }
        }
      }
    });

    return this.formatUserProfile(user);
  }

  async getProfessions(userId) {
    const userProfessions = await prisma.userProfession.findMany({
      where: { userId },
      include: {
        profession: true
      }
    });

    return userProfessions.map(up => ({
      id: up.profession.id,
      name: up.profession.name,
      category: up.profession.category,
      experience: up.experience,
      skills: up.skills
    }));
  }

  async addProfession(userId, { professionId, experience, skills }) {
    // Check if profession exists
    const profession = await prisma.profession.findUnique({
      where: { id: professionId }
    });

    if (!profession) {
      throw new Error('Profession not found');
    }

    // Check if user already has this profession
    const existing = await prisma.userProfession.findFirst({
      where: {
        userId,
        professionId
      }
    });

    if (existing) {
      throw new Error('User already has this profession');
    }

    const userProfession = await prisma.userProfession.create({
      data: {
        userId,
        professionId,
        experience: experience || 0,
        skills: skills || []
      },
      include: {
        profession: true
      }
    });

    return {
      id: userProfession.profession.id,
      name: userProfession.profession.name,
      category: userProfession.profession.category,
      experience: userProfession.experience,
      skills: userProfession.skills
    };
  }

  async removeProfession(userId, professionId) {
    const userProfession = await prisma.userProfession.findFirst({
      where: {
        userId,
        professionId
      }
    });

    if (!userProfession) {
      throw new Error('Profession not found for user');
    }

    await prisma.userProfession.delete({
      where: { id: userProfession.id }
    });
  }

  async getLocation(userId) {
    const location = await prisma.userLocation.findUnique({
      where: { userId }
    });

    if (!location) {
      return null;
    }

    return {
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      state: location.state,
      country: location.country,
      address: location.address,
      updatedAt: location.updatedAt
    };
  }

  async updateLocation(userId, { latitude, longitude, city, state, country, address }) {
    const existingLocation = await prisma.userLocation.findUnique({
      where: { userId }
    });

    let location;

    if (existingLocation) {
      location = await prisma.userLocation.update({
        where: { userId },
        data: {
          ...(latitude && { latitude: parseFloat(latitude) }),
          ...(longitude && { longitude: parseFloat(longitude) }),
          ...(city && { city }),
          ...(state && { state }),
          ...(country && { country }),
          ...(address && { address })
        }
      });
    } else {
      location = await prisma.userLocation.create({
        data: {
          userId,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          city,
          state,
          country,
          address
        }
      });
    }

    return {
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      state: location.state,
      country: location.country,
      address: location.address,
      updatedAt: location.updatedAt
    };
  }

  async getNearbyWorkers(userId, { latitude, longitude, radius, profession }) {
    const userLocation = await this.getLocation(userId);
    
    if (!userLocation) {
      throw new Error('User location not set');
    }

    const lat = parseFloat(latitude) || userLocation.latitude;
    const lng = parseFloat(longitude) || userLocation.longitude;
    const radiusKm = parseFloat(radius) || 50;

    // Find nearby workers using geospatial query
    const nearbyWorkers = await prisma.user.findMany({
      where: {
        id: { not: userId },
        role: 'worker',
        location: {
          latitude: {
            gte: lat - (radiusKm / 111),
            lte: lat + (radiusKm / 111)
          },
          longitude: {
            gte: lng - (radiusKm / 111),
            lte: lng + (radiusKm / 111)
          }
        },
        ...(profession && {
          professions: {
            some: {
              profession: {
                name: {
                  contains: profession,
                  mode: 'insensitive'
                }
              }
            }
          }
        })
      },
      include: {
        professions: {
          include: {
            profession: true
          }
        },
        location: true
      },
      take: 50
    });

    // Calculate distance for each worker
    return nearbyWorkers.map(worker => {
      const distance = this.calculateDistance(
        lat, lng,
        worker.location.latitude,
        worker.location.longitude
      );

      return {
        id: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        avatarUrl: worker.avatarUrl,
        trustScore: worker.trustScore,
        professions: worker.professions.map(p => ({
          name: p.profession.name,
          category: p.profession.category
        })),
        location: worker.location,
        distance: Math.round(distance * 10) / 10
      };
    }).filter(w => w.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  async getNearbyJobs(userId, { latitude, longitude, radius }) {
    const userLocation = await this.getLocation(userId);
    
    if (!userLocation) {
      throw new Error('User location not set');
    }

    const lat = parseFloat(latitude) || userLocation.latitude;
    const lng = parseFloat(longitude) || userLocation.longitude;
    const radiusKm = parseFloat(radius) || 50;

    // Find nearby jobs
    const nearbyJobs = await prisma.job.findMany({
      where: {
        status: 'active',
        location: {
          latitude: {
            gte: lat - (radiusKm / 111),
            lte: lat + (radiusKm / 111)
          },
          longitude: {
            gte: lng - (radiusKm / 111),
            lte: lng + (radiusKm / 111)
          }
        }
      },
      include: {
        business: true,
        profession: true
      },
      take: 50
    });

    // Calculate distance for each job
    return nearbyJobs.map(job => {
      const distance = this.calculateDistance(
        lat, lng,
        job.location.latitude,
        job.location.longitude
      );

      return {
        id: job.id,
        title: job.title,
        description: job.description,
        salary: job.salary,
        business: {
          name: job.business.name,
          logoUrl: job.business.logoUrl
        },
        profession: {
          name: job.profession.name
        },
        location: job.location,
        distance: Math.round(distance * 10) / 10,
        createdAt: job.createdAt
      };
    }).filter(j => j.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);
  }

  async uploadAvatar(userId, avatarUrl) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl }
    });

    return this.formatUserProfile(user);
  }

  async deleteAvatar(userId) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null }
    });

    return this.formatUserProfile(user);
  }

  formatUserProfile(user) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified,
      trustScore: user.trustScore,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
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

module.exports = new UserService();
