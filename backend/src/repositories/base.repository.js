/**
 * BaseRepository — generic Supabase CRUD adapter.
 *
 * Every domain repository extends this class and inherits:
 *   findById, findOne, findMany, insert, update, upsert, delete, count
 *
 * Column names in Supabase are snake_case; the app layer uses camelCase.
 * Each subclass overrides `_toRow(obj)` and `_toModel(row)` to handle
 * the mapping — keeping the transformation in ONE place per entity.
 *
 * Error contract:
 *   • Methods throw a plain JS Error with `code` and `statusCode` properties
 *     so the existing errorHandler middleware keeps working unchanged.
 */

import supabase from '../config/supabaseClient.js';

export class BaseRepository {
  /**
   * @param {string} tableName — Supabase table name (snake_case)
   */
  constructor(tableName) {
    this.table = tableName;
    this.db    = supabase;
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  /** Wrap a Supabase { data, error } response, throw on error. */
  _unwrap({ data, error }, context = this.table) {
    if (error) {
      const err = new Error(`[${context}] ${error.message}`);
      err.code       = error.code;
      err.statusCode = error.code === 'PGRST116' ? 404 : 500;
      err.details    = error.details;
      throw err;
    }
    return data;
  }

  /** Build a query with an arbitrary filter map { column: value }. */
  _applyFilters(query, filters = {}) {
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined) continue;
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'object' && value.like) {
        query = query.ilike(key, `%${value.like}%`);
      } else if (typeof value === 'object' && value.gte !== undefined) {
        query = query.gte(key, value.gte);
      } else if (typeof value === 'object' && value.lte !== undefined) {
        query = query.lte(key, value.lte);
      } else {
        query = query.eq(key, value);
      }
    }
    return query;
  }

  // ── Mapping hooks (override in subclasses) ────────────────────────────────

  /** Convert app-layer camelCase object → DB snake_case row. */
  _toRow(obj) { return obj; }

  /** Convert DB snake_case row → app-layer camelCase object. */
  _toModel(row) { return row; }

  // ── Public API ────────────────────────────────────────────────────────────

  /** Find a single row by primary key. Returns null if not found. */
  async findById(id, columns = '*') {
    const { data, error } = await this.db
      .from(this.table)
      .select(columns)
      .eq('id', id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') this._unwrap({ data, error });
    return data ? this._toModel(data) : null;
  }

  /** Find a single row matching an exact-value filter map. Returns null if not found. */
  async findOne(filters = {}, columns = '*') {
    let q = this.db.from(this.table).select(columns);
    q = this._applyFilters(q, filters);
    const { data, error } = await q.maybeSingle();
    if (error) this._unwrap({ data, error });
    return data ? this._toModel(data) : null;
  }

  /**
   * Find many rows with optional filtering, ordering, and pagination.
   * Returns an array (never null).
   */
  async findMany(filters = {}, {
    columns   = '*',
    orderBy   = 'created_at',
    ascending = false,
    limit,
    offset    = 0,
  } = {}) {
    let q = this.db.from(this.table).select(columns);
    q = this._applyFilters(q, filters);
    q = q.order(orderBy, { ascending });
    if (limit !== undefined) {
      q = q.range(offset, offset + limit - 1);
    }
    const { data, error } = await q;
    this._unwrap({ data, error });
    return (data || []).map(r => this._toModel(r));
  }

  /** Insert one row. Returns the inserted model. */
  async insert(payload) {
    const row = this._toRow(payload);
    const { data, error } = await this.db
      .from(this.table)
      .insert(row)
      .select()
      .single();
    this._unwrap({ data, error });
    return this._toModel(data);
  }

  /** Insert many rows. Returns the inserted models. */
  async insertMany(payloads) {
    const rows = payloads.map(p => this._toRow(p));
    const { data, error } = await this.db
      .from(this.table)
      .insert(rows)
      .select();
    this._unwrap({ data, error });
    return (data || []).map(r => this._toModel(r));
  }

  /** Update a row by primary key. Returns the updated model. */
  async update(id, payload) {
    const row = { ...this._toRow(payload), updated_at: new Date().toISOString() };
    const { data, error } = await this.db
      .from(this.table)
      .update(row)
      .eq('id', id)
      .select()
      .single();
    this._unwrap({ data, error });
    return this._toModel(data);
  }

  /** Upsert (insert or update) based on the conflict column(s). */
  async upsert(payload, onConflict = 'id') {
    const row = { ...this._toRow(payload), updated_at: new Date().toISOString() };
    const { data, error } = await this.db
      .from(this.table)
      .upsert(row, { onConflict })
      .select()
      .single();
    this._unwrap({ data, error });
    return this._toModel(data);
  }

  /** Soft delete — sets deleted_at if the column exists; otherwise hard delete. */
  async delete(id) {
    const { error } = await this.db
      .from(this.table)
      .delete()
      .eq('id', id);
    if (error) this._unwrap({ data: null, error });
  }

  /** Count rows matching a filter map. */
  async count(filters = {}) {
    let q = this.db
      .from(this.table)
      .select('*', { count: 'exact', head: true });
    q = this._applyFilters(q, filters);
    const { count, error } = await q;
    if (error) this._unwrap({ data: null, error });
    return count ?? 0;
  }

  /** Call a Supabase RPC (PostgreSQL stored procedure). */
  async rpc(fnName, args = {}) {
    const { data, error } = await this.db.rpc(fnName, args);
    this._unwrap({ data, error }, `rpc:${fnName}`);
    return data;
  }
}