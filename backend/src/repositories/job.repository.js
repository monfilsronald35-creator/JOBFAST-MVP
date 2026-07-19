/**
 * JobRepository — maps the `jobs` Supabase table.
 *
 * Replaces the Mongoose Job model (job.model.js).
 * All Mongoose → Supabase field mapping preserved exactly so
 * controllers / services require zero interface changes.
 *
 * Mongoose field     → Supabase column
 *   userId           → user_id
 *   title            → title
 *   description      → description
 *   type             → type
 *   businessType     → business_type
 *   serviceCategory  → service_category
 *   constructionRole → construction_role
 *   status           → status
 *   isAvailable      → is_available
 *   location.city    → location_city
 *   location.country → location_country
 *   location coords  → location  (PostGIS GEOGRAPHY POINT)
 *   location.address → location_address
 *   radiusKm         → radius_km
 *   budget.min       → budget_min
 *   budget.max       → budget_max
 *   budget.currency  → budget_currency
 *   isNegotiable     → is_negotiable
 *   views            → views
 *   applications     → applications
 *   saves            → saves
 *   tags             → tags  (text[])
 *   isUrgent         → is_urgent
 *   boosted          → boosted
 *   boostExpiresAt   → boost_expires_at
 *   requiredSkills   → required_skills  (text[])
 *   experienceLevel  → experience_level
 *   preferredGender  → preferred_gender
 *   minRatingRequired → min_rating_required
 *   notifyRadiusKm   → notify_radius_km
 *   sentNotifications → sent_notifications
 *   rating.average   → rating_average
 *   rating.count     → rating_count
 *   isVerified       → is_verified
 *   isReported       → is_reported
 *   reportCount      → report_count
 *   expiresAt        → expires_at
 */

import { BaseRepository } from './base.repository.js';
import supabase from '../config/supabaseClient.js';

class JobRepository extends BaseRepository {
  constructor() {
    super('jobs');
  }

  _toRow(obj) {
    const row = {};
    if (obj.userId           !== undefined) row.user_id             = obj.userId;
    if (obj.title            !== undefined) row.title               = obj.title;
    if (obj.description      !== undefined) row.description         = obj.description;
    if (obj.type             !== undefined) row.type                = obj.type;
    if (obj.businessType     !== undefined) row.business_type       = obj.businessType;
    if (obj.serviceCategory  !== undefined) row.service_category    = obj.serviceCategory;
    if (obj.constructionRole !== undefined) row.construction_role   = obj.constructionRole;
    if (obj.status           !== undefined) row.status              = obj.status;
    if (obj.isAvailable      !== undefined) row.is_available        = obj.isAvailable;
    if (obj.radiusKm         !== undefined) row.radius_km           = obj.radiusKm;
    if (obj.isNegotiable     !== undefined) row.is_negotiable       = obj.isNegotiable;
    if (obj.views            !== undefined) row.views               = obj.views;
    if (obj.applications     !== undefined) row.applications        = obj.applications;
    if (obj.saves            !== undefined) row.saves               = obj.saves;
    if (obj.tags             !== undefined) row.tags                = obj.tags;
    if (obj.isUrgent         !== undefined) row.is_urgent           = obj.isUrgent;
    if (obj.boosted          !== undefined) row.boosted             = obj.boosted;
    if (obj.boostExpiresAt   !== undefined) row.boost_expires_at    = obj.boostExpiresAt;
    if (obj.requiredSkills   !== undefined) row.required_skills     = obj.requiredSkills;
    if (obj.experienceLevel  !== undefined) row.experience_level    = obj.experienceLevel;
    if (obj.preferredGender  !== undefined) row.preferred_gender    = obj.preferredGender;
    if (obj.minRatingRequired !== undefined) row.min_rating_required = obj.minRatingRequired;
    if (obj.notifyRadiusKm   !== undefined) row.notify_radius_km    = obj.notifyRadiusKm;
    if (obj.sentNotifications !== undefined) row.sent_notifications  = obj.sentNotifications;
    if (obj.isVerified       !== undefined) row.is_verified         = obj.isVerified;
    if (obj.isReported       !== undefined) row.is_reported         = obj.isReported;
    if (obj.reportCount      !== undefined) row.report_count        = obj.reportCount;
    if (obj.expiresAt        !== undefined) row.expires_at          = obj.expiresAt;

    // Flatten nested budget object
    if (obj.budget) {
      if (obj.budget.min      !== undefined) row.budget_min      = obj.budget.min;
      if (obj.budget.max      !== undefined) row.budget_max      = obj.budget.max;
      if (obj.budget.currency !== undefined) row.budget_currency = obj.budget.currency;
    }

    // Flatten nested location object
    if (obj.location) {
      if (obj.location.city    !== undefined) row.location_city    = obj.location.city;
      if (obj.location.country !== undefined) row.location_country = obj.location.country;
      if (obj.location.address !== undefined) row.location_address = obj.location.address;
      if (obj.location.coordinates?.length === 2) {
        const [lng, lat] = obj.location.coordinates;
        row.location = `POINT(${lng} ${lat})`;
      }
    }

    // Flatten nested rating object
    if (obj.rating) {
      if (obj.rating.average !== undefined) row.rating_average = obj.rating.average;
      if (obj.rating.count   !== undefined) row.rating_count   = obj.rating.count;
    }

    return row;
  }

