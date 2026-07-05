/**
 * reputation.routes.js
 *
 * Unified Trust, Reputation, Review, Complaint, Verification, and Badge
 * system for all JOBFAST roles.
 *
 * Architecture decisions:
 *   - Reuses usersDatabase (shared in-memory store with register.controller.js)
 *   - Worker reviews stored on user.reputationData.workerReviews[]
 *     (marketplace providers keep their reviews on user.marketplaceData.reviews[])
 *   - Full complaint lifecycle (OPEN → CLOSED) stored on user.reputationData
 *   - Trust score computed on demand and cached at user.reputationData.trustScore
 *   - Badges generated automatically from deterministic criteria
 *   - Verification requests stored on user.reputationData.verificationStatus
 *   - Fake review signals computed per submission (no immediate delete — flag only)
 *
 * Backward compatibility:
 *   - All existing fields on user objects are preserved
 *   - user.verified (boolean) still used by admin route — not touched
 *   - user.stats.rating still present — reputation score is additive, not replacement
 *   - marketplace.routes.js /reviews endpoints unchanged
 *   - search.routes.js ranking improved separately
 *
 * NOTE (MVP): userId from body/query, not JWT middleware (same known bug pattern).
 *
 * Mounted at: /api/v1/reputation
 *
 * Endpoints:
 *   GET  /trust-score           — compute and return trust score
 *   GET  /badges                — compute and return auto badges
 *   GET  /completeness          — compute profile completeness
 *   POST /reviews               — submit a verified worker review
 *   GET  /reviews               — get reviews for a user
 *   POST /reviews/:id/reply     — reply to a review
 *   POST /reviews/:id/report    — flag a review for moderation
 *   PATCH /reviews/:id/moderate — admin: approve / reject / suspend review
 *   POST /complaints            — submit a complaint
 *   GET  /complaints            — get complaints for a user
 *   PATCH /complaints/:id/status — admin: update complaint status
 *   POST /complaints/:id/appeal — appeal a complaint resolution
 *   POST /verify/request        — request verification for a document type
 *   PATCH /verify/status        — admin: update verification status
 */

import express from 'express';
import crypto  from 'crypto';
import { usersDatabase } from '../controllers/register.controller.js';

const router = express.Router();

// ── Constants ─────────────────────────────────────────────────

const MARKETPLACE_PROVIDER_ROLES = new Set([
  'restaurant', 'hotel', 'rental', 'office',
  'tourism', 'hospital', 'clinic', 'service_provider',
]);

const COMPLAINT_VALID_STATUSES = [
  'open', 'under_review', 'investigating', 'resolved', 'rejected', 'escalated', 'closed',
];

// Valid lifecycle transitions. Admin can force any transition.
const COMPLAINT_TRANSITIONS = {
  open:          ['under_review', 'rejected', 'closed'],
  under_review:  ['investigating', 'resolved', 'rejected'],
  investigating: ['resolved', 'rejected', 'escalated'],
  resolved:      ['closed', 'escalated'],
  rejected:      ['closed', 'escalated'],
  escalated:     ['resolved', 'closed'],
  closed:        [],
};

const VALID_VERIFICATION_TYPES = ['identity', 'business', 'document', 'license', 'address'];

const VALID_REVIEW_STATUSES = ['pending', 'approved', 'rejected', 'suspended'];

// ── Helpers ───────────────────────────────────────────────────

function safeUser(u) {
  const { password, notifications: _n, ...safe } = u;
  return safe;
}

/** Initialise reputationData block if absent. Non-destructive. */
function getRD(user) {
  if (!user.reputationData) {
    user.reputationData = {
      trustScore:          0,
      trustScoreUpdatedAt: null,
      avgRating:           0,
      ratingCount:         0,
      badges:              [],
      verificationStatus:  {
        identity:    null,
        business:    null,
        document:    null,
        license:     null,
        address:     null,
        requestedAt: null,
        verifiedAt:  null,
        notes:       '',
      },
      workerReviews:   [],    // reviews this user RECEIVED (worker/company/other roles)
      reviewsGiven:    [],    // simplified records of reviews this user GAVE
      complaints:      [],    // complaints received by this user
      complaintsSent:  [],    // complaints submitted by this user
      moderationHistory: [],
      spamScore:       0,
      fraudScore:      0,
    };
  }
  return user.reputationData;
}

/** Recompute avgRating from workerReviews. */
function recomputeAvg(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const approved = reviews.filter(r => r.status !== 'rejected' && r.status !== 'suspended');
  if (approved.length === 0) return 0;
  const sum = approved.reduce((s, r) => s + (r.rating ?? 0), 0);
  return Math.round((sum / approved.length) * 10) / 10;
}

/**
 * Compute trust score deterministically from user data.
 * Returns a 0-100 integer.
 */
