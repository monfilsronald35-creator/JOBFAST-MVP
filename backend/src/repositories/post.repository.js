/**
 * PostRepository — maps `posts`, `post_likes`, `post_comments` tables.
 *
 * Replaces the Mongoose Post model embedded arrays (likes, comments)
 * with proper relational junction tables for efficient querying.
 */

import { BaseRepository } from './base.repository.js';
import supabase from '../config/supabaseClient.js';

class PostRepository extends BaseRepository {
  constructor() {
    super('posts');
  }

  _toRow(obj) {
    const row = {};
    if (obj.userId       !== undefined) row.user_id       = obj.userId;
    if (obj.type         !== undefined) row.type          = obj.type;
    if (obj.mediaUrl     !== undefined) row.media_url     = obj.mediaUrl;
    if (obj.thumbnailUrl !== undefined) row.thumbnail_url = obj.thumbnailUrl;
    if (obj.caption      !== undefined) row.caption       = obj.caption;
    if (obj.audience     !== undefined) row.audience      = obj.audience;
    if (obj.duration     !== undefined) row.duration      = obj.duration;
    return row;
  }

  _toModel(row, { liked = false, likerIds = [] } = {}) {
    if (!row) return null;
    return {
      id:            row.id,
      userId:        row.user_id,
      // Populated author fields (from JOIN)
      userName:      row.profiles?.name ?? '',
      userAvatar:    row.profiles?.profile_photo ?? '',
      userProfession: row.profiles?.profession ?? row.profiles?.role ?? '',
      userCity:      row.profiles?.location_city ?? '',
      type:          row.type          ?? 'photo',
      mediaUrl:      row.media_url     ?? '',
      thumbnailUrl:  row.thumbnail_url ?? '',
      caption:       row.caption       ?? '',
      audience:      row.audience      ?? 'public',
      likesCount:    row.likes_count   ?? 0,
      commentsCount: row.comments_count ?? 0,
      duration:      row.duration,
      liked,
      // Embed likes array for backward compatibility with controllers
      likes:         likerIds,
      comments:      [],
      createdAt:     row.created_at,
      updatedAt:     row.updated_at,
    };
  }

  // ── Feed ──────────────────────────────────────────────────────────────────

  /**
   * Get the public feed for a user: posts from users they follow.
   * Falls back to all public posts when the user follows nobody.
   */
  async getFeed(viewerId, { limit = 20, cursor = null } = {}) {
    // Get following IDs
    const { data: follows } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', viewerId);

    const followingIds = (follows || []).map(f => f.following_id);

    let q = supabase
      .from('posts')
      .select(`*, profiles:user_id (name, profile_photo, profession, role, location_city)`)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (followingIds.length > 0) {
      // Posts from followed users OR own posts
      q = q.in('user_id', [...followingIds, viewerId]);
      q = q.in('audience', ['public', 'followers']);
    } else {
      // Explore mode: all public posts
      q = q.eq('audience', 'public');
    }

    if (cursor) q = q.lt('created_at', cursor);

    const { data, error } = await q;
    this._unwrap({ data, error });

    const hasMore    = (data || []).length > limit;
    const paginated  = hasMore ? data.slice(0, limit) : (data || []);

    // Fetch which posts the viewer has liked (batch)
    const postIds = paginated.map(p => p.id);
    const likedSet = await this._getLikedSet(viewerId, postIds);

    return {
      posts:     paginated.map(r => this._toModel(r, { liked: likedSet.has(r.id) })),
      hasMore,
      nextCursor: hasMore ? paginated[paginated.length - 1].created_at : null,
    };
  }

  /** Get posts by a specific user (for their profile grid). */
  async getUserPosts(userId, viewerId, { limit = 24, cursor = null } = {}) {
    const isOwner = userId === viewerId;
    let q = supabase
      .from('posts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (!isOwner) q = q.eq('audience', 'public');
    if (cursor)   q = q.lt('created_at', cursor);

    const { data, error } = await q;
    this._unwrap({ data, error });

    const hasMore   = (data || []).length > limit;
    const paginated = hasMore ? data.slice(0, limit) : (data || []);
    const likedSet  = await this._getLikedSet(viewerId, paginated.map(p => p.id));

    return {
      posts:     paginated.map(r => this._toModel(r, { liked: likedSet.has(r.id) })),
      hasMore,
      nextCursor: hasMore ? paginated[paginated.length - 1].created_at : null,
    };
  }

  // ── Likes ─────────────────────────────────────────────────────────────────

  /** Toggle like. Returns { liked: bool, likesCount: number }. */
  async toggleLike(postId, userId) {
    // Check if already liked
    const { data: existing } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase.from('post_likes').delete()
        .eq('post_id', postId).eq('user_id', userId);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
    }

    // Trigger on post_likes keeps likes_count in sync — fetch updated count
    const { data: post } = await supabase
      .from('posts').select('likes_count').eq('id', postId).single();

    return { liked: !existing, likesCount: post?.likes_count ?? 0 };
  }

  /** Batch: return a Set of post IDs liked by viewerId. */
  async _getLikedSet(viewerId, postIds) {
    if (!viewerId || !postIds.length) return new Set();
    const { data } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', viewerId)
      .in('post_id', postIds);
    return new Set((data || []).map(r => r.post_id));
  }

  // ── Comments ──────────────────────────────────────────────────────────────

  async addComment(postId, userId, text) {
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, user_id: userId, text })
      .select(`*, profiles:user_id (name, profile_photo)`)
      .single();
    this._unwrap({ data, error });

    const { data: post } = await supabase
      .from('posts').select('comments_count').eq('id', postId).single();

    return {
      comment: {
        id:        data.id,
        userId:    data.user_id,
        text:      data.text,
        userName:  data.profiles?.name ?? '',
        userAvatar: data.profiles?.profile_photo ?? '',
        createdAt: data.created_at,
      },
      commentsCount: post?.comments_count ?? 0,
    };
  }

  async getComments(postId) {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`*, profiles:user_id (name, profile_photo)`)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    this._unwrap({ data, error });
    return (data || []).map(r => ({
      id:        r.id,
      userId:    r.user_id,
      text:      r.text,
      userName:  r.profiles?.name ?? '',
      userAvatar: r.profiles?.profile_photo ?? '',
      createdAt: r.created_at,
    }));
  }
}

export default new PostRepository();