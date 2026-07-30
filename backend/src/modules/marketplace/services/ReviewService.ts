import { ReviewRepository }        from '../repositories/ReviewRepository.js';
import { type Review, type Favorite } from '../types/commerce.types.js';

function detectSpam(body: string): boolean {
  const spamPatterns = [/whatsapp/i, /telegram/i, /bit\.ly/i, /click here/i, /free money/i];
  return spamPatterns.some(p => p.test(body));
}

export const ReviewService = {
  async create(reviewerId: string, data: Omit<Review, 'id' | 'reviewerId' | 'isSpam' | 'helpfulCount' | 'createdAt' | 'updatedAt'>): Promise<Review> {
    const isSpam = detectSpam(data.body);
    return ReviewRepository.create({ ...data, reviewerId, isSpam } as never);
  },

  async listByProduct(productId: string): Promise<Review[]> {
    return ReviewRepository.listByProduct(productId);
  },

  async markHelpful(reviewId: string): Promise<void> {
    return ReviewRepository.markHelpful(reviewId);
  },

  async reportSpam(reviewId: string): Promise<void> {
    return ReviewRepository.markSpam(reviewId);
  },

  async addFavorite(userId: string, targetType: Favorite['targetType'], targetId: string): Promise<Favorite> {
    return ReviewRepository.addFavorite(userId, targetType, targetId);
  },

  async removeFavorite(userId: string, targetType: Favorite['targetType'], targetId: string): Promise<void> {
    return ReviewRepository.removeFavorite(userId, targetType, targetId);
  },

  async listFavorites(userId: string): Promise<Favorite[]> {
    return ReviewRepository.listFavorites(userId);
  },
};
