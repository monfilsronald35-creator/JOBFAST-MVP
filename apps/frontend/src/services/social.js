/**
 * social.js — Follow / Like / Save / Posts service
 * localStorage-first (works offline); syncs to API in background.
 */
import API from '../api/axios';

const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// ── Helpers ───────────────────────────────────────────────────
const followKey  = (myId)          => `jf_following_${myId}`;
const savedKey   = (myId)          => `jf_saved_${myId}`;
const likedKey   = (myId)          => `jf_liked_${myId}`;
const postsKey   = (userId)        => `jf_posts_${userId}`;
const commentsKey= (postId)        => `jf_comments_${postId}`;
const statsKey   = (userId)        => `jf_stats_${userId}`;

// ── FOLLOW ────────────────────────────────────────────────────
export const getFollowing = (myId) => lsGet(followKey(myId), []);

export const isFollowing  = (myId, targetId) =>
  getFollowing(myId).includes(String(targetId));

export const followUser = (myId, targetId) => {
  const tid  = String(targetId);
  const list = getFollowing(myId);
  if (!list.includes(tid)) lsSet(followKey(myId), [...list, tid]);
  // Increment target's follower count in localStorage
  const stats = lsGet(statsKey(tid), { followers: 0, following: 0, posts: 0 });
  lsSet(statsKey(tid), { ...stats, followers: Math.max(0, (stats.followers || 0) + 1) });
  // Background API sync
  API.post(`/users/${tid}/follow`).catch(() => {});
};

export const unfollowUser = (myId, targetId) => {
  const tid  = String(targetId);
  lsSet(followKey(myId), getFollowing(myId).filter(id => id !== tid));
  const stats = lsGet(statsKey(tid), { followers: 0, following: 0, posts: 0 });
  lsSet(statsKey(tid), { ...stats, followers: Math.max(0, (stats.followers || 0) - 1) });
  API.delete(`/users/${tid}/follow`).catch(() => {});
};

export const getFollowersCount = (userId) => {
  const stats = lsGet(statsKey(String(userId)), { followers: 0 });
  return stats.followers || 0;
};

// ── SAVE (bookmark user) ──────────────────────────────────────
export const getSaved    = (myId)          => lsGet(savedKey(myId), []);
export const isSaved     = (myId, targetId) => getSaved(myId).includes(String(targetId));

export const saveUser = (myId, targetId) => {
  const tid = String(targetId);
  const list = getSaved(myId);
  if (!list.includes(tid)) lsSet(savedKey(myId), [...list, tid]);
};

export const unsaveUser = (myId, targetId) => {
  lsSet(savedKey(myId), getSaved(myId).filter(id => id !== String(targetId)));
};

// ── POSTS ─────────────────────────────────────────────────────
export const getUserPosts = (userId) =>
  lsGet(postsKey(String(userId)), []).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

export const addPost = (post) => {
  const uid   = String(post.userId);
  const posts = lsGet(postsKey(uid), []);
  const next  = [{ ...post, id: post.id || `post_${Date.now()}`, createdAt: post.createdAt || new Date().toISOString() }, ...posts];
  lsSet(postsKey(uid), next);
  // Update post count stat
  const stats = lsGet(statsKey(uid), { followers: 0, following: 0, posts: 0 });
  lsSet(statsKey(uid), { ...stats, posts: next.length });
  // Background API sync
  API.post('/posts', post).catch(() => {});
  return next[0];
};

export const getFeed = (myId) => {
  const following = getFollowing(myId);
  const allPosts  = following.flatMap(uid => getUserPosts(uid));
  return allPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50);
};

// ── LIKES ─────────────────────────────────────────────────────
export const getLiked     = (myId)         => lsGet(likedKey(myId), []);
export const isLiked      = (myId, postId) => getLiked(myId).includes(String(postId));
export const getLikeCount = (postId) => lsGet(`jf_likes_count_${postId}`, 0);

export const likePost = (myId, post) => {
  const pid = String(post.id || post._id);
  const liked = getLiked(myId);
  if (liked.includes(pid)) return false; // already liked
  lsSet(likedKey(myId), [...liked, pid]);
  const count = getLikeCount(pid);
  lsSet(`jf_likes_count_${pid}`, count + 1);
  API.post(`/posts/${pid}/like`).catch(() => {});
  return true;
};

export const unlikePost = (myId, post) => {
  const pid = String(post.id || post._id);
  lsSet(likedKey(myId), getLiked(myId).filter(id => id !== pid));
  const count = getLikeCount(pid);
  lsSet(`jf_likes_count_${pid}`, Math.max(0, count - 1));
  API.delete(`/posts/${pid}/like`).catch(() => {});
};

// ── COMMENTS ──────────────────────────────────────────────────
export const getComments = (postId) =>
  lsGet(commentsKey(String(postId)), []);

export const addComment = (myId, postId, text, userName, userAvatar) => {
  const pid = String(postId);
  const c = {
    id:        `c_${Date.now()}`,
    userId:    myId,
    userName,
    userAvatar,
    text,
    createdAt: new Date().toISOString(),
  };
  lsSet(commentsKey(pid), [...getComments(pid), c]);
  API.post(`/posts/${pid}/comments`, { text }).catch(() => {});
  return c;
};

// ── STATS ─────────────────────────────────────────────────────
export const getUserStats = (userId) => {
  const uid = String(userId);
  const stored = lsGet(statsKey(uid), null);
  const posts  = getUserPosts(uid).length;
  return stored
    ? { ...stored, posts }
    : { followers: 0, following: 0, posts };
};
