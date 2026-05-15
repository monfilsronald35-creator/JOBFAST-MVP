const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class CardService {
  async createCard(userId, { cardType = 'virtual', currency = 'USD', initialLimit }) {
    // Check if user has a wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      throw new Error('User wallet not found');
    }

    // Create Stripe cardholder
    let cardholder;
    try {
      cardholder = await stripe.issuing.cardholders.create({
        type: 'individual',
        name: await this.getUserName(userId),
        email: await this.getUserEmail(userId),
        billing: {
          address: {
            line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            postal_code: '94105',
            country: 'US'
          }
        }
      });
    } catch (error) {
      logger.error('Stripe cardholder creation error:', error.message);
      throw new Error('Failed to create cardholder');
    }

    // Create Stripe card
    let stripeCard;
    try {
      stripeCard = await stripe.issuing.cards.create({
        cardholder: cardholder.id,
        currency: currency.toLowerCase(),
        type: cardType,
        status: 'active',
        spending_controls: {
          spending_limits: [
            {
              amount: initialLimit || 10000,
              interval: 'monthly'
            }
          ]
        }
      });
    } catch (error) {
      logger.error('Stripe card creation error:', error.message);
      throw new Error('Failed to create card');
    }

    // Generate masked card number
    const last4 = stripeCard.last4;
    const maskedNumber = `**** **** **** ${last4}`;

    // Store card in database
    const card = await prisma.virtualCard.create({
      data: {
        userId,
        walletId: wallet.id,
        cardType,
        currency,
        last4,
        maskedNumber,
        stripeCardId: stripeCard.id,
        stripeCardholderId: cardholder.id,
        status: 'active',
        dailyLimit: initialLimit ? initialLimit / 30 : 333.33,
        monthlyLimit: initialLimit || 10000,
        transactionLimit: initialLimit ? initialLimit / 100 : 100,
        expiryMonth: stripeCard.exp_month,
        expiryYear: stripeCard.exp_year
      }
    });

    return {
      id: card.id,
      cardType: card.cardType,
      currency: card.currency,
      maskedNumber: card.maskedNumber,
      status: card.status,
      dailyLimit: card.dailyLimit,
      monthlyLimit: card.monthlyLimit,
      transactionLimit: card.transactionLimit,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      createdAt: card.createdAt
    };
  }

  async getCards(userId) {
    const cards = await prisma.virtualCard.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return cards.map(card => ({
      id: card.id,
      cardType: card.cardType,
      currency: card.currency,
      maskedNumber: card.maskedNumber,
      status: card.status,
      isFrozen: card.isFrozen,
      dailyLimit: card.dailyLimit,
      monthlyLimit: card.monthlyLimit,
      transactionLimit: card.transactionLimit,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      createdAt: card.createdAt
    }));
  }

  async getCardById(cardId, userId) {
    const card = await prisma.virtualCard.findFirst({
      where: {
        id: cardId,
        userId
      }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    return {
      id: card.id,
      cardType: card.cardType,
      currency: card.currency,
      maskedNumber: card.maskedNumber,
      status: card.status,
      isFrozen: card.isFrozen,
      dailyLimit: card.dailyLimit,
      monthlyLimit: card.monthlyLimit,
      transactionLimit: card.transactionLimit,
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      createdAt: card.createdAt
    };
  }

  async updateCard(cardId, userId, updates) {
    const card = await prisma.virtualCard.findFirst({
      where: {
        id: cardId,
        userId
      }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    const updatedCard = await prisma.virtualCard.update({
      where: { id: cardId },
      data: updates
    });

    return {
      id: updatedCard.id,
      cardType: updatedCard.cardType,
      currency: updatedCard.currency,
      maskedNumber: updatedCard.maskedNumber,
      status: updatedCard.status,
      isFrozen: updatedCard.isFrozen,
      dailyLimit: updatedCard.dailyLimit,
      monthlyLimit: updatedCard.monthlyLimit,
      transactionLimit: updatedCard.transactionLimit,
      expiryMonth: updatedCard.expiryMonth,
      expiryYear: updatedCard.expiryYear,
      createdAt: updatedCard.createdAt
    };
  }

  async deleteCard(cardId, userId) {
    const card = await prisma.virtualCard.findFirst({
      where: {
        id: cardId,
        userId
      }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    // Cancel Stripe card
    try {
      await stripe.issuing.cards.update(card.stripeCardId, {
        status: 'canceled'
      });
    } catch (error) {
      logger.error('Stripe card cancellation error:', error.message);
    }

    // Delete from database
    await prisma.virtualCard.delete({
      where: { id: cardId }
    });
  }

  async freezeCard(cardId, userId) {
    const card = await prisma.virtualCard.findFirst({
      where: {
        id: cardId,
        userId
      }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    // Freeze Stripe card
    try {
      await stripe.issuing.cards.update(card.stripeCardId, {
        status: 'inactive'
      });
    } catch (error) {
      logger.error('Stripe card freeze error:', error.message);
      throw new Error('Failed to freeze card');
    }

    const updatedCard = await prisma.virtualCard.update({
      where: { id: cardId },
      data: {
        isFrozen: true,
        status: 'inactive'
      }
    });

    return {
      id: updatedCard.id,
      status: updatedCard.status,
      isFrozen: updatedCard.isFrozen
    };
  }

  async unfreezeCard(cardId, userId) {
    const card = await prisma.virtualCard.findFirst({
      where: {
        id: cardId,
        userId
      }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    // Unfreeze Stripe card
    try {
      await stripe.issuing.cards.update(card.stripeCardId, {
        status: 'active'
      });
    } catch (error) {
      logger.error('Stripe card unfreeze error:', error.message);
      throw new Error('Failed to unfreeze card');
    }

    const updatedCard = await prisma.virtualCard.update({
      where: { id: cardId },
      data: {
        isFrozen: false,
        status: 'active'
      }
    });

    return {
      id: updatedCard.id,
      status: updatedCard.status,
      isFrozen: updatedCard.isFrozen
    };
  }

  async updateCardLimits(cardId, userId, { dailyLimit, monthlyLimit, transactionLimit }) {
    const card = await prisma.virtualCard.findFirst({
      where: {
        id: cardId,
        userId
      }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    // Update Stripe card limits
    try {
      await stripe.issuing.cards.update(card.stripeCardId, {
        spending_controls: {
          spending_limits: [
            {
              amount: monthlyLimit || card.monthlyLimit,
              interval: 'monthly'
            }
          ]
        }
      });
    } catch (error) {
      logger.error('Stripe card limit update error:', error.message);
      throw new Error('Failed to update card limits');
    }

    const updatedCard = await prisma.virtualCard.update({
      where: { id: cardId },
      data: {
        ...(dailyLimit && { dailyLimit }),
        ...(monthlyLimit && { monthlyLimit }),
        ...(transactionLimit && { transactionLimit })
      }
    });

    return {
      id: updatedCard.id,
      dailyLimit: updatedCard.dailyLimit,
      monthlyLimit: updatedCard.monthlyLimit,
      transactionLimit: updatedCard.transactionLimit
    };
  }

  async getCardTransactions(cardId, userId, { page = 1, limit = 20 }) {
    const card = await prisma.virtualCard.findFirst({
      where: {
        id: cardId,
        userId
      }
    });

    if (!card) {
      throw new Error('Card not found');
    }

    const skip = (page - 1) * limit;

    // Get transactions from Stripe
    let stripeTransactions;
    try {
      stripeTransactions = await stripe.issuing.transactions.list({
        card: card.stripeCardId,
        limit: parseInt(limit)
      });
    } catch (error) {
      logger.error('Stripe transactions fetch error:', error.message);
      stripeTransactions = { data: [] };
    }

    // Also get local transactions
    const [localTransactions, total] = await Promise.all([
      prisma.cardTransaction.findMany({
        where: { cardId },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.cardTransaction.count({ where: { cardId } })
    ]);

    return {
      transactions: [
        ...localTransactions,
        ...stripeTransactions.data.map(t => ({
          id: t.id,
          amount: t.amount / 100,
          currency: t.currency.toUpperCase(),
          status: t.status,
          merchant: t.merchant_data?.name,
          createdAt: new Date(t.created * 1000)
        }))
      ],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getUserName(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true }
    });
    return user ? `${user.firstName} ${user.lastName}` : 'User';
  }

  async getUserEmail(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });
    return user ? user.email : 'user@example.com';
  }
}

module.exports = new CardService();
