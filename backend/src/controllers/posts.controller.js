import postRepo from '../repositories/post.repository.js';

const uid = (req) => req.user?._id || req.user?.id;

// GET /posts/feed
export async function getFeed(req, res) {
  try {
    const me     = uid(req);
    const limit  = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor || null;

    const result = await postRepo.getFeed(String(me), { limit, cursor });
    res.json({ success: true, posts: result.posts, nextCursor: result.nextCursor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /posts/user/:userId
export async function getUserPosts(req, res) {
  try {
    const { userId } = req.params;
    const me     = uid(req);
    const limit  = Math.min(Number(req.query.limit) || 24, 60);
    const cursor = req.query.cursor || null;

    const result = await postRepo.getUserPosts(String(userId), String(me), { limit, cursor });
    res.json({ success: true, posts: result.posts, nextCursor: result.nextCursor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /posts
export async function createPost(req, res) {
  try {
    const me = uid(req);
    const { type = 'photo', mediaUrl = '', caption = '', audience = 'public', duration, thumbnailUrl } = req.body;

    const post = await postRepo.insert({
      userId: String(me),
      type,
      mediaUrl:     mediaUrl     || '',
      thumbnailUrl: thumbnailUrl || '',
      caption:      caption?.trim() || '',
      audience,
      duration: duration || null,
    });

    res.status(201).json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /posts/:id/like  (also handles unlike via toggle)
export async function likePost(req, res) {
  try {
    const me = uid(req);
    const { liked, likesCount } = await postRepo.toggleLike(req.params.id, String(me));
    res.json({ success: true, liked, likesCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /posts/:id/like
export async function unlikePost(req, res) {
  try {
    const me = uid(req);
    const { likesCount } = await postRepo.toggleLike(req.params.id, String(me));
    res.json({ success: true, likesCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /posts/:id/comments
export async function addComment(req, res) {
  try {
    const me = uid(req);
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'text required' });

    const result = await postRepo.addComment(req.params.id, String(me), text.trim());
    res.status(201).json({ success: true, comment: result.comment, commentsCount: result.commentsCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /posts/:id/comments
export async function getComments(req, res) {
  try {
    const comments = await postRepo.getComments(req.params.id);
    res.json({ success: true, comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}