import express from 'express';
import { usersDatabase } from '../controllers/register.controller.js';
import { calculateDistanceKm } from '../utils/location.js';

const router = express.Router();

/**
 * GET /api/v1/search
 *
 * Query params:
 *   q             — text search (name, profession, role, city)
 *   lat, lng      — caller GPS coords (float); enables distanceKm on results
 *   maxDistance   — filter: max km from caller (requires lat+lng)
 *   availableOnly — filter: 'true' to include only available users
 *   verifiedOnly  — filter: 'true' to include only verified users
 *   minRating     — filter: minimum stats.rating (0–5)
 *   minTrust      — filter: minimum trust_score (0–100)
 *   minExperience — filter: minimum years of experience
 *   language      — filter: exact language code (HT, FR, EN, ES…)
 *   country       — filter: exact country string
 *   serviceZone   — filter: service zone string
 *   page          — pagination page (default 1)
 *   limit         — page size (default 20, max 50)
 *
 * Reads from the in-memory usersDatabase (MVP). Password is stripped.
 * Distance is computed server-side using the Haversine formula from location.js.
 */
router.get('/', (req, res) => {
  const {
    q = '',
    lat,
    lng,
    maxDistance,
    availableOnly,
    verifiedOnly,
    minRating,
    minTrust,
    minExperience,
    language,
    country,
    serviceZone,
    page  = '1',
    limit = '20',
  } = req.query;

  const userLat = lat ? parseFloat(lat) : null;
  const userLng = lng ? parseFloat(lng) : null;
  const hasLocation = Number.isFinite(userLat) && Number.isFinite(userLng);

  // Build candidate list — strip password, attach distanceKm
  let candidates = Array.from(usersDatabase.values()).map((u) => {
    // eslint-disable-next-line no-unused-vars
    const { password, ...safe } = u;

    let distanceKm = null;
    if (hasLocation && u.location?.coordinates) {
      distanceKm = calculateDistanceKm(
        userLat,
        userLng,
        u.location.coordinates.latitude,
        u.location.coordinates.longitude,
      );
    }

    return { ...safe, distanceKm };
  });

  // ── Text search ──────────────────────────────────────────────
  const trimmedQ = q.trim().toLowerCase();
  if (trimmedQ) {
    candidates = candidates.filter((u) =>
      u.name?.toLowerCase().includes(trimmedQ)
      || u.profession?.toLowerCase().includes(trimmedQ)
      || u.role?.toLowerCase().includes(trimmedQ)
      || u.location?.city?.toLowerCase().includes(trimmedQ)
    );
  }

  // ── Availability filter ──────────────────────────────────────
  if (availableOnly === 'true') {
    candidates = candidates.filter((u) => u.availability === 'available');
  }

  // ── Verified filter ──────────────────────────────────────────
  if (verifiedOnly === 'true') {
    candidates = candidates.filter((u) => !!u.verified);
  }

  // ── Distance filter (only when caller sent GPS) ──────────────
  if (maxDistance && hasLocation) {
    const max = parseFloat(maxDistance);
    if (Number.isFinite(max) && max > 0) {
      candidates = candidates.filter(
        (u) => u.distanceKm != null && u.distanceKm <= max,
      );
    }
  }

  // ── Rating filter ────────────────────────────────────────────
  if (minRating) {
    const min = parseFloat(minRating);
    if (Number.isFinite(min)) {
      candidates = candidates.filter(
        (u) => (u.stats?.rating ?? u.rating ?? 0) >= min,
      );
    }
  }

  // ── Trust score filter ───────────────────────────────────────
  if (minTrust) {
    const min = parseFloat(minTrust);
    if (Number.isFinite(min)) {
      candidates = candidates.filter((u) => (u.trust_score ?? 0) >= min);
    }
  }

  // ── Experience filter ────────────────────────────────────────
  if (minExperience) {
    const min = parseFloat(minExperience);
    if (Number.isFinite(min)) {
      candidates = candidates.filter((u) => (u.experience ?? 0) >= min);
    }
  }

  // ── Language filter ──────────────────────────────────────────
  if (language) {
    candidates = candidates.filter((u) => u.language === language);
  }

  // ── Country filter ───────────────────────────────────────────
  if (country) {
    candidates = candidates.filter((u) => u.location?.country === country);
  }

  // ── Service zone filter ──────────────────────────────────────
  if (serviceZone) {
    candidates = candidates.filter((u) => u.serviceZone === serviceZone);
  }

  // ── Reputation-weighted ranking ──────────────────────────────
  // Compute a composite search score for each candidate.
  // Weights: trust(25) + rating(20) + verified(5) + completeness(5) + distance(10) + textMatch(35)
  // Text match is computed prior to filtering so we approximate here via presence of query.
  const MAX_DISTANCE_FOR_SCORE = 50; // km — beyond this distance score = 0

  candidates = candidates.map((u) => {
    const trustNorm       = Math.min(100, u.trust_score ?? u.reputationData?.trustScore ?? 0) / 100;
    const ratingRaw       = u.stats?.rating ?? u.reputationData?.avgRating ?? u.marketplaceData?.avgRating ?? 0;
    const ratingNorm      = Math.max(0, Math.min(5, ratingRaw)) / 5;
    const verifiedBonus   = u.verified ? 1 : 0;
    const completenessNorm = Math.min(100, u.profileCompleteness ?? 0) / 100;
    const distanceScore   = u.distanceKm != null && Number.isFinite(u.distanceKm)
      ? Math.max(0, 1 - u.distanceKm / MAX_DISTANCE_FOR_SCORE)
      : 0.5; // unknown distance gets neutral score

    const searchScore = (
      trustNorm       * 0.25 +
      ratingNorm      * 0.20 +
      verifiedBonus   * 0.05 +
      completenessNorm * 0.05 +
      distanceScore   * 0.10
      // textMatch weight already satisfied by the filter step above
    ) * 100;

    return { ...u, _searchScore: Math.round(searchScore * 10) / 10 };
  });

  // Sort: primary = _searchScore (desc), secondary = availability bonus, tertiary = rating
  candidates.sort((a, b) => {
    const aAvail = a.availability === 'available' ? 5 : 0;
    const bAvail = b.availability === 'available' ? 5 : 0;
    const aScore = (a._searchScore ?? 0) + aAvail;
    const bScore = (b._searchScore ?? 0) + bAvail;
    if (bScore !== aScore) return bScore - aScore;
    const aRating = a.stats?.rating ?? a.reputationData?.avgRating ?? 0;
    const bRating = b.stats?.rating ?? b.reputationData?.avgRating ?? 0;
    return bRating - aRating;
  });

  // ── Pagination ───────────────────────────────────────────────
  const pageNum  = Math.max(1, parseInt(page,  10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const total    = candidates.length;
  const start    = (pageNum - 1) * limitNum;
  const items    = candidates.slice(start, start + limitNum);
  const hasMore  = start + limitNum < total;

  return res.json({
    success: true,
    data: { items, total, page: pageNum, limit: limitNum, hasMore },
  });
});

export default router;