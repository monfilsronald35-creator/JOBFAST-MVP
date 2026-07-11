import Post from '../models/post.model.js';
import mongoose from 'mongoose';

const uid = (req) => req.user?._id || req.user?.id;

// GET /posts/feed — posts from followed users (+ own posts)
export async function getFeed(req, res) {
  try {
    const me    = uid(req);
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    // Get who this user follows from User model
    const User = (await import('../models/user.model.js')).default;
    const me_doc = await User.findById(me).select('following').lean();
    const followingIds = me_doc?.following || [];
    const authorIds = [...followingIds.map(id => new mongoose.Types.ObjectId(id)), new mongoose.Types.ObjectId(me)];

    const query = { userId: { $in: authorIds }, audience: { $in: ['public', 'followers'] } };
    if (cursor) query.createdAt = { $lt: cursor };

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate('userId', 'name profession role profileMetadata.profilePhoto location.city')
      .lean();

    const hasMore    = posts.length > limit;
    const paginated  = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? paginated[paginated.length - 1].createdAt : null;

    res.json({ success: true, posts: paginated.map(normalize.bind(null, me)), nextCursor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /posts/user/:userId — posts by a specific user
export async function getUserPosts(req, res) {
  try {
    const { userId } = req.params;
    const me = uid(req);
    const limit  = Math.min(Number(req.query.limit) || 24, 60);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    const query = { userId, audience: String(userId) === String(me) ? { $exists: true } : { $in: ['public'] } };
    if (cursor) query.createdAt = { $lt: cursor };

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore   = posts.length > limit;
    const paginated = hasMore ? posts.slice(0, limit) : posts;

    res.json({ success: true, posts: paginated.map(normalize.bind(null, me)), nextCursor: hasMore ? paginated[paginated.length - 1].createdAt : null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /posts — create post
export async function createPost(req, res) {
  try {
    const me = uid(req);
    const { type = 'photo', mediaUrl = '', caption = '', audience = 'public', duration, thumbnailUrl } = req.body;

    const post = await Post.create({ userId: me, type, mediaUrl: mediaUrl || '', thumbnailUrl: thumbnailUrl || '', caption: caption?.trim() || '', audience, duration: duration || null });
    res.status(201).json({ success: true, post: normalize(me, post.toObject()) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /posts/:id/like
export async function likePost(req, res) {
  try {
    const me  = uid(req);
    const uid_ = new mongoose.Types.ObjectId(me);
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const already = post.likes.some(l => l.equals(uid_));
    if (already) {
      post.likes.pull(uid_);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likes.push(uid_);
      post.likesCount++;
    }
    await post.save();
    res.json({ success: true, liked: !already, likesCount: post.likesCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /posts/:id/like
export async function unlikePost(req, res) {
  try {
    const me = uid(req);
    const post = await Post.findByIdAndUpdate(req.params.id, {
      $pull: { likes: new mongoose.Types.ObjectId(me) },
      $inc:  { likesCount: -1 },
    }, { new: true });
    res.json({ success: true, likesCount: Math.max(0, post?.likesCount || 0) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// POST /posts/:id/comments
export async function addComment(req, res) {
  try {
    const me  = uid(req);
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'text required' });

    const post = await Post.findByIdAndUpdate(req.params.id, {
      $push:  { comments: { userId: me, text: text.trim() } },
      $inc:   { commentsCount: 1 },
    }, { new: true });

    res.status(201).json({ success: true, comment: post.comments[post.comments.length - 1], commentsCount: post.commentsCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// GET /posts/:id/comments
export async function getComments(req, res) {
  try {
    const post = await Post.findById(req.params.id).select('comments').populate('comments.userId', 'name profileMetadata.profilePhoto').lean();
    res.json({ success: true, comments: post?.comments || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

// Helper: normalize a post document for the client
function normalize(myId, p) {
  const liked = Array.isArray(p.likes) && p.likes.some(l => String(l) === String(myId));
  const author = p.userId && typeof p.userId === 'object' ? p.userId : null;
  return {
    id:           String(p._id),
    userId:       author ? String(author._id || author.id) : String(p.userId),
    userName:     author?.name     || '',
    userAvatar:   author?.profileMetadata?.profilePhoto || '',
    userProfession: author?.profession || author?.role || '',
    userCity:     author?.location?.city || '',
    type:         p.type,
    mediaUrl:     p.mediaUrl,
    thumbnailUrl: p.thumbnailUrl,
    caption:      p.caption,
    audience:     p.audience,
    likesCount:   p.likesCount || 0,
    commentsCount:p.commentsCount || 0,
    liked,
    createdAt:    p.createdAt,
  };
}