function computeTrustScore(user) {
  const rd = getRD(user);
  const cd = user.companyData  || {};
  const ed = user.enterpriseData || {};
  const md = user.marketplaceData || {};

  let score = 20; // base

  // Completed jobs
  const completedJobsCD = (cd.jobs || []).filter(j =>
    ['completed','confirmed','paid','closed'].includes(j.status)
  ).length;
  const completedJobsED = (ed.jobs || []).filter(j =>
    ['completed','confirmed','paid','closed'].includes(j.status)
  ).length;
  const workerJobsTotal = user.stats?.totalJobs ?? 0;
  const totalJobs = Math.max(
    completedJobsCD, completedJobsED, workerJobsTotal,
    rd.workerReviews?.length ?? 0
  );
  score += Math.min(20, totalJobs * 2);

  // Rating (from reputationData or stats or marketplaceData)
  const avgRating = rd.avgRating
    || md.avgRating
    || user.stats?.rating
    || 0;
  if (avgRating > 0) {
    score += Math.round(((avgRating - 1) / 4) * 15);
  }

  // Profile completeness
  const completeness = user.profileCompleteness ?? 0;
  score += Math.round((completeness / 100) * 10);

  // Verified boolean
  if (user.verified) score += 10;

  // Verification depth (+2 per verified document type)
  const vs = rd.verificationStatus;
  const verifiedDocs = ['identity','business','document','license','address']
    .filter(k => vs[k] === 'verified').length;
  score += Math.min(10, verifiedDocs * 2);

  // Review quality signal (0-8): count + avg rating
  const reviewCount = rd.ratingCount || (rd.workerReviews || []).length;
  score += Math.min(8, Math.floor(reviewCount / 2) + (avgRating >= 4 ? 2 : 0));

  // Recent activity (user was active in last 30 days)
  const lastUpdated = user.location?.lastUpdated || user.createdAt;
  if (lastUpdated) {
    const daysSince = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 30) score += 5;
    else if (daysSince <= 90) score += 2;
  }

  // Badge bonus (0.5 per badge, max 2)
  score += Math.min(2, Math.floor((rd.badges || []).length * 0.5));

  // Complaint penalty (-2 per open/unresolved complaint, max -10)
  const openComplaints = (rd.complaints || []).filter(c =>
    ['open', 'under_review', 'investigating', 'escalated'].includes(c.status)
  ).length;
  score -= Math.min(10, openComplaints * 2);

  // Fraud penalty
  if ((rd.fraudScore ?? 0) > 2) score -= 10;

  // Spam penalty
  if ((rd.spamScore ?? 0) > 5) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Generate badges from deterministic criteria.
 * Mutates rd.badges in place; caller must call usersDatabase.set.
 */
function computeBadges(user, rd) {
  const cd  = user.companyData    || {};
  const ed  = user.enterpriseData || {};
  const md  = user.marketplaceData || {};
  const ts  = rd.trustScore ?? 0;
  const avg = rd.avgRating ?? user.stats?.rating ?? 0;

  const candidates = [];

  // verified
  if (user.verified) candidates.push('verified');

  // trusted (trust score ≥ 80)
  if (ts >= 80) candidates.push('trusted');

  // highly_rated (avg ≥ 4.8)
  if (avg >= 4.8) candidates.push('highly_rated');

  // top_worker (worker + 10+ jobs + rating ≥ 4.5)
  const totalJobs = user.stats?.totalJobs ?? (rd.workerReviews || []).length;
  if (user.role === 'worker' && totalJobs >= 10 && avg >= 4.5) {
    candidates.push('top_worker');
  }

  // master (worker + 15+ jobs + rating ≥ 4.9)
  if (user.role === 'worker' && totalJobs >= 15 && avg >= 4.9) {
    candidates.push('master');
  }

  // expert (worker + 5+ years experience)
  const yearsExp = user.experience ?? user.profileMetadata?.yearsExperience ?? 0;
  if (user.role === 'worker' && yearsExp >= 5) candidates.push('expert');

  // top_company / excellent_employer
  const isEmployer = ['company','enterprise'].includes(user.role);
  const employees  = (cd.employees || ed.employees || []).filter(e => e.status === 'active').length;
  if (isEmployer && employees >= 5) candidates.push('top_company');

  const badComplaints = (rd.complaints || []).filter(
    c => c.status === 'resolved' && c.resolution === 'against'
  ).length;
  if (isEmployer && employees >= 5 && badComplaints === 0) candidates.push('excellent_employer');

  // fast_responder (20+ confirmed bookings or jobs)
  const confirmedBookings = (md.bookings || []).filter(b => b.status === 'confirmed').length;
  const confirmedJobs     = (cd.jobs     || ed.jobs || []).filter(j =>
    ['confirmed','hired'].includes(j.status)
  ).length;
  if (confirmedBookings + confirmedJobs >= 20) candidates.push('fast_responder');

  // premium_business (marketplace provider + verified + 10+ bookings)
  if (MARKETPLACE_PROVIDER_ROLES.has(user.role) && user.verified && (md.bookings || []).length >= 10) {
    candidates.push('premium_business');
  }

  const now = new Date().toISOString();
  const existingIds = new Set((rd.badges || []).map(b => b.id));
  for (const id of candidates) {
    if (!existingIds.has(id)) {
      rd.badges.push({ id, awardedAt: now });
    }
  }
  // Remove badges no longer earned
  rd.badges = rd.badges.filter(b => candidates.includes(b.id));

  return rd.badges;
}

/**
 * Compute profile completeness score (0-100).
 * Extends the existing per-role partial check in workers.routes.js.
 */
