import { MarketRepository }       from '../repositories/MarketRepository.js';
import { AppError }               from '../../../core/errors/AppError.js';
import { AuctionStatus, type Auction, type AuctionBid } from '../types/commerce.types.js';

export const AuctionService = {
  async create(sellerId: string, data: Omit<Auction, 'id' | 'sellerId' | 'currentBid' | 'bidCount' | 'createdAt'>): Promise<Auction> {
    const now = new Date();
    const status: AuctionStatus = new Date(data.startAt) > now
      ? AuctionStatus.Upcoming : AuctionStatus.Active;
    return MarketRepository.createAuction({ ...data, sellerId, status });
  },

  async getById(id: string): Promise<Auction> {
    const a = await MarketRepository.findAuction(id);
    if (!a) throw new AppError('Auction not found', 404, 'NOT_FOUND');
    return a;
  },

  async placeBid(auctionId: string, bidderId: string, amount: number, currency: string): Promise<{ success: boolean; message: string }> {
    return MarketRepository.placeBid(auctionId, bidderId, amount, currency);
  },

  async listBids(auctionId: string): Promise<AuctionBid[]> {
    return MarketRepository.listBids(auctionId);
  },

  async listActive(): Promise<Auction[]> {
    return MarketRepository.listActiveAuctions();
  },
};
