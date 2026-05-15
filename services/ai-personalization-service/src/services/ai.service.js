const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');
const logger = require('../utils/logger');

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class AIService {
  async getRecommendations(userId, { type = 'jobs', limit = 10 }) {
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

    let recommendations = [];

    switch (type) {
      case 'jobs':
        recommendations = await this.getJobRecommendations(user, limit);
        break;
      case 'workers':
        recommendations = await this.getWorkerRecommendations(user, limit);
        break;
      case 'businesses':
        recommendations = await this.getBusinessRecommendations(user, limit);
        break;
      default:
        throw new Error('Invalid recommendation type');
    }

    return {
      type,
      recommendations,
      generatedAt: new Date()
    };
  }

  async detectUserRole(userProfile) {
    const { professions, interests, skills, experience } = userProfile;

    // Use AI to detect role if OpenAI is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a job classification expert. Classify users into one of these roles: worker, boss, tradex, or hybrid. Return only the role name.'
            },
            {
              role: 'user',
              content: `Professions: ${professions?.join(', ') || 'None'}. Interests: ${interests?.join(', ') || 'None'}. Skills: ${skills?.join(', ') || 'None'}. Experience: ${experience || 'None'}.`
            }
          ],
          max_tokens: 10,
          temperature: 0.3
        });

        const detectedRole = response.choices[0].message.content.trim().toLowerCase();
        return { role: detectedRole, confidence: 0.85 };
      } catch (error) {
        logger.error('OpenAI role detection error:', error.message);
      }
    }

    // Fallback to rule-based detection
    return this.detectRoleByRules(userProfile);
  }

  async getTrustScore(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        professions: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    let score = 50; // Base score

    // Factor: Verification status
    if (user.isVerified) {
      score += 20;
    }

    // Factor: Account age
    const accountAge = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.min(accountAge * 0.5, 15);

    // Factor: Number of professions
    if (user.professions.length > 0) {
      score += Math.min(user.professions.length * 5, 15);
    }

    // Factor: Completed profiles (simplified)
    if (user.firstName && user.lastName && user.email) {
      score += 10;
    }

    return {
      userId,
      trustScore: Math.min(score, 100),
      level: this.getTrustLevel(score),
      factors: [
        { name: 'Verification Status', value: user.isVerified ? 'Verified' : 'Unverified' },
        { name: 'Account Age', value: `${Math.round(accountAge)} days` },
        { name: 'Professions Count', value: user.professions.length }
      ]
    };
  }

  async getFraudScore(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    let score = 0;

    // Factor: Account age (newer accounts have higher fraud risk)
    const accountAge = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 20 - accountAge * 0.5);

    // Factor: Verification status
    if (!user.isVerified) {
      score += 15;
    }

    // Factor: Suspicious activities (would need to query from fraud service)
    // This is a simplified version

    return {
      userId,
      fraudScore: Math.min(score, 100),
      riskLevel: this.getRiskLevel(score)
    };
  }

  async sendSmartNotification(userId, notificationData) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Use AI to personalize notification content
    let personalizedContent = notificationData;

    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a notification personalization expert. Personalize notification content based on user role and preferences.'
            },
            {
              role: 'user',
              content: `User role: ${user.role}. Original notification: ${JSON.stringify(notificationData)}. Return personalized JSON.`
            }
          ],
          max_tokens: 200,
          temperature: 0.7
        });

        personalizedContent = JSON.parse(response.choices[0].message.content);
      } catch (error) {
        logger.error('OpenAI notification personalization error:', error.message);
      }
    }

    return {
      personalized: true,
      content: personalizedContent,
      sentAt: new Date()
    };
  }

  async analyzeProfile(userId) {
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

    const analysis = {
      profileCompleteness: this.calculateProfileCompleteness(user),
      role: user.role,
      professions: user.professions.map(p => p.profession.name),
      location: user.location ? `${user.location.city}, ${user.location.country}` : 'Not set',
      recommendations: [],
      strengths: [],
      improvements: []
    };

    // Add AI-based insights if available
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a career advisor. Analyze user profile and provide recommendations, strengths, and areas for improvement. Return JSON with recommendations, strengths, and improvements arrays.'
            },
            {
              role: 'user',
              content: `User profile: ${JSON.stringify(analysis)}`
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        });

        const aiInsights = JSON.parse(response.choices[0].message.content);
        analysis.recommendations = aiInsights.recommendations || [];
        analysis.strengths = aiInsights.strengths || [];
        analysis.improvements = aiInsights.improvements || [];
      } catch (error) {
        logger.error('OpenAI profile analysis error:', error.message);
      }
    }

    return analysis;
  }

  async getJobRecommendations(user, limit) {
    // Get user's professions
    const professionIds = user.professions.map(p => p.professionId);

    // Find jobs matching user's professions
    const jobs = await prisma.job.findMany({
      where: {
        professionId: { in: professionIds },
        status: 'active'
      },
      include: {
        business: true,
        profession: true
      },
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    return jobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      salary: job.salary,
      business: {
        name: job.business.name,
        logoUrl: job.business.logoUrl
      },
      profession: job.profession.name,
      matchScore: this.calculateJobMatchScore(user, job),
      createdAt: job.createdAt
    }));
  }

  async getWorkerRecommendations(user, limit) {
    // This would find workers based on business needs
    // Simplified implementation
    return [];
  }

  async getBusinessRecommendations(user, limit) {
    // This would find businesses based on user interests
    // Simplified implementation
    return [];
  }

  detectRoleByRules(userProfile) {
    const { professions = [] } = userProfile;

    const businessKeywords = ['ceo', 'manager', 'director', 'owner', 'entrepreneur', 'founder'];
    const tradeKeywords = ['trader', 'merchant', 'seller', 'vendor', 'sales'];
    const workerKeywords = ['developer', 'designer', 'engineer', 'worker', 'employee', 'contractor'];

    const allKeywords = professions.map(p => p.toLowerCase()).join(' ');

    if (businessKeywords.some(kw => allKeywords.includes(kw))) {
      return { role: 'boss', confidence: 0.7 };
    }

    if (tradeKeywords.some(kw => allKeywords.includes(kw))) {
      return { role: 'tradex', confidence: 0.7 };
    }

    if (workerKeywords.some(kw => allKeywords.includes(kw))) {
      return { role: 'worker', confidence: 0.7 };
    }

    if (professions.length > 2) {
      return { role: 'hybrid', confidence: 0.6 };
    }

    return { role: 'worker', confidence: 0.5 };
  }

  calculateJobMatchScore(user, job) {
    let score = 50;

    // Base score for matching profession
    if (user.professions.some(p => p.professionId === job.professionId)) {
      score += 30;
    }

    // Location proximity (if user has location)
    if (user.location && job.city) {
      if (user.location.city === job.city) {
        score += 15;
      } else if (user.location.state === job.state) {
        score += 10;
      } else if (user.location.country === job.country) {
        score += 5;
      }
    }

    return Math.min(score, 100);
  }

  calculateProfileCompleteness(user) {
    let completeness = 0;
    const fields = ['firstName', 'lastName', 'email', 'phone', 'bio', 'avatarUrl'];
    const filledFields = fields.filter(field => user[field]).length;
    
    completeness += (filledFields / fields.length) * 70;

    if (user.professions.length > 0) {
      completeness += 20;
    }

    if (user.location) {
      completeness += 10;
    }

    return Math.round(completeness);
  }

  getTrustLevel(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  getRiskLevel(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }
}

module.exports = new AIService();
