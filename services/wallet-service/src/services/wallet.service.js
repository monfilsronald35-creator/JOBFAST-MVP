const { PrismaClient } = require('@prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class WalletService {
  async getWallet(userId) {
    let wallet = await prisma.wallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          userId,
          balance: 0,
          currency: 'USD'
        }
      });
    }

    return {
      id: wallet.id,
      balance: wallet.balance,
      currency: wallet.currency,
      isFrozen: wallet.isFrozen,
      createdAt: wallet.createdAt
    };
  }

  async getBalance(userId) {
    const wallet = await this.getWallet(userId);
    return {
      balance: wallet.balance,
      currency: wallet.currency,
      availableBalance: wallet.isFrozen ? 0 : wallet.balance
    };
  }

  async deposit(userId, { amount, paymentMethod, paymentDetails }) {
    const wallet = await this.getWallet(userId);

    if (wallet.isFrozen) {
      throw new Error('Wallet is frozen');
    }

    // Process payment with Stripe
    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentDetails.paymentMethodId,
        confirm: true,
        metadata: { userId }
      });
    } catch (error) {
      logger.error('Stripe payment error:', error.message);
      throw new Error('Payment processing failed');
    }

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment failed');
    }

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance + amount
      }
    });

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        amount,
        status: 'completed',
        paymentMethod,
        paymentDetails,
        stripePaymentId: paymentIntent.id
      }
    });

    return {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      newBalance: updatedWallet.balance,
      createdAt: transaction.createdAt
    };
  }

  async withdraw(userId, { amount, withdrawalMethod, withdrawalDetails }) {
    const wallet = await this.getWallet(userId);

    if (wallet.isFrozen) {
      throw new Error('Wallet is frozen');
    }

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Deduct from wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance - amount
      }
    });

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        amount,
        status: 'pending',
        withdrawalMethod,
        withdrawalDetails
      }
    });

    // Process withdrawal based on method
    // For Haiti-specific methods (MonCash, NatCash), integrate with their APIs
    if (withdrawalMethod === 'moncash' || withdrawalMethod === 'natcash') {
      await this.processCountryWithdrawal(transaction, withdrawalMethod, withdrawalDetails);
    }

    return {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      newBalance: updatedWallet.balance,
      createdAt: transaction.createdAt
    };
  }

  async transfer(userId, { recipientId, amount, description }) {
    const senderWallet = await this.getWallet(userId);

    if (senderWallet.isFrozen) {
      throw new Error('Wallet is frozen');
    }

    if (senderWallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Get recipient wallet
    let recipientWallet = await prisma.wallet.findUnique({
      where: { userId: recipientId }
    });

    if (!recipientWallet) {
      throw new Error('Recipient wallet not found');
    }

    if (recipientWallet.isFrozen) {
      throw new Error('Recipient wallet is frozen');
    }

    // Perform transfer in a transaction
    await prisma.$transaction([
      // Deduct from sender
      prisma.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: senderWallet.balance - amount }
      }),
      // Add to recipient
      prisma.wallet.update({
        where: { id: recipientWallet.id },
        data: { balance: recipientWallet.balance + amount }
      }),
      // Create sender transaction
      prisma.transaction.create({
        data: {
          walletId: senderWallet.id,
          type: 'TRANSFER_OUT',
          amount,
          status: 'completed',
          recipientId,
          description
        }
      }),
      // Create recipient transaction
      prisma.transaction.create({
        data: {
          walletId: recipientWallet.id,
          type: 'TRANSFER_IN',
          amount,
          status: 'completed',
          senderId: userId,
          description
        }
      })
    ]);

    const updatedSenderWallet = await this.getWallet(userId);

    return {
      amount,
      recipientId,
      newBalance: updatedSenderWallet.balance,
      status: 'completed'
    };
  }

  async recharge(userId, { amount, rechargeMethod, rechargeDetails }) {
    // Recharge is similar to deposit but for mobile/country-specific methods
    const wallet = await this.getWallet(userId);

    if (wallet.isFrozen) {
      throw new Error('Wallet is frozen');
    }

    // Process recharge based on method
    let rechargeResult;
    if (rechargeMethod === 'moncash') {
      rechargeResult = await this.processMonCashRecharge(amount, rechargeDetails);
    } else if (rechargeMethod === 'natcash') {
      rechargeResult = await this.processNatCashRecharge(amount, rechargeDetails);
    } else {
      throw new Error('Unsupported recharge method');
    }

    if (!rechargeResult.success) {
      throw new Error('Recharge failed');
    }

    // Update wallet balance
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance + amount
      }
    });

    // Create transaction record
    const transaction = await prisma.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'RECHARGE',
        amount,
        status: 'completed',
        rechargeMethod,
        rechargeDetails,
        externalTransactionId: rechargeResult.transactionId
      }
    });

    return {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      status: transaction.status,
      newBalance: updatedWallet.balance,
      createdAt: transaction.createdAt
    };
  }

  async requestPayout(userId, { amount, payoutMethod, payoutDetails }) {
    const wallet = await this.getWallet(userId);

    if (wallet.isFrozen) {
      throw new Error('Wallet is frozen');
    }

    if (wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    // Create payout request
    const payout = await prisma.payout.create({
      data: {
        userId,
        amount,
        payoutMethod,
        payoutDetails,
        status: 'pending'
      }
    });

    // Deduct amount from wallet (hold it)
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: wallet.balance - amount
      }
    });

    return {
      id: payout.id,
      amount: payout.amount,
      status: payout.status,
      createdAt: payout.createdAt
    };
  }

  async getTransactions(userId, { page = 1, limit = 20, type, status }) {
    const wallet = await this.getWallet(userId);
    const skip = (page - 1) * limit;
    const where = {
      walletId: wallet.id,
      ...(type && { type }),
      ...(status && { status })
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.transaction.count({ where })
    ]);

    return {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async processCountryWithdrawal(transaction, method, details) {
    // Integrate with MonCash/NatCash APIs for Haiti-specific withdrawals
    // This is a placeholder - implement actual API integration
    logger.info(`Processing ${method} withdrawal for transaction ${transaction.id}`);
    
    // Update transaction status
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'processing' }
    });

    // Simulate processing
    // In production, call actual MonCash/NatCash APIs
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: 'completed' }
    });
  }

  async processMonCashRecharge(amount, details) {
    // Integrate with MonCash API
    // This is a placeholder - implement actual API integration
    logger.info(`Processing MonCash recharge for amount ${amount}`);
    return { success: true, transactionId: 'moncash_' + Date.now() };
  }

  async processNatCashRecharge(amount, details) {
    // Integrate with NatCash API
    // This is a placeholder - implement actual API integration
    logger.info(`Processing NatCash recharge for amount ${amount}`);
    return { success: true, transactionId: 'natcash_' + Date.now() };
  }
}

module.exports = new WalletService();