  _toModel(row) {
    if (!row) return null;
    return {
      _id:             row.id,
      id:              row.id,
      userId:          row.user_id,
      title:           row.title            ?? '',
      description:     row.description      ?? '',
      type:            row.type             ?? 'service',
      businessType:    row.business_type    ?? 'none',
      serviceCategory: row.service_category ?? 'none',
      constructionRole: row.construction_role ?? 'none',
      status:          row.status           ?? 'active',
      isAvailable:     row.is_available      ?? true,
      radiusKm:        row.radius_km        ?? 10,
      isNegotiable:    row.is_negotiable    ?? true,
      views:           row.views            ?? 0,
      applications:    row.applications     ?? 0,
      saves:           row.saves            ?? 0,
      tags:            row.tags             ?? [],
      isUrgent:        row.is_urgent        ?? false,
      boosted:         row.boosted          ?? false,
      boostExpiresAt:  row.boost_expires_at,
      requiredSkills:  row.required_skills  ?? [],
      experienceLevel: row.experience_level ?? 'any',
      preferredGender: row.preferred_gender ?? 'any',
      minRatingRequired: row.min_rating_required ?? 0,
      notifyRadiusKm:  row.notify_radius_km  ?? 15,
      sentNotifications: row.sent_notifications ?? 0,
      isVerified:      row.is_verified      ?? false,
      isReported:      row.is_reported      ?? false,
      reportCount:     row.report_count     ?? 0,
      expiresAt:       row.expires_at,
      createdAt:       row.created_at,
      updatedAt:       row.updated_at,
      // Nested objects (restored for controller compatibility)
      budget: {
        min:      row.budget_min      ?? 0,
        max:      row.budget_max      ?? 0,
        currency: row.budget_currency ?? 'USD',
      },
      location: {
        city:    row.location_city    ?? '',
        country: row.location_country ?? '',
        address: row.location_address ?? '',
      },
      rating: {
        average: row.rating_average ?? 0,
        count:   row.rating_count   ?? 0,
      },
      // Populated owner field (from JOIN)
      user: row.profiles ? {
        _id:         row.profiles.id,
        id:          row.profiles.id,
        name:        row.profiles.name,
        profilePhoto: row.profiles.profile_photo,
        profession:  row.profiles.profession,
        role:        row.profiles.role,
        city:        row.profiles.location_city,
      } : undefined,
    };
  }

  // ── Domain methods ────────────────────────────────────────────────────────

  /**
   * Paginated job listing with filters and optional text search.
   * Matches jobService.getJobs() interface exactly.
   */
  async getJobs({
    page = 1,
    limit = 20,
    type = null,
    status = 'active',
    businessType = null,
    serviceCategory = null,
    constructionRole = null,
    isUrgent = null,
    boosted = null,
    userId = null,
    search = '',
    city = null,
  } = {}) {
    const offset = (page - 1) * limit;

    let q = this.db
      .from('jobs')
      .select(`*, profiles:user_id (id, name, profile_photo, profession, role, location_city)`, { count: 'exact' })
      .order('boosted', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status)          q = q.eq('status', status);
    if (type)            q = q.eq('type', type);
    if (businessType)    q = q.eq('business_type', businessType);
    if (serviceCategory) q = q.eq('service_category', serviceCategory);
    if (constructionRole) q = q.eq('construction_role', constructionRole);
    if (isUrgent != null) q = q.eq('is_urgent', isUrgent);
    if (boosted  != null) q = q.eq('boosted', boosted);
    if (userId)          q = q.eq('user_id', userId);
    if (city)            q = q.ilike('location_city', `%${city}%`);
    if (search) {
      const term = search.trim();
      q = q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
    }

    const { data, count, error } = await q;
    this._unwrap({ data, error });

    return {
      jobs: (data || []).map(r => this._toModel(r)),
      total: count ?? 0,
      page,
      limit,
      pages: Math.ceil((count ?? 0) / limit),
    };
  }

  /** Get a single job with owner profile (for detail view). */
  async getJobById(jobId) {
    const { data, error } = await supabase
      .from('jobs')
      .select(`*, profiles:user_id (id, name, profile_photo, profession, role, location_city)`)
      .eq('id', jobId)
      .maybeSingle();
    this._unwrap({ data, error });
    if (!data) {
      const err = new Error('Job not found');
      err.statusCode = 404;
      throw err;
    }
    return this._toModel(data);
  }

  /** Increment the view counter for a job. */
  async incrementViews(jobId) {
    const { error } = await supabase.rpc('jobfast_increment_job_views', { p_job_id: jobId });
    // If the RPC doesn't exist yet, fall back to a read-modify-write (acceptable MVP)
    if (error) {
      const current = await this.findById(jobId);
      if (current) await this.update(jobId, { views: (current.views ?? 0) + 1 });
    }
  }

  /** Boost a job listing until a given date. */
  async boost(jobId, expiresAt) {
    return this.update(jobId, { boosted: true, boostExpiresAt: expiresAt });
  }

  /** Expire boost for jobs past their boostExpiresAt date. */
  async expireBoosts() {
    const { error } = await supabase
      .from('jobs')
      .update({ boosted: false, boost_expires_at: null })
      .eq('boosted', true)
      .lt('boost_expires_at', new Date().toISOString());
    if (error) this._unwrap({ data: null, error });
  }
}

export default new JobRepository();