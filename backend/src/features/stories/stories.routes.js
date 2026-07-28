import { Router } from 'express';
import { supabase } from '../../config/supabaseClient.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { authMiddleware } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const { data } = await supabase
    .from('stories')
    .select('*, author:profiles(id, name, profileMetadata)')
    .eq('is_active', true)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(50);
  res.json({ success: true, data: data || [], total: (data || []).length });
}));

router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const { mediaUrl, mediaType, caption, duration = 5 } = req.body;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60_000).toISOString();
  const { data, error } = await supabase.from('stories').insert({
    author_id: req.user.id, media_url: mediaUrl, media_type: mediaType,
    caption, duration, expires_at: expiresAt, is_active: true,
  }).select().single();
  if (error) return res.status(400).json({ success: false, error: error.message });
  res.status(201).json({ success: true, data });
}));

router.post('/:id/view', authMiddleware, asyncHandler(async (req, res) => {
  await supabase.from('story_views').upsert({ story_id: req.params.id, viewer_id: req.user.id });
  res.json({ success: true });
}));

router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const { error } = await supabase.from('stories').update({ is_active: false }).eq('id', req.params.id).eq('author_id', req.user.id);
  if (error) return res.status(400).json({ success: false, error: error.message });
  res.json({ success: true });
}));

export default router;
