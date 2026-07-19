/**
 * UserRepository — maps the `profiles` Supabase table.
 *
 * The `profiles` table is created by Supabase Auth setup and extended
 * with JOBFAST-specific columns. All columns use snake_case in the DB;
 * the app layer uses the original Mongoose camelCase field names so
 * zero controller/service changes are needed.
 *
 * Mongoose → Supabase column mapping:
 *   name                 → name
 *   firstName            → first_name
 *   lastName             → last_name
 *   email                → email
 *   phone                → phone
 *   bio                  → bio
 *   role                 → role
 *   category             → category
 *   profession           → profession
 *   profileMetadata      → profile_metadata  (jsonb)
 *   profilePhoto         → profile_photo
 *   profileCompleteness  → profile_completeness
 *   following            → n/a (→ user_follows junction table)
 *   followers            → n/a (→ user_follows junction table)
 *   businessType         → business_type
 *   constructionRole     → construction_role
 *   services             → services  (text[])
 *   serviceIntent        → service_intent
 *   status               → status
 *   isAvailable          → is_available
 *   location.city        → location_city
 *   location.country     → location_country
 *   location (GeoJSON)   → location  (PostGIS point)
 *   accountStatus        → account_status
 *   loginAttempts        → login_attempts
 *   createdAt            → created_at
 *   updatedAt            → updated_at
 */

import { BaseRepository } from './base.repository.js';
import supabase from '../config/supabaseClient.js';

class UserRepository extends BaseRepository {
  constructor() {
    super('profiles');
  }

  // ── Mapping ────────────────────────────────────────────────────────────────

  _toRow(obj) {
    const row = {};
    const map = {
      name:                'name',
      firstName:           'first_name',
      lastName:            'last_name',
      email:               'email',
      phone:               'phone',
      bio:                 'bio',
      role:                'role',
      category:            'category',
      profession:          'profession',
      profileMetadata:     'profile_metadata',
      profilePhoto:        'profile_photo',
      profileCompleteness: 'profile_completeness',
      businessType:        'business_type',
      constructionRole:    'construction_role',
      services:            'services',
      serviceIntent:       'service_intent',
      status:              'status',
      isAvailable:         'is_available',
      accountStatus:       'account_status',
      loginAttempts:       'login_attempts',
      // Extended business / reputation / marketplace columns (migration 007)
      companyData:         'company_data',
      enterpriseData:      'enterprise_data',
      reputationData:      'reputation_data',
      marketplaceData:     'marketplace_data',
      verified:            'verified',
      trustScore:          'trust_score',
      availability:        'availability',
      experience:          'experience',
      locationLat:         'location_lat',
      locationLng:         'location_lng',
      stats:               'stats',
    };
    if (obj.passwordHash !== undefined) row.password_hash = obj.passwordHash;
    for (const [appKey, dbCol] of Object.entries(map)) {
      if (obj[appKey] !== undefined) row[dbCol] = obj[appKey];
    }
    // Flatten location object
    if (obj.location) {
      if (obj.location.city)    row.location_city    = obj.location.city;
      if (obj.location.country) row.location_country = obj.location.country;
      if (obj.location.coordinates) {
        // PostGIS point — stored as GEOGRAPHY(POINT, 4326)
        const [lng, lat] = obj.location.coordinates;
        row.location = `POINT(${lng} ${lat})`;
      }
    }
    return row;
  }

  _toModel(row) {
    if (!row) return null;
    return {
      _id:                 row.id,
      id:                  row.id,
      name:                row.name,
      firstName:           row.first_name,
      lastName:            row.last_name,
      email:               row.email,
      phone:               row.phone,
      bio:                 row.bio,
      role:                row.role                 ?? 'user',
      category:            row.category,
      profession:          row.profession,
      profileMetadata:     row.profile_metadata     ?? {},
      profilePhoto:        row.profile_photo,
      profileCompleteness: row.profile_completeness ?? 0,
      businessType:        row.business_type,
      constructionRole:    row.construction_role,
      services:            row.services             ?? [],
      serviceIntent:       row.service_intent       ?? 'none',
      status:              row.status               ?? 'available',
      isAvailable:         row.is_available          ?? true,
      accountStatus:       row.account_status       ?? 'active',
      loginAttempts:       row.login_attempts       ?? 0,
      location: row.location_city || row.location_country ? {
        city:    row.location_city,
        country: row.location_country,
      } : null,
      passwordHash: row.password_hash, // only present when explicitly selected
      // Extended business / reputation / marketplace fields (migration 007)
      companyData:         row.company_data         ?? {},
      enterpriseData:      row.enterprise_data      ?? {},
      reputationData:      row.reputation_data      ?? {},
      marketplaceData:     row.marketplace_data     ?? {},
      verified:            row.verified             ?? false,
      trustScore:          row.trust_score          ?? 0,
      trust_score:         row.trust_score          ?? 0, // kept for reputation.routes.js compatibility
      availability:        row.availability         ?? 'available',
      experience:          row.experience           ?? 0,
      locationLat:         row.location_lat         ?? null,
      locationLng:         row.location_lng         ?? null,
      stats:               row.stats                ?? {},
      createdAt:           row.created_at,
      updatedAt:           row.updated_at,
    };
  }

