import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import { type Review, type Favorite } from '../types/commerce.types.js';

function toReview(r: Record<string, unknown>): Review {
  const base: Review = {
    id: r['id'] as string, productId: r['product_id'] as string,
    reviewerId: r['reviewer_id'] as string, sellerId: r['seller_id'] as string,
    rating: r['rating'] as number, body: r['body'] as string,
    pros: (r['pros'] as string[]) ?? [], cons: (r['cons'] as string[]) ?? [],
    mediaUrls: (r['media_urls'] as string[]) ?? [],
    isVerifiedPurchase: r['is_verified_purchase'] as boolean,
    isSpam: r['is_spam'] as boolean, helpfulCount: r['helpful_count'] as number,
    createdAt: r['created_at'] as string, updatedAt: r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['order_id']) b['orderId'] = r['order_id'];
  if (r['title'])    b['title']   = r['title'];
  return base;
}

function toFavorite(r: Record<string, unknown>): Favorite {
  return {
    id: r['id'] as string, userId: r['user_id'] as string,
    targetType: r['target_type'] as Favorite['targetType'],
    targetId: r['target_id'] as string, createdAt: r['created_at'] as string,
  };
}

export const ReviewRepository = {
  async create(data: Omit<Review, 'id' | 'isSpam' | 'helpfulCount' | 'createdAt' | 'updatedAt'>): Promise<Review> {
    const row: Record<string, unknown> = {
      product_id: data.productId, reviewer_id: data.reviewerId, seller_id: data.sellerId,
      rating: data.rating, body: data.body,
      pros: data.pros, cons: data.cons, media_urls: data.mediaUrls,
      is_verified_purchase: data.isVerifiedPurchase,
    };
    if (data.orderId) row['order_id'] = data.orderId;
    if (data.title)   row['title']    = data.title;
    const { data: saved, error } = await db.client()
      .from('mp_reviews').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create review', 500, 'DB_ERROR');
    return toReview(saved);
  },

  async listByProduct(productId: string): Promise<Review[]> {
    const { data, error } = await db.client().from('mp_reviews').select('*')
      .eq('product_id', productId).eq('is_spam', false)
      .order('created_at', { ascending: false }).returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list reviews', 500, 'DB_ERROR');
    return (data ?? []).map(toReview);
  },

  async markHelpful(id: string): Promise<void> {
    const { data } = await db.client().from('mp_reviews')
      .select('helpful_count').eq('id', id).single<Record<string, unknown>>();
    if (!data) return;
    await db.client().from('mp_reviews')
      .update({ helpful_count: (data['helpful_count'] as number ?? 0) + 1 })
      .eq('id', id).throwOnError();
  },

  async markSpam(id: string): Promise<void> {
    await db.client().from('mp_reviews').update({ is_spam: true }).eq('id', id).throwOnError();
  },

  // ——— Favorites ——————————————————————————————————————————————————————————
  async addFavorite(userId: string, targetType: Favorite['targetType'], targetId: string): Promise<Favorite> {
    const { data, error } = await db.client().from('mp_favorites')
      .upsert({ user_id: userId, target_type: targetType, target_id: targetId },
               { onConflict: 'user_id,target_type,target_id' })
      .select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to add favorite', 500, 'DB_ERROR');
    return toFavorite(data);
  },

  async removeFavorite(userId: string, targetType: string, targetId: string): Promise<void> {
    await db.client().from('mp_favorites')
      .delete().eq('user_id', userId).eq('target_type', targetType).eq('target_id', targetId)
      .throwOnError();
  },

  async listFavorites(userId: string): Promise<Favorite[]> {
    const { data, error } = await db.client().from('mp_favorites').select('*').eq('user_id', userId)
      .order('created_at', { ascending: false }).returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list favorites', 500, 'DB_ERROR');
    return (data ?? []).map(toFavorite);
  },
};
