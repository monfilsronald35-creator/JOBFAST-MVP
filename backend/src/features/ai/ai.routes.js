import { Router } from 'express';
import { authMiddleware } from '../../middlewares/authMiddleware.js';
import asyncHandler from '../../utils/asyncHandler.js';
import { chat } from '../../ai/assistant.js';
import { search, suggest } from '../../ai/search.js';
import { recommendWorkers, recommendJobs, trendingCategories } from '../../ai/recommendation.js';
import { rateLimiters } from '../../gateway/index.js';

const router = Router();

// AI Assistant chat
router.post('/chat', authMiddleware, rateLimiters.general, asyncHandler(async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ success: false, error: 'Message required' });
  const result = await chat(req.user?.id, message, history);
  res.json({ success: true, data: result });
}));

// AI-enhanced search
router.get('/search', asyncHandler(async (req, res) => {
  const { q, type, category, location, page, limit } = req.query;
  const results = await search({ query: q, type, category, location, page: +page || 1, limit: +limit || 20 });
  res.json({ success: true, data: results });
}));

// Search suggestions (autocomplete)
router.get('/suggest', asyncHandler(async (req, res) => {
  const suggestions = await suggest(req.query.q, 5);
  res.json({ success: true, data: suggestions });
}));

// Worker recommendations for a job
router.get('/recommend/workers/:jobId', authMiddleware, asyncHandler(async (req, res) => {
  const workers = await recommendWorkers(req.params.jobId, +req.query.limit || 10);
  res.json({ success: true, data: workers });
}));

// Job recommendations for a worker
router.get('/recommend/jobs', authMiddleware, asyncHandler(async (req, res) => {
  const jobs = await recommendJobs(req.user.id, +req.query.limit || 10);
  res.json({ success: true, data: jobs });
}));

// Trending categories
router.get('/trending', asyncHandler(async (req, res) => {
  const categories = await trendingCategories(+req.query.limit || 8);
  res.json({ success: true, data: categories });
}));

export default router;