  // ── Domain methods ─────────────────────────────────────────────────────────

  /** Find user by ID — throws 404 if not found (matching Mongoose behaviour). */
  async getById(userId) {
    const user = await this.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return user;
  }

  /** Find user by email (used during login). */
  async findByEmail(email) {
    return this.findOne({ email: email.toLowerCase().trim() });
  }

  /**
   * Find user by email AND include password_hash for bcrypt comparison.
   * Only call this in auth flows — never return password_hash to clients.
   */
  async findByEmailWithPassword(email) {
    const { data, error } = await this.db
      .from(this.table)
      .select('*, password_hash')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    if (error) this._unwrap({ data, error });
    return this._toModel(data);
  }

  /**
   * Find user by email OR phone AND include password_hash.
   * Used by login flows that accept either identifier type.
   */
  async findByIdentifierWithPassword(identifier) {
    const clean = identifier.toLowerCase().trim();
    const { data, error } = await this.db
      .from(this.table)
      .select('*, password_hash')
      .or(`email.eq.${clean},phone.eq.${clean}`)
      .maybeSingle();
    if (error) this._unwrap({ data, error });
    return this._toModel(data);
  }

  /**
   * Paginated user list with optional search + filters.
   * Mirrors userService.getUsers() interface exactly.
   */
  async getUsers({ page = 1, limit = 20, search = '', role = null, status = null } = {}) {
    const offset = (page - 1) * limit;

    let q = this.db
      .from(this.table)
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role)   q = q.eq('role', role);
    if (status) q = q.eq('account_status', status);
    if (search) {
      const term = search.trim();
      q = q.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
    }

    const { data, count, error } = await q;
    this._unwrap({ data, error });

    return {
      users: (data || []).map(r => this._toModel(r)),
      total: count ?? 0,
      page,
      limit,
      pages: Math.ceil((count ?? 0) / limit),
    };
  }

  /**
   * Aggregate statistics by role and account_status.
   * Mirrors userService.getStats() interface.
   */
  async getStats() {
    const [totalRes, byRoleRes, byStatusRes] = await Promise.all([
      this.db.from(this.table).select('*', { count: 'exact', head: true }),
      this.db.from(this.table).select('role'),
      this.db.from(this.table).select('account_status'),
    ]);

    const total = totalRes.count ?? 0;

    const byRole = {};
    for (const row of byRoleRes.data || []) {
      const k = row.role ?? 'unknown';
      byRole[k] = (byRole[k] ?? 0) + 1;
    }

    const byStatus = {};
    for (const row of byStatusRes.data || []) {
      const k = row.account_status ?? 'unknown';
      byStatus[k] = (byStatus[k] ?? 0) + 1;
    }

    return { total, byRole, byStatus };
  }

  /** Add follower: insert into user_follows junction. */
  async follow(followerId, followingId) {
    const { error } = await this.db
      .from('user_follows')
      .upsert({ follower_id: followerId, following_id: followingId });
    if (error) this._unwrap({ data: null, error }, 'user_follows');
  }

  /** Remove follower: delete from user_follows junction. */
  async unfollow(followerId, followingId) {
    const { error } = await this.db
      .from('user_follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    if (error) this._unwrap({ data: null, error }, 'user_follows');
  }

  /** Check if follower follows following. */
  async isFollowing(followerId, followingId) {
    const { data } = await this.db
      .from('user_follows')
      .select('follower_id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();
    return Boolean(data);
  }

  /** Get IDs of everyone userId follows. */
  async getFollowingIds(userId) {
    const { data, error } = await this.db
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId);
    if (error) this._unwrap({ data, error }, 'user_follows');
    return (data || []).map(r => r.following_id);
  }
}

export default new UserRepository();