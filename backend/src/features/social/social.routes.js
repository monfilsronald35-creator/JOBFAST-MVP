/**
 * Social Feature — posts, follows, reactions, community feed
 * Delegates to existing posts/follow controllers where available
 */
import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import { supabase } from '../../config/supabaseClient.js';
import { withCache, cache } from '../../core/cache.js';
import { eventBus, Events } from '../../core/eventBus.js';
import { analytics } from '../../core/analytics.js';
import asyncHandler from '../../utils/asyncHandler.js';

const router = Router();

// Community feed — authenticated or public
router.get('/feed', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type } = req.query;
  const cacheKey = `social:feed:${type}:${page}`;
  const data = await withCache(cache.short, cacheKey, async () => {
    let q = supabase.from('posts')
      .select('*, author:profiles(id,name,profileMetadata,role)', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (type) q = q.eq('type', type);
    q = q.range((page - 1) * limit, page * limit - 1);
    const { data, count } = await q;
    return { items: data || [], total: count || 0 };
  }, 30_000);
  res.json({ success: true, ...data, page: +page, limit: +limit });
}));

// Post a message/status
router.post('/post', authMiddleware, asyncHandler(async (req, res) => {
  const { content, mediaUrl, type = 'post' } = req.body;
  if (!content?.trim()) return res.status(400).json({ success: false, error: 'Content required' });

  const { data, error } = await supabase.from('posts').insert({
    author_id: req.user.id, content, media_url: mediaUrl, type, is_active: true,
  }).select('*, author:profiles(id,name,profileMetadata)').single();

  if (error) return res.status(400).json({ success: false, error: error.message });

  eventBus.publish(Events.ANALYTICS_EVENT, { event_name: 'post_created', user_id: req.user.id });
  res.status(201).json({ success: true, data });
}));

// React (like, love, etc.)
router.post('/react/:postId', authMiddleware, asyncHandler(async (req, res) => {
  const { type = 'like' } = req.body;
  await supabase.from('post_reactions').upsert({ post_id: req.params.postId, user_id: req.user.id, type });
  res.json({ success: true });
}));

// Follow a user
router.post('/follow/:targetId', authMiddleware, asyncHandler(async (req, res) => {
  const { data, error } = await supabase.from('follows').upsert({
    follower_id: req.user.id, following_id: req.params.targetId,
  });
  if (error) return res.status(400).json({ success: false, error: error.message });

  eventBus.publish(Events.NOTIFY_USER, {
    userId: req.params.targetId, type: 'system',
    data: { title: 'Nouvo moun ap suiv ou!', body: 'Yon moun kòmanse suiv ou sou JOBFAST' },
  });
  res.json({ success: true });
}));

// Unfollow
router.delete('/follow/:targetId', authMiddleware, asyncHandler(async (req, res) => {
  await supabase.from('follows').delete().eq('follower_id', req.user.id).eq('following_id', req.params.targetId);
  res.json({ success: true });
}));

// Get followers/following counts
router.get('/profile/:userId/social', asyncHandler(async (req, res) => {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', req.params.userId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', req.params.userId),
  ]);
  res.json({ success: true, data: { followers: followers || 0, following: following || 0 } });
}));

// Trending posts / hashtags
router.get('/trending', asyncHandler(async (req, res) => {
  const data = await withCache(cache.medium, 'social:trending', async () => {
    const { data } = await supabase.from('posts')
      .select('id, content, type, created_at, author:profiles(id,name,profileMetadata)')
      .eq('is_active', true)
      .gte('created_at', new Date(Date.now() - 24 * 3600_000).toISOString())
      .order('reactions_count', { ascending: false })
      .limit(20);
    return data || [];
  }, 5 * 60_000);
  res.json({ success: true, data });
}));

export default router;
