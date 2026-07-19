/**
 * NotificationRepository — maps the `notifications` Supabase table.
 *
 * The notifications table ALREADY EXISTS in Supabase.
 * This repository adapts the existing schema to the app's camelCase API.
 *
 * Assumed column names (snake_case, Supabase convention):
 *   id, user_id, type, category, title, message, data,
 *   is_read, action_url, expires_at, source_user_id,
 *   related_job_id, created_at, updated_at
 */

import { BaseRepository } from './base.repository.js';
import supabase from '../config/supabaseClient.js';

class NotificationRepository extends BaseRepository {
  constructor() {
    super('notifications');
  }

  _toRow(obj) {
    const row = {};
    if (obj.userId        !== undefined) row.user_id         = obj.userId;
    if (obj.type          !== undefined) row.type            = obj.type;
    if (obj.category      !== undefined) row.category        = obj.category;
    if (obj.title         !== undefined) row.title           = obj.title;
    if (obj.message       !== undefined) row.message         = obj.message;
    if (obj.data          !== undefined) row.data            = obj.data;
    if (obj.isRead        !== undefined) row.is_read         = obj.isRead;
    if (obj.actionUrl     !== undefined) row.action_url      = obj.actionUrl;
    if (obj.expiresAt     !== undefined) row.expires_at      = obj.expiresAt;
    if (obj.sourceUserId  !== undefined) row.source_user_id  = obj.sourceUserId;
    if (obj.relatedJobId  !== undefined) row.related_job_id  = obj.relatedJobId;
    return row;
  }

  _toModel(row) {
    if (!row) return null;
    return {
      _id:          row.id,
      id:           row.id,
      userId:       row.user_id,
      type:         row.type         ?? 'system',
      category:     row.category,
      title:        row.title,
      message:      row.message,
      data:         row.data         ?? {},
      isRead:       row.is_read      ?? false,
      actionUrl:    row.action_url,
      expiresAt:    row.expires_at,
      sourceUserId: row.source_user_id,
      relatedJobId: row.related_job_id,
      createdAt:    row.created_at,
      updatedAt:    row.updated_at,
    };
  }

  /**
   * Paginated notifications for a user, newest first.
   * Excludes expired notifications.
   */
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const offset = (page - 1) * limit;
    const now    = new Date().toISOString();

    let q = this.db
      .from(this.table)
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .or(`expires_at.is.null,expires_at.gt.${now}`)  // exclude expired
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) q = q.eq('is_read', false);

    const { data, count, error } = await q;
    this._unwrap({ data, error });

    return {
      notifications: (data || []).map(r => this._toModel(r)),
      total:  count ?? 0,
      unread: 0, // filled below
    };
  }

  /** Count unread notifications for a user. */
  async countUnread(userId) {
    const { count, error } = await this.db
      .from(this.table)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) this._unwrap({ data: null, error });
    return count ?? 0;
  }

  /** Mark a single notification as read. */
  async markRead(notificationId, userId) {
    const { data, error } = await this.db
      .from(this.table)
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId)   // RLS: user can only update their own
      .select()
      .single();
    this._unwrap({ data, error });
    return this._toModel(data);
  }

  /** Mark all notifications as read for a user. */
  async markAllRead(userId) {
    const { error } = await this.db
      .from(this.table)
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) this._unwrap({ data: null, error });
  }

  /** Bulk insert (e.g. system broadcast). */
  async broadcast(notifications) {
    const rows = notifications.map(n => this._toRow(n));
    const { data, error } = await this.db
      .from(this.table)
      .insert(rows)
      .select();
    this._unwrap({ data, error });
    return (data || []).map(r => this._toModel(r));
  }

  /** Delete expired notifications (call from a scheduled function). */
  async deleteExpired() {
    const { error } = await this.db
      .from(this.table)
      .delete()
      .lt('expires_at', new Date().toISOString());
    if (error) this._unwrap({ data: null, error });
  }
}

export default new NotificationRepository();