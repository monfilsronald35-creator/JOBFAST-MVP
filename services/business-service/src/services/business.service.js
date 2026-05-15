const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class BusinessService {
  async createBusiness(userId, businessData) {
    const { name, email, phone, logoUrl, website, industry, size, description, location } = businessData;

    const business = await prisma.business.create({
      data: {
        ownerId: userId,
        name,
        email,
        phone,
        logoUrl,
        website,
        industry,
        size,
        description,
        location
      }
    });

    return {
      id: business.id,
      name: business.name,
      email: business.email,
      phone: business.phone,
      logoUrl: business.logoUrl,
      website: business.website,
      industry: business.industry,
      size: business.size,
      description: business.description,
      location: business.location,
      isVerified: business.isVerified,
      createdAt: business.createdAt
    };
  }

  async getMyBusinesses(userId) {
    const businesses = await prisma.business.findMany({
      where: { ownerId: userId },
      include: {
        _count: {
          select: {
            employees: true,
            jobs: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return businesses.map(b => ({
      id: b.id,
      name: b.name,
      email: b.email,
      logoUrl: b.logoUrl,
      industry: b.industry,
      isVerified: b.isVerified,
      employeeCount: b._count.employees,
      jobCount: b._count.jobs,
      createdAt: b.createdAt
    }));
  }

  async getBusinessById(businessId, userId) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        employees: {
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
        },
        jobs: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!business) {
      throw new Error('Business not found');
    }

    // Check if user is owner or employee
    const isOwner = business.ownerId === userId;
    const isEmployee = business.employees.some(e => e.userId === userId);

    if (!isOwner && !isEmployee) {
      throw new Error('You are not authorized to view this business');
    }

    return {
      id: business.id,
      name: business.name,
      email: business.email,
      phone: business.phone,
      logoUrl: business.logoUrl,
      website: business.website,
      industry: business.industry,
      size: business.size,
      description: business.description,
      location: business.location,
      isVerified: business.isVerified,
      ownerId: business.ownerId,
      employees: business.employees.map(e => ({
        id: e.id,
        user: e.user,
        role: e.role,
        permissions: e.permissions,
        joinedAt: e.createdAt
      })),
      recentJobs: business.jobs,
      createdAt: business.createdAt
    };
  }

  async updateBusiness(businessId, userId, updates) {
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      throw new Error('Business not found');
    }

    if (business.ownerId !== userId) {
      throw new Error('You are not authorized to update this business');
    }

    const updatedBusiness = await prisma.business.update({
      where: { id: businessId },
      data: updates
    });

    return {
      id: updatedBusiness.id,
      name: updatedBusiness.name,
      email: updatedBusiness.email,
      phone: updatedBusiness.phone,
      logoUrl: updatedBusiness.logoUrl,
      website: updatedBusiness.website,
      industry: updatedBusiness.industry,
      size: updatedBusiness.size,
      description: updatedBusiness.description,
      location: updatedBusiness.location,
      isVerified: updatedBusiness.isVerified,
      updatedAt: updatedBusiness.updatedAt
    };
  }

  async deleteBusiness(businessId, userId) {
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      throw new Error('Business not found');
    }

    if (business.ownerId !== userId) {
      throw new Error('You are not authorized to delete this business');
    }

    await prisma.business.delete({
      where: { id: businessId }
    });
  }

  async addEmployee(businessId, userId, { employeeId, role = 'employee', permissions = [] }) {
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      throw new Error('Business not found');
    }

    if (business.ownerId !== userId) {
      throw new Error('You are not authorized to add employees to this business');
    }

    // Check if employee already exists
    const existingEmployee = await prisma.businessEmployee.findFirst({
      where: {
        businessId,
        userId: employeeId
      }
    });

    if (existingEmployee) {
      throw new Error('User is already an employee of this business');
    }

    const employee = await prisma.businessEmployee.create({
      data: {
        businessId,
        userId: employeeId,
        role,
        permissions
      },
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
    });

    return {
      id: employee.id,
      user: employee.user,
      role: employee.role,
      permissions: employee.permissions,
      joinedAt: employee.createdAt
    };
  }

  async removeEmployee(businessId, userId, employeeId) {
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      throw new Error('Business not found');
    }

    if (business.ownerId !== userId) {
      throw new Error('You are not authorized to remove employees from this business');
    }

    const employee = await prisma.businessEmployee.findFirst({
      where: {
        businessId,
        userId: employeeId
      }
    });

    if (!employee) {
      throw new Error('Employee not found');
    }

    await prisma.businessEmployee.delete({
      where: { id: employee.id }
    });
  }

  async getEmployees(businessId, userId) {
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });

    if (!business) {
      throw new Error('Business not found');
    }

    const isOwner = business.ownerId === userId;
    const isEmployee = await prisma.businessEmployee.findFirst({
      where: {
        businessId,
        userId
      }
    });

    if (!isOwner && !isEmployee) {
      throw new Error('You are not authorized to view employees of this business');
    }

    const employees = await prisma.businessEmployee.findMany({
      where: { businessId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return employees.map(e => ({
      id: e.id,
      user: e.user,
      role: e.role,
      permissions: e.permissions,
      joinedAt: e.createdAt
    }));
  }
}

module.exports = new BusinessService();
