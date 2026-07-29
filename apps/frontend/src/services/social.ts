import API from '../api/axios';

interface UserStats  { followers: number; following: number; posts: number; }
interface Post       { id?: string; _id?: string; userId: string | number; createdAt?: string; [key: string]: unknown; }
interface Comment    { id: string; userId: string; userName: string; userAvatar: string; text: string; createdAt: string; }

const lsGet = <T>(k: string, d: T): T => {
  try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : d; } catch { return d; }
};
const lsSet = (k: string, v: unknown): void => {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
};

const followKey   = (myId: string | number) => `jf_following_${myId}`;
const savedKey    = (myId: string | number) => `jf_saved_${myId}`;
const likedKey    = (myId: string | number) => `jf_liked_${myId}`;
const postsKey    = (userId: string | number) => `jf_posts_${userId}`;
const commentsKey = (postId: string | number) => `jf_comments_${postId}`;
const statsKey    = (userId: string | number) => `jf_stats_${userId}`;

export const getFollowing = (myId: string | number): string[] => lsGet<string[]>(followKey(myId), []);

export const isFollowing = (myId: string | number, targetId: string | number): boolean =>
  getFollowing(myId).includes(String(targetId));

export const followUser = (myId: string | number, targetId: string | number): void => {
  const tid  = String(targetId);
  const list = getFollowing(myId);
  if (!list.includes(tid)) lsSet(followKey(myId), [...list, tid]);
  const stats = lsGet<UserStats>(statsKey(tid), { followers: 0, following: 0, posts: 0 });
  lsSet(statsKey(tid), { ...stats, followers: Math.max(0, (stats.followers || 0) + 1) });
  API.post(`/users/${tid}/follow`).catch(() => {});
};

export const unfollowUser = (myId: string | number, targetId: string | number): void => {
  const tid = String(targetId);
  lsSet(followKey(myId), getFollowing(myId).filter((id) => id !== tid));
  const stats = lsGet<UserStats>(statsKey(tid), { followers: 0, following: 0, posts: 0 });
  lsSet(statsKey(tid), { ...stats, followers: Math.max(0, (stats.followers || 0) - 1) });
  API.delete(`/users/${tid}/follow`).catch(() => {});
};

export const getFollowersCount = (userId: string | number): number => {
  const stats = lsGet<Partial<UserStats>>(statsKey(String(userId)), { followers: 0 });
  return stats.followers || 0;
};

export const getSaved    = (myId: string | number): string[] => lsGet<string[]>(savedKey(myId), []);
export const isSaved     = (myId: string | number, targetId: string | number): boolean => getSaved(myId).includes(String(targetId));

export const saveUser = (myId: string | number, targetId: string | number): void => {
  const tid = String(targetId);
  const list = getSaved(myId);
  if (!list.includes(tid)) lsSet(savedKey(myId), [...list, tid]);
};

export const unsaveUser = (myId: string | number, targetId: string | number): void => {
  lsSet(savedKey(myId), getSaved(myId).filter((id) => id !== String(targetId)));
};

export const getUserPosts = (userId: string | number): Post[] =>
  lsGet<Post[]>(postsKey(String(userId)), []).sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );

export const addPost = (post: Post): Post => {
  const uid   = String(post.userId);
  const posts = lsGet<Post[]>(postsKey(uid), []);
  const next  = [
    { ...post, id: post.id || `post_${Date.now()}`, createdAt: post.createdAt || new Date().toISOString() },
    ...posts,
  ];
  lsSet(postsKey(uid), next);
  const stats = lsGet<UserStats>(statsKey(uid), { followers: 0, following: 0, posts: 0 });
  lsSet(statsKey(uid), { ...stats, posts: next.length });
  API.post('/posts', post).catch(() => {});
  return next[0]!;
};

export const getFeed = (myId: string | number): Post[] => {
  const following = getFollowing(myId);
  const allPosts  = following.flatMap((uid) => getUserPosts(uid));
  return allPosts.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()).slice(0, 50);
};

export const getLiked     = (myId: string | number): string[] => lsGet<string[]>(likedKey(myId), []);
export const isLiked      = (myId: string | number, postId: string | number): boolean => getLiked(myId).includes(String(postId));
export const getLikeCount = (postId: string | number): number => lsGet<number>(`jf_likes_count_${postId}`, 0);

export const likePost = (myId: string | number, post: Post): boolean => {
  const pid   = String(post.id || post._id);
  const liked = getLiked(myId);
  if (liked.includes(pid)) return false;
  lsSet(likedKey(myId), [...liked, pid]);
  lsSet(`jf_likes_count_${pid}`, getLikeCount(pid) + 1);
  API.post(`/posts/${pid}/like`).catch(() => {});
  return true;
};

export const unlikePost = (myId: string | number, post: Post): void => {
  const pid = String(post.id || post._id);
  lsSet(likedKey(myId), getLiked(myId).filter((id) => id !== pid));
  lsSet(`jf_likes_count_${pid}`, Math.max(0, getLikeCount(pid) - 1));
  API.delete(`/posts/${pid}/like`).catch(() => {});
};

export const getComments = (postId: string | number): Comment[] =>
  lsGet<Comment[]>(commentsKey(String(postId)), []);

export const addComment = (
  myId: string,
  postId: string | number,
  text: string,
  userName: string,
  userAvatar: string
): Comment => {
  const pid = String(postId);
  const c: Comment = {
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

export const getUserStats = (userId: string | number): UserStats => {
  const uid    = String(userId);
  const stored = lsGet<UserStats | null>(statsKey(uid), null);
  const posts  = getUserPosts(uid).length;
  return stored ? { ...stored, posts } : { followers: 0, following: 0, posts };
};