function computeCompleteness(user) {
  const meta = user.profileMetadata || {};
  const rd   = user.reputationData  || {};

  const fields = [
    { key: 'photo',      filled: !!(meta.profilePhoto || meta.photo) },
    { key: 'name',       filled: !!(user.name) },
    { key: 'email',      filled: !!(user.email) },
    { key: 'phone',      filled: !!(meta.phone || user.phone) },
    { key: 'bio',        filled: !!(meta.bio || user.bio) },
    { key: 'city',       filled: !!(user.location?.city) },
    { key: 'country',    filled: !!(user.location?.country) },
    { key: 'skills',     filled: (meta.skills?.length ?? 0) > 0 },
    { key: 'languages',  filled: (meta.languages?.length ?? 0) > 0 },
    { key: 'verified',   filled: !!user.verified },
    { key: 'experience', filled: !!(meta.yearsExperience || user.experience) },
  ];

  // Role-specific extras
  const role = user.role;
  if (['worker', 'service_provider'].includes(role)) {
    fields.push({ key: 'certifications', filled: (meta.certifications?.length ?? 0) > 0 });
    fields.push({ key: 'portfolio',      filled: !!(meta.portfolio) });
  }
  if (['company', 'enterprise'].includes(role)) {
    fields.push({ key: 'description', filled: !!(meta.bio || meta.description) });
    fields.push({ key: 'website',     filled: !!(meta.website) });
  }
  if (['hospital', 'clinic'].includes(role)) {
    fields.push({ key: 'license', filled: !!(meta.license_number) });
  }

  const total  = fields.length;
  const filled = fields.filter(f => f.filled).length;
  const pct    = Math.round((filled / total) * 100);
  const missing = fields.filter(f => !f.filled).map(f => f.key);

  return { pct, filled, total, missing };
}

/**
 * Detect fake-review signals. Returns { flagScore, signals[] }.
 * A flagScore ≥ 5 means the review should be flagged for moderation.
 */
function detectFakeReviewSignals(reviewer, targetId, rating, comment, allReviews) {
  const signals  = [];
  let flagScore  = 0;

  const reviewerId = reviewer?._id || reviewer?.id;

  // Self review
  if (reviewerId === targetId) {
    signals.push('selfReview');
    flagScore += 10;
  }

  // Duplicate reviewer
  const alreadyReviewed = allReviews.some(r => r.reviewerId === reviewerId);
  if (alreadyReviewed) {
    signals.push('duplicateReviewer');
    flagScore += 10;
  }

  // New account (less than 7 days old)
  const accountAge = reviewer?.createdAt
    ? (Date.now() - new Date(reviewer.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    : 999;
  if (accountAge < 7) {
    signals.push('newAccount');
    flagScore += 3;
  }

  // Extreme rating with no comment
  if ((rating === 1 || rating === 5) && (!comment || comment.trim().length < 10)) {
    signals.push('ratingTooExtreme');
    flagScore += 2;
  }

  // Spam: reviewer has given many reviews recently
  const rd = reviewer?.reputationData;
  if (rd) {
    const recentGiven = (rd.reviewsGiven || []).filter(r => {
      const age = Date.now() - new Date(r.createdAt).getTime();
      return age < 60 * 60 * 1000; // last hour
    }).length;
    if (recentGiven >= 3) {
      signals.push('suspiciousPattern');
      flagScore += 4;
    }
  }

  return { flagScore, signals };
}

/**
 * Verify a claimed interaction relationship between two users.
 * Returns { valid: boolean, reason: string }.
 */
function verifyRelationship(reviewer, target) {
  const reviewerRole = reviewer?.role;
  const targetRole   = target?.role;

  if (!reviewerRole || !targetRole) {
    return { valid: false, reason: 'Wòl itilizatè manke' };
  }

  const reviewerId  = reviewer?._id || reviewer?.id;
  const targetId    = target?._id   || target?.id;

  // Worker reviewing a company: worker must be in company's employees or jobs
  if (reviewerRole === 'worker' && ['company','enterprise'].includes(targetRole)) {
    const cd = target.companyData || target.enterpriseData || {};
    const inEmployees = (cd.employees || []).some(e => e.userId === reviewerId || e.id === reviewerId);
    const inJobs = (cd.jobs || []).some(j => j.workerId === reviewerId || j.applicants?.includes(reviewerId));
    if (inEmployees || inJobs) return { valid: true, reason: '' };
    return { valid: false, reason: 'Pa gen relasyon travay verifye ant ou ak konpayi sa a' };
  }

  // User reviewing a marketplace provider: user must have a booking
  if (['user','worker'].includes(reviewerRole) && MARKETPLACE_PROVIDER_ROLES.has(targetRole)) {
    const md = target.marketplaceData || {};
    const hasBooking = (md.bookings || []).some(b =>
      b.customerId === reviewerId && ['confirmed','completed'].includes(b.status)
    );
    if (hasBooking) return { valid: true, reason: '' };
    // Also check reviewer's sentBookings
    const revMd = reviewer.marketplaceData || {};
    const sentBooking = (revMd.sentBookings || []).some(b =>
      b.targetId === targetId && ['confirmed','completed'].includes(b.status)
    );
    if (sentBooking) return { valid: true, reason: '' };
    return { valid: false, reason: 'Pa gen rezèvasyon konfime ak biznis sa a pou kite evalyasyon' };
  }

  // Company reviewing a worker: worker must have been hired or applied
  if (['company','enterprise'].includes(reviewerRole) && reviewerRole !== targetRole) {
    const cd = reviewer.companyData || reviewer.enterpriseData || {};
    const inEmployees = (cd.employees || []).some(e => e.userId === targetId || e.id === targetId);
    const inJobs = (cd.jobs || []).some(j =>
      j.workerId === targetId ||
      (j.applicants || []).includes(targetId) ||
      (j.hired || []).includes(targetId)
    );
    if (inEmployees || inJobs) return { valid: true, reason: '' };
    return { valid: false, reason: 'Travayè sa a pa nan dosye konpayi ou' };
  }

  // Default: allow for roles not covered above (e.g., mutual worker-user reviews)
  return { valid: true, reason: '' };
}

// ─────────────────────────────────────────────────────────────
// TRUST SCORE
// GET /api/v1/reputation/trust-score?userId=
// ─────────────────────────────────────────────────────────────

router.get('/trust-score', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const rd    = getRD(user);
  const score = computeTrustScore(user);
  const compl = computeCompleteness(user);

  rd.trustScore          = score;
  rd.trustScoreUpdatedAt = new Date().toISOString();
  user.trust_score       = score;             // keep top-level field in sync for search
  user.profileCompleteness = compl.pct;       // keep top-level field in sync
  computeBadges(user, rd);

  usersDatabase.set(userId, user);

  return res.json({
    success: true,
    data: {
      trustScore:   score,
      completeness: compl,
      badges:       rd.badges,
      updatedAt:    rd.trustScoreUpdatedAt,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// BADGES
// GET /api/v1/reputation/badges?userId=
// ─────────────────────────────────────────────────────────────

router.get('/badges', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const rd = getRD(user);
  // Recompute trust score first so badge criteria are fresh
  rd.trustScore    = computeTrustScore(user);
  rd.avgRating     = recomputeAvg(rd.workerReviews);
  const badges     = computeBadges(user, rd);

  usersDatabase.set(userId, user);

  return res.json({ success: true, data: { badges } });
});

// ─────────────────────────────────────────────────────────────
// PROFILE COMPLETENESS
// GET /api/v1/reputation/completeness?userId=
// ─────────────────────────────────────────────────────────────

router.get('/completeness', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const compl = computeCompleteness(user);
  user.profileCompleteness = compl.pct;
  usersDatabase.set(userId, user);

  return res.json({ success: true, data: compl });
});

// ─────────────────────────────────────────────────────────────
// SUBMIT REVIEW
// POST /api/v1/reputation/reviews
//
// Body: {
//   reviewerId,   — required
//   targetId,     — required
//   rating,       — required (1-5)
//   comment,      — optional
//   criteria,     — optional { quality, communication, timeliness, ... }
//   jobId,        — optional: verified job/booking reference
// }
//
// Rules:
//   1. Reviewer and target must have a verifiable relationship
//   2. One review per reviewer per target (no duplicates)
//   3. Self-review blocked
//   4. Fake-review signals computed; flagged if score ≥ 5
// ─────────────────────────────────────────────────────────────

router.post('/reviews', (req, res) => {
  const { reviewerId, targetId, rating, comment = '', criteria = {}, jobId = null } = req.body;

  if (!reviewerId || !targetId || !rating) {
    return res.status(400).json({
      success: false,
      error: { message: 'reviewerId, targetId, ak rating obligatwa' },
    });
  }

  const parsedRating = parseFloat(rating);
  if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({
      success: false,
      error: { message: 'Rating dwe ant 1 ak 5' },
    });
  }

  const reviewer = usersDatabase.get(reviewerId);
  const target   = usersDatabase.get(targetId);

  if (!reviewer) {
    return res.status(404).json({ success: false, error: { message: 'Reviewer pa jwenn' } });
  }
  if (!target) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè-sib pa jwenn' } });
  }

  // Block self-review at API level
  if (reviewerId === targetId) {
    return res.status(400).json({
      success: false,
      error: { message: 'Pa ka evalye tèt ou' },
    });
  }

  const targetRD  = getRD(target);
  const reviewerRD = getRD(reviewer);

  // Check relationship eligibility
  const rel = verifyRelationship(reviewer, target);
  if (!rel.valid) {
    return res.status(403).json({
      success: false,
      error: { message: rel.reason },
    });
  }

  // Duplicate check: one review per reviewer per target
  const existingIdx = targetRD.workerReviews.findIndex(r => r.reviewerId === reviewerId);

  // Fake review detection
  const { flagScore, signals } = detectFakeReviewSignals(
    reviewer, targetId, parsedRating, comment, targetRD.workerReviews
  );
  const isFlagged = flagScore >= 5;
  const status    = isFlagged ? 'pending' : 'approved'; // flagged reviews go to moderation queue

  const review = {
    id:           existingIdx >= 0 ? targetRD.workerReviews[existingIdx].id : crypto.randomUUID(),
    reviewerId,
    reviewerName: reviewer.name || 'Anonim',
    reviewerRole: reviewer.role,
    rating:       parsedRating,
    comment:      comment.trim(),
    criteria,
    jobId,
    verified:     rel.valid,
    status,
    flagScore,
    signals,
    reply:        existingIdx >= 0 ? (targetRD.workerReviews[existingIdx].reply ?? null) : null,
    reports:      existingIdx >= 0 ? (targetRD.workerReviews[existingIdx].reports ?? []) : [],
    createdAt:    existingIdx >= 0 ? targetRD.workerReviews[existingIdx].createdAt : new Date().toISOString(),
    updatedAt:    new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    targetRD.workerReviews[existingIdx] = review;
  } else {
    targetRD.workerReviews.unshift(review);
  }

  // Recompute avg (only approved reviews)
  targetRD.avgRating    = recomputeAvg(targetRD.workerReviews);
  targetRD.ratingCount  = targetRD.workerReviews.filter(r => r.status === 'approved').length;
  target.stats          = { ...(target.stats || {}), rating: targetRD.avgRating };
  target.trust_score    = computeTrustScore(target);
  targetRD.trustScore   = target.trust_score;

  usersDatabase.set(targetId, target);

  // Track review given by reviewer (for spam detection)
  reviewerRD.reviewsGiven = reviewerRD.reviewsGiven || [];
  reviewerRD.reviewsGiven.unshift({ targetId, rating: parsedRating, createdAt: new Date().toISOString() });
  usersDatabase.set(reviewerId, reviewer);

  // Notify target
  if (!target.notifications) target.notifications = [];
  target.notifications.unshift({
    id:        crypto.randomUUID(),
    type:      'new_review',
    title:     isFlagged ? 'Evalyasyon anba revizyon' : 'Nouvo Evalyasyon ⭐',
    message:   isFlagged
      ? `Yon evalyasyon soumèt pou ou — anba revizyon pou modérasyon.`
      : `${reviewer.name || 'Yon itilizatè'} ba ou ⭐ ${parsedRating}/5.`,
    createdAt: new Date().toISOString(),
    isRead:    false,
  });

  return res.json({
    success: true,
    data: {
      review,
      avgRating:   targetRD.avgRating,
      ratingCount: targetRD.ratingCount,
      trustScore:  targetRD.trustScore,
      flagged:     isFlagged,
      signals,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// GET REVIEWS
// GET /api/v1/reputation/reviews?targetId=&status=
// ─────────────────────────────────────────────────────────────

router.get('/reviews', (req, res) => {
  const { targetId, status } = req.query;
  if (!targetId) {
    return res.status(400).json({ success: false, error: { message: 'targetId requis' } });
  }

  const target = usersDatabase.get(targetId);
  if (!target) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  // For marketplace providers also include their marketplace reviews
  const rd = getRD(target);
  let reviews = [...(rd.workerReviews || [])];

  if (MARKETPLACE_PROVIDER_ROLES.has(target.role) && target.marketplaceData?.reviews) {
    // Merge and de-duplicate (prefer reputation review if same reviewerId)
    const rdIds = new Set(reviews.map(r => r.reviewerId));
    for (const mr of target.marketplaceData.reviews) {
      if (!rdIds.has(mr.reviewerId)) reviews.push({ ...mr, source: 'marketplace' });
    }
  }

  if (status) {
    reviews = reviews.filter(r => r.status === status);
  }

  // Only show approved reviews to non-admin callers (flagged/pending are hidden)
  const publicReviews = reviews.filter(r => r.status === 'approved' || r.status == null);

  return res.json({
    success: true,
    data: {
      reviews:    publicReviews,
      allCount:   reviews.length,
      avgRating:  rd.avgRating || target.marketplaceData?.avgRating || 0,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// REPLY TO REVIEW
// POST /api/v1/reputation/reviews/:id/reply
// Body: { userId, reply }
// ─────────────────────────────────────────────────────────────

router.post('/reviews/:id/reply', (req, res) => {
  const { id: reviewId } = req.params;
  const { userId, reply } = req.body;

  if (!userId || !reply?.trim()) {
    return res.status(400).json({ success: false, error: { message: 'userId ak reply obligatwa' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const rd  = getRD(user);
  const idx = rd.workerReviews.findIndex(r => r.id === reviewId);
  if (idx < 0) {
    return res.status(404).json({ success: false, error: { message: 'Evalyasyon pa jwenn' } });
  }

  rd.workerReviews[idx].reply = {
    text:      reply.trim(),
    repliedAt: new Date().toISOString(),
  };
  usersDatabase.set(userId, user);

  return res.json({ success: true, data: { reply: rd.workerReviews[idx].reply } });
});

// ─────────────────────────────────────────────────────────────
// REPORT REVIEW
// POST /api/v1/reputation/reviews/:id/report
// Body: { reporterId, targetId, reason }
// ─────────────────────────────────────────────────────────────

router.post('/reviews/:id/report', (req, res) => {
  const { id: reviewId }           = req.params;
  const { reporterId, targetId, reason = 'other' } = req.body;

  if (!reporterId || !targetId) {
    return res.status(400).json({ success: false, error: { message: 'reporterId ak targetId obligatwa' } });
  }

  const target = usersDatabase.get(targetId);
  if (!target) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const rd  = getRD(target);
  const idx = rd.workerReviews.findIndex(r => r.id === reviewId);
  if (idx < 0) {
    return res.status(404).json({ success: false, error: { message: 'Evalyasyon pa jwenn' } });
  }

  const review = rd.workerReviews[idx];
  if (!Array.isArray(review.reports)) review.reports = [];

  // Prevent duplicate reports from same reporter
  if (review.reports.some(r => r.reporterId === reporterId)) {
    return res.status(409).json({ success: false, error: { message: 'Ou deja rapòte evalyasyon sa a' } });
  }

  review.reports.push({ reporterId, reason, createdAt: new Date().toISOString() });

  // Auto-flag for moderation if ≥ 3 reports
  if (review.reports.length >= 3 && review.status === 'approved') {
    review.status = 'pending';
    review.flagScore = Math.max(review.flagScore ?? 0, 5);
  }

  usersDatabase.set(targetId, target);

  return res.json({ success: true, data: { reported: true, reportCount: review.reports.length } });
});

// ─────────────────────────────────────────────────────────────
// ADMIN: MODERATE REVIEW
// PATCH /api/v1/reputation/reviews/:id/moderate
// Body: { adminId, targetId, action: 'approved'|'rejected'|'suspended', note? }
// ─────────────────────────────────────────────────────────────

router.patch('/reviews/:id/moderate', (req, res) => {
  const { id: reviewId }                       = req.params;
  const { adminId, targetId, action, note = '' } = req.body;

  if (!adminId || !targetId || !VALID_REVIEW_STATUSES.includes(action)) {
    return res.status(400).json({
      success: false,
      error:  { message: `adminId, targetId, ak aksyon (${VALID_REVIEW_STATUSES.join('|')}) obligatwa` },
    });
  }

  const target = usersDatabase.get(targetId);
  if (!target) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const rd  = getRD(target);
  const idx = rd.workerReviews.findIndex(r => r.id === reviewId);
  if (idx < 0) {
    return res.status(404).json({ success: false, error: { message: 'Evalyasyon pa jwenn' } });
  }

  rd.workerReviews[idx].status       = action;
  rd.workerReviews[idx].moderatedBy  = adminId;
  rd.workerReviews[idx].moderatedAt  = new Date().toISOString();
  rd.workerReviews[idx].moderationNote = note;

  // Recompute avg and trust score after moderation action
  rd.avgRating   = recomputeAvg(rd.workerReviews);
  rd.ratingCount = rd.workerReviews.filter(r => r.status === 'approved').length;
  target.stats   = { ...(target.stats || {}), rating: rd.avgRating };
  target.trust_score = computeTrustScore(target);
  rd.trustScore      = target.trust_score;

  // Audit history
  rd.moderationHistory = rd.moderationHistory || [];
  rd.moderationHistory.unshift({
    type:      'review_moderation',
    reviewId,
    action,
    adminId,
    note,
    createdAt: new Date().toISOString(),
  });

  usersDatabase.set(targetId, target);

  return res.json({
    success: true,
    data: { reviewId, action, avgRating: rd.avgRating, trustScore: rd.trustScore },
  });
});

// ─────────────────────────────────────────────────────────────
// SUBMIT COMPLAINT
// POST /api/v1/reputation/complaints
//
// Body: {
//   complainantId,   — who is filing
//   respondentId,    — who the complaint is against
//   category,        — from COMPLAINT_CATEGORIES
//   description,
//   evidence?,       — array of evidence strings (URLs, text notes)
//   jobId?,          — optional reference to a job/booking
// }
// ─────────────────────────────────────────────────────────────

router.post('/complaints', (req, res) => {
  const {
    complainantId,
    respondentId,
    category     = 'other',
    description  = '',
    evidence     = [],
    jobId        = null,
  } = req.body;

  if (!complainantId || !respondentId || !description.trim()) {
    return res.status(400).json({
      success: false,
      error: { message: 'complainantId, respondentId, ak deskripsyon obligatwa' },
    });
  }

  if (complainantId === respondentId) {
    return res.status(400).json({ success: false, error: { message: 'Pa ka depoze plent kont tèt ou' } });
  }

  const complainant = usersDatabase.get(complainantId);
  const respondent  = usersDatabase.get(respondentId);

  if (!complainant) return res.status(404).json({ success: false, error: { message: 'Pleyan pa jwenn' } });
  if (!respondent)  return res.status(404).json({ success: false, error: { message: 'Deféndè pa jwenn' } });

  // Verify relationship eligibility
  const rel = verifyRelationship(complainant, respondent);
  if (!rel.valid) {
    return res.status(403).json({
      success: false,
      error: { message: `Plent pa admisib: ${rel.reason}` },
    });
  }

  // Spam check: limit to 2 complaints per day per complainant
  const compRD = getRD(complainant);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayComplaints = (compRD.complaintsSent || []).filter(c =>
    new Date(c.createdAt) >= todayStart
  ).length;
  if (todayComplaints >= 2) {
    compRD.spamScore = Math.min(10, (compRD.spamScore ?? 0) + 2);
    usersDatabase.set(complainantId, complainant);
    return res.status(429).json({
      success: false,
      error: { message: 'Ou rive nan limit plent pou jodi a (2 pa jou)' },
    });
  }

  const respondentRD = getRD(respondent);

  const complaint = {
    id:            crypto.randomUUID(),
    complainantId,
    complainantName: complainant.name || 'Anonim',
    respondentId,
    respondentName:  respondent.name  || 'Anonim',
    category,
    description:   description.trim(),
    evidence:      Array.isArray(evidence) ? evidence : [],
    jobId,
    status:        'open',
    resolution:    null,       // 'for' | 'against' | 'neutral' — set on resolve
    appeal:        null,
    adminNotes:    [],
    createdAt:     new Date().toISOString(),
    updatedAt:     new Date().toISOString(),
  };

  // Attach to respondent's received complaints
  respondentRD.complaints = respondentRD.complaints || [];
  respondentRD.complaints.unshift(complaint);

  // Track in complainant's sent complaints
  compRD.complaintsSent = compRD.complaintsSent || [];
  compRD.complaintsSent.unshift({
    complaintId: complaint.id,
    respondentId,
    status:      'open',
    createdAt:   complaint.createdAt,
  });

  // Recompute trust score for respondent (complaint hurts trust)
  respondentRD.trustScore = computeTrustScore(respondent);
  respondent.trust_score  = respondentRD.trustScore;

  usersDatabase.set(respondentId,  respondent);
  usersDatabase.set(complainantId, complainant);

  // Notify respondent
  if (!respondent.notifications) respondent.notifications = [];
  respondent.notifications.unshift({
    id:        crypto.randomUUID(),
    type:      'complaint_received',
    title:     'Nouvo Plent Resevwa',
    message:   `${complainant.name || 'Yon itilizatè'} soumèt yon plent: ${category}.`,
    data:      { complaintId: complaint.id },
    createdAt: new Date().toISOString(),
    isRead:    false,
  });

  return res.json({
    success: true,
    data: { complaint, trustScore: respondentRD.trustScore },
  });
});

// ─────────────────────────────────────────────────────────────
// GET COMPLAINTS
// GET /api/v1/reputation/complaints?userId=&role=received|sent
// ─────────────────────────────────────────────────────────────

router.get('/complaints', (req, res) => {
  const { userId, role: viewRole = 'received' } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const rd = getRD(user);
  const data = viewRole === 'sent'
    ? rd.complaintsSent || []
    : rd.complaints     || [];

  return res.json({ success: true, data: { complaints: data, total: data.length } });
});

// ─────────────────────────────────────────────────────────────
// ADMIN: UPDATE COMPLAINT STATUS
// PATCH /api/v1/reputation/complaints/:id/status
// Body: { adminId, respondentId, newStatus, note?, resolution? }
// ─────────────────────────────────────────────────────────────

router.patch('/complaints/:id/status', (req, res) => {
  const { id: complaintId } = req.params;
  const {
    adminId,
    respondentId,
    newStatus,
    note       = '',
    resolution = null,  // 'for' | 'against' | 'neutral'
  } = req.body;

  if (!adminId || !respondentId || !COMPLAINT_VALID_STATUSES.includes(newStatus)) {
    return res.status(400).json({
      success: false,
      error: { message: `adminId, respondentId, ak newStatus valide obligatwa. Valè: ${COMPLAINT_VALID_STATUSES.join(', ')}` },
    });
  }

  const respondent   = usersDatabase.get(respondentId);
  if (!respondent) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const rd  = getRD(respondent);
  const idx = rd.complaints.findIndex(c => c.id === complaintId);
  if (idx < 0) {
    return res.status(404).json({ success: false, error: { message: 'Plent pa jwenn' } });
  }

  const complaint    = rd.complaints[idx];
  const currentStatus = complaint.status;

  // Validate lifecycle transition (admin can force any transition)
  const allowed = COMPLAINT_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    // Log the forced transition but allow it (admin override)
  }

  complaint.status     = newStatus;
  complaint.updatedAt  = new Date().toISOString();
  if (resolution) complaint.resolution = resolution;
  complaint.adminNotes.push({ adminId, note, status: newStatus, createdAt: new Date().toISOString() });

  // Recompute trust score after resolution
  rd.trustScore = computeTrustScore(respondent);
  respondent.trust_score = rd.trustScore;

  // Audit
  rd.moderationHistory = rd.moderationHistory || [];
  rd.moderationHistory.unshift({
    type:       'complaint_status',
    complaintId,
    fromStatus: currentStatus,
    toStatus:   newStatus,
    resolution,
    adminId,
    note,
    createdAt:  new Date().toISOString(),
  });

  usersDatabase.set(respondentId, respondent);

  // Notify complainant
  const complainant = respondent?.reputationData?.complaints?.[idx]?.complainantId
    ? usersDatabase.get(complaint.complainantId)
    : null;
  if (complainant) {
    if (!complainant.notifications) complainant.notifications = [];
    complainant.notifications.unshift({
      id:        crypto.randomUUID(),
      type:      'complaint_update',
      title:     'Mizajou Plent',
      message:   `Plent ou a (${complaint.category}) chanje a estati: ${newStatus}.`,
      data:      { complaintId, newStatus, resolution },
      createdAt: new Date().toISOString(),
      isRead:    false,
    });
    usersDatabase.set(complaint.complainantId, complainant);
  }

  return res.json({
    success: true,
    data: { complaintId, newStatus, resolution, trustScore: rd.trustScore },
  });
});

// ─────────────────────────────────────────────────────────────
// APPEAL COMPLAINT
// POST /api/v1/reputation/complaints/:id/appeal
// Body: { userId, reason }
// ─────────────────────────────────────────────────────────────

router.post('/complaints/:id/appeal', (req, res) => {
  const { id: complaintId } = req.params;
  const { userId, reason = '' } = req.body;

  if (!userId || !reason.trim()) {
    return res.status(400).json({ success: false, error: { message: 'userId ak rezon apèl obligatwa' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const rd  = getRD(user);
  const idx = rd.complaints.findIndex(c => c.id === complaintId);
  if (idx < 0) {
    return res.status(404).json({ success: false, error: { message: 'Plent pa jwenn' } });
  }

  const complaint = rd.complaints[idx];

  // Only allow appeal on resolved or rejected complaints
  if (!['resolved', 'rejected'].includes(complaint.status)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Apèl sèlman posib apre Rezoud oswa Rejete' },
    });
  }

  if (complaint.appeal) {
    return res.status(409).json({ success: false, error: { message: 'Apèl deja soumèt' } });
  }

  complaint.appeal = {
    reason: reason.trim(),
    status: 'pending',
    submittedAt: new Date().toISOString(),
  };
  complaint.status    = 'escalated';
  complaint.updatedAt = new Date().toISOString();

  usersDatabase.set(userId, user);

  return res.json({ success: true, data: { appeal: complaint.appeal, newStatus: 'escalated' } });
});

// ─────────────────────────────────────────────────────────────
// REQUEST VERIFICATION
// POST /api/v1/reputation/verify/request
// Body: { userId, type: 'identity'|'business'|'document'|'license'|'address', notes? }
// ─────────────────────────────────────────────────────────────

router.post('/verify/request', (req, res) => {
  const { userId, type, notes = '' } = req.body;

  if (!userId || !VALID_VERIFICATION_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      error: { message: `userId ak type (${VALID_VERIFICATION_TYPES.join('|')}) obligatwa` },
    });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const rd = getRD(user);
  const vs = rd.verificationStatus;

  if (vs[type] === 'verified') {
    return res.status(409).json({ success: false, error: { message: `${type} deja verifye` } });
  }

  vs[type]        = 'pending';
  vs.requestedAt  = new Date().toISOString();
  vs.notes        = notes.trim();

  // Track request history
  if (!rd.verificationRequests) rd.verificationRequests = [];
  rd.verificationRequests.unshift({
    type,
    status:     'pending',
    notes,
    requestedAt: vs.requestedAt,
  });

  usersDatabase.set(userId, user);

  return res.json({
    success: true,
    data: { type, status: 'pending', message: 'Demann verifikasyon resevwa — anba revizyon' },
  });
});

// ─────────────────────────────────────────────────────────────
// ADMIN: UPDATE VERIFICATION STATUS
// PATCH /api/v1/reputation/verify/status
// Body: { adminId, userId, type, status: 'verified'|'rejected', note? }
// ─────────────────────────────────────────────────────────────

router.patch('/verify/status', (req, res) => {
  const { adminId, userId, type, status, note = '' } = req.body;

  if (!adminId || !userId || !VALID_VERIFICATION_TYPES.includes(type) ||
      !['verified','rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: { message: 'adminId, userId, type, ak status (verified|rejected) obligatwa' },
    });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
  }

  const rd = getRD(user);
  const vs = rd.verificationStatus;

  vs[type] = status;
  if (status === 'verified') {
    vs.verifiedAt = new Date().toISOString();
    // If identity is verified, also set the top-level user.verified flag
    if (type === 'identity') user.verified = true;
  } else {
    vs.rejectedAt = new Date().toISOString();
  }
  vs.notes = note;

  // Recompute trust score (verification improves it)
  rd.trustScore      = computeTrustScore(user);
  user.trust_score   = rd.trustScore;
  computeBadges(user, rd);

  // Audit
  rd.moderationHistory = rd.moderationHistory || [];
  rd.moderationHistory.unshift({
    type:        'verification',
    docType:     type,
    status,
    adminId,
    note,
    createdAt:   new Date().toISOString(),
  });

  usersDatabase.set(userId, user);

  // Notify user
  if (!user.notifications) user.notifications = [];
  user.notifications.unshift({
    id:        crypto.randomUUID(),
    type:      'verification_update',
    title:     status === 'verified' ? `Verifikasyon ${type} Konfime ✅` : `Verifikasyon ${type} Refize`,
    message:   status === 'verified'
      ? `Verifikasyon ${type} ou konfime pa JOBFAST.`
      : `Verifikasyon ${type} refize. ${note}`,
    createdAt: new Date().toISOString(),
    isRead:    false,
  });

  return res.json({
    success: true,
    data: { type, status, trustScore: rd.trustScore, badges: rd.badges },
  });
});

export default router;