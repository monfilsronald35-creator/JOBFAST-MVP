import { db } from '../../../core/database/SupabaseClient.js';
import { ProductRepository } from '../repositories/ProductRepository.js';
import { type Product, type ProductSearchQuery } from '../types/product.types.js';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  electronics:     ['phone', 'laptop', 'tablet', 'computer', 'camera', 'TV', 'device'],
  clothing:        ['shirt', 'dress', 'shoes', 'pants', 'jacket', 'hat', 'clothes'],
  food:            ['restaurant', 'meal', 'food', 'drink', 'cake', 'snack', 'beverage'],
  services:        ['repair', 'cleaning', 'plumber', 'electrician', 'driver', 'consultant'],
  real_estate:     ['house', 'apartment', 'room', 'land', 'property', 'rental'],
  health:          ['doctor', 'hospital', 'medicine', 'clinic', 'pharmacy', 'dentist'],
  education:       ['course', 'training', 'school', 'university', 'lesson', 'tutor'],
  transport:       ['car', 'moto', 'truck', 'taxi', 'delivery', 'shipping'],
  digital:         ['software', 'ebook', 'pdf', 'music', 'template', 'license', 'plugin'],
  hospitality:     ['hotel', 'airbnb', 'hostel', 'room', 'reservation', 'booking'],
};

export const AIMarketplaceEngine = {
  classifyProduct(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    let best = 'other'; let bestScore = 0;
    for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
      const score = kws.filter(kw => text.includes(kw.toLowerCase())).length;
      if (score > bestScore) { bestScore = score; best = cat; }
    }
    return best;
  },

  generateTags(title: string, description: string): string[] {
    const stopWords = new Set(['the','a','an','is','in','on','at','to','for','of','and','or','with','by']);
    const text  = `${title} ${description}`.toLowerCase();
    const words = text.replace(/[^a-z0-9\s]/g, '').split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));
    const freq: Record<string, number> = {};
    for (const w of words) freq[w] = (freq[w] ?? 0) + 1;
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([w]) => w);
  },

  optimizePrice(currentPrice: number, category: string): { suggested: number; reasoning: string } {
    const categoryMultipliers: Record<string, number> = {
      electronics: 0.95, clothing: 0.90, food: 1.0, services: 1.05,
      real_estate: 1.02, health: 1.08, education: 0.98, digital: 0.85,
    };
    const mult     = categoryMultipliers[category] ?? 1.0;
    const suggested = Math.round(currentPrice * mult);
    return {
      suggested,
      reasoning: `Based on ${category} market analysis — ${mult < 1 ? 'slight discount' : 'premium'} recommended`,
    };
  },

  async computeRecommendations(userId: string, query: ProductSearchQuery): Promise<Product[]> {
    const { data: history } = await db.client().from('mp_orders')
      .select('store_id, seller_id').eq('buyer_id', userId).limit(10)
      .returns<Record<string, unknown>[]>();

    const sellerIds = [...new Set((history ?? []).map(r => r['seller_id'] as string))];
    let products = await ProductRepository.search({ ...query, limit: 30 });

    products = products.sort((a, b) => {
      let scoreA = 0; let scoreB = 0;
      if (sellerIds.includes(a.sellerId)) scoreA += 20;
      if (sellerIds.includes(b.sellerId)) scoreB += 20;
      if (a.isSponsored) scoreA += 10;
      if (b.isSponsored) scoreB += 10;
      if (a.isFeatured)  scoreA += 5;
      if (b.isFeatured)  scoreB += 5;
      scoreA += a.rating * 4;
      scoreB += b.rating * 4;
      return scoreB - scoreA;
    });

    await Promise.all(
      products.slice(0, 10).map(p =>
        db.client().from('mp_ai_scores').upsert(
          { user_id: userId, product_id: p.id, score: (p.rating / 5).toFixed(4), computed_at: new Date().toISOString() },
          { onConflict: 'user_id,product_id' }
        ).throwOnError().catch(() => undefined)
      )
    );

    return products.slice(0, query.limit ?? 20);
  },

  detectFraudListing(product: { title: string; basePrice: number; category: string }): boolean {
    if (product.basePrice < 0) return true;
    const suspiciousWords = ['free', 'hack', 'crack', 'pirate', 'clone'];
    const text = product.title.toLowerCase();
    return suspiciousWords.some(w => text.includes(w));
  },
};
