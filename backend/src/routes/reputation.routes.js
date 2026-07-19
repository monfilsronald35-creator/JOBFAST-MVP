/**
 * reputation.routes.js — Supabase (migrated from in-memory usersDatabase)
 * All user data stored in profiles.reputation_data JSONB. Read-modify-write
 * pattern is used throughout (acceptable for MVP scale).
 * Mounted at: /api/v1/reputation
 */

import express from 'express';
import crypto  from 'crypto';
import userRepo from '../repositories/user.repository.js';
import notificationRepo from '../repositories/notification.repository.js';

const router = express.Router();

// ── Constants ─────────────────────────────────────────────────

const MARKETPLACE_PROVIDER_ROLES = new Set([
  'restaurant', 'hotel', 'rental', 'office',
  'tourism', 'hospital', 'clinic', 'service_provider',
]);

const COMPLAINT_VALID_STATUSES = [
  'open', 'under_review', 'investigating', 'resolved', 'rejected', 'escalated', 'closed',
];

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
const VALID_REVIEW_STATUSES    = ['pending', 'approved', 'rejected', 'suspended'];

// ── Helpers ───────────────────────────────────────────────────

function getRD(user) {
  if (!user.reputationData || !Array.isArray(user.reputationData.workerReviews)) {
    return {
      trustScore:          0,
      trustScoreUpdatedAt: null,
      avgRating:           0,
      ratingCount:         0,
      badges:              [],
      verificationStatus:  {
        identity: null, business: null, document: null,
        license: null, address: null,
        requestedAt: null, verifiedAt: null, notes: '',
      },
      workerReviews:     [],
      reviewsGiven:      [],
      complaints:        [],
      complaintsSent:    [],
      moderationHistory: [],
      spamScore:         0,
      fraudScore:        0,
    };
  }
  return user.reputationData;
}

function recomputeAvg(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const approved = reviews.filter(r => r.status !== 'rejected' && r.status !== 'suspended');
  if (approved.length === 0) return 0;
  const sum = approved.reduce((s, r) => s + (r.rating ?? 0), 0);
  return Math.round((sum / approved.length) * 10) / 10;
}

function computeTrustScore(user) {
  const rd = getRD(user);
  const cd = user.companyData    || {};
  const ed = user.enterpriseData || {};
  const md = user.marketplaceData || {};

  let score = 20;

  const completedJobsCD  = (cd.jobs || []).filter(j => ['completed','confirmed','paid','closed'].includes(j.status)).length;
  const completedJobsED  = (ed.jobs || []).filter(j => ['completed','confirmed','paid','closed'].includes(j.status)).length;
  const workerJobsTotal  = user.stats?.totalJobs ?? 0;
  const totalJobs = Math.max(completedJobsCD, completedJobsED, workerJobsTotal, rd.workerReviews?.length ?? 0);
  score += Math.min(20, totalJobs * 2);

  const avgRating = rd.avgRating || md.avgRating || user.stats?.rating || 0;
  if (avgRating > 0) score += Math.round(((avgRating - 1) / 4) * 15);

  const completeness = user.profileCompleteness ?? 0;
  score += Math.round((completeness / 100) * 10);

  if (user.verified) score += 10;

  const vs = rd.verificationStatus || {};
  const verifiedDocs = ['identity','business','document','license','address']
    .filter(k => vs[k] === 'verified').length;
  score += Math.min(10, verifiedDocs * 2);

  const reviewCount = rd.ratingCount || (rd.workerReviews || []).length;
  score += Math.min(8, Math.floor(reviewCount / 2) + (avgRating >= 4 ? 2 : 0));

  // Use updatedAt as "recent activity" signal
  const lastUpdated = user.updatedAt || user.createdAt;
  if (lastUpdated) {
    const daysSince = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince <= 30) score += 5;
    else if (daysSince <= 90) score += 2;
  }

  score += Math.min(2, Math.floor((rd.badges || []).length * 0.5));

  const openComplaints = (rd.complaints || []).filter(c =>
    ['open', 'under_review', 'investigating', 'escalated'].includes(c.status)
  ).length;
  score -= Math.min(10, openComplaints * 2);

  if ((rd.fraudScore ?? 0) > 2) score -= 10;
  if ((rd.spamScore  ?? 0) > 5) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeBadges(user, rd) {
  const cd  = user.companyData    || {};
  const ed  = user.enterpriseData || {};
  const md  = user.marketplaceData || {};
  const ts  = rd.trustScore ?? 0;
  const avg = rd.avgRating ?? user.stats?.rating ?? 0;

  const candidates = [];

  if (user.verified) candidates.push('verified');
  if (ts >= 80)      candidates.push('trusted');
  if (avg >= 4.8)    candidates.push('highly_rated');

  const totalJobs = user.stats?.totalJobs ?? (rd.workerReviews || []).length;
  if (user.role === 'worker' && totalJobs >= 10 && avg >= 4.5) candidates.push('top_worker');
  if (user.role === 'worker' && totalJobs >= 15 && avg >= 4.9) candidates.push('master');

  const yearsExp = user.experience ?? user.profileMetadata?.yearsExperience ?? 0;
  if (user.role === 'worker' && yearsExp >= 5) candidates.push('expert');

  const isEmployer = ['company','enterprise'].includes(user.role);
  const employees  = (cd.employees || ed.employees || []).filter(e => e.status === 'active').length;
  if (isEmployer && employees >= 5) candidates.push('top_company');

  const badComplaints = (rd.complaints || []).filter(c => c.status === 'resolved' && c.resolution === 'against').length;
  if (isEmployer && employees >= 5 && badComplaints === 0) candidates.push('excellent_employer');

  const confirmedBookings = (md.bookings || []).filter(b => b.status === 'confirmed').length;
  const confirmedJobs     = (cd.jobs || ed.jobs || []).filter(j => ['confirmed','hired'].includes(j.status)).length;
  if (confirmedBookings + confirmedJobs >= 20) candidates.push('fast_responder');

  if (MARKETPLACE_PROVIDER_ROLES.has(user.role) && user.verified && (md.bookings || []).length >= 10) {
    candidates.push('premium_business');
  }

  const now        = new Date().toISOString();
  const existingIds = new Set((rd.badges || []).map(b => b.id));
  for (const id of candidates) {
    if (!existingIds.has(id)) rd.badges.push({ id, awardedAt: now });
  }
  rd.badges = rd.badges.filter(b => candidates.includes(b.id));
  return rd.badges;
}

function computeCompleteness(user) {
  const meta = user.profileMetadata || {};
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
  const role = user.role;
  if (['worker','service_provider'].includes(role)) {
    fields.push({ key: 'certifications', filled: (meta.certifications?.length ?? 0) > 0 });
    fields.push({ key: 'portfolio',      filled: !!(meta.portfolio) });
  }
  if (['company','enterprise'].includes(role)) {
    fields.push({ key: 'description', filled: !!(meta.bio || meta.description) });
    fields.push({ key: 'website',     filled: !!(meta.website) });
  }
  if (['hospital','clinic'].includes(role)) {
    fields.push({ key: 'license', filled: !!(meta.license_number) });
  }
  const total   = fields.length;
  const filled  = fields.filter(f => f.filled).length;
  const pct     = Math.round((filled / total) * 100);
  const missing = fields.filter(f => !f.filled).map(f => f.key);
  return { pct, filled, total, missing };
}

function detectFakeReviewSignals(reviewer, targetId, rating, comment, allReviews) {
  const signals  = [];
  let flagScore  = 0;
  const reviewerId = reviewer?._id || reviewer?.id;

  if (reviewerId === targetId) { signals.push('selfReview'); flagScore += 10; }

  if (allReviews.some(r => r.reviewerId === reviewerId)) {
    signals.push('duplicateReviewer'); flagScore += 10;
  }

  const accountAge = reviewer?.createdAt
    ? (Date.now() - new Date(reviewer.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    : 999;
  if (accountAge < 7) { signals.push('newAccount'); flagScore += 3; }

  if ((rating === 1 || rating === 5) && (!comment || comment.trim().length < 10)) {
    signals.push('ratingTooExtreme'); flagScore += 2;
  }

  const rd = reviewer?.reputationData;
  if (rd) {
    const recentGiven = (rd.reviewsGiven || []).filter(r =>
      Date.now() - new Date(r.createdAt).getTime() < 60 * 60 * 1000
    ).length;
    if (recentGiven >= 3) { signals.push('suspiciousPattern'); flagScore += 4; }
  }

  return { flagScore, signals };
}

function verifyRelationship(reviewer, target) {
  const reviewerRole = reviewer?.role;
  const targetRole   = target?.role;
  if (!reviewerRole || !targetRole) return { valid: false, reason: 'Wòl itilizatè manke' };

  const reviewerId = reviewer?._id || reviewer?.id;
  const targetId   = target?._id   || target?.id;

  if (reviewerRole === 'worker' && ['company','enterprise'].includes(targetRole)) {
    const cd = target.companyData || target.enterpriseData || {};
    const inEmployees = (cd.employees || []).some(e => e.userId === reviewerId || e.id === reviewerId);
    const inJobs = (cd.jobs || []).some(j => j.workerId === reviewerId || j.applicants?.includes(reviewerId));
    if (inEmployees || inJobs) return { valid: true, reason: '' };
    return { valid: false, reason: 'Pa gen relasyon travay verifye ant ou ak konpayi sa a' };
  }

  if (['user','worker'].includes(reviewerRole) && MARKETPLACE_PROVIDER_ROLES.has(targetRole)) {
    const md = target.marketplaceData || {};
    const hasBooking = (md.bookings || []).some(b =>
      b.customerId === reviewerId && ['confirmed','completed'].includes(b.status)
    );
    if (hasBooking) return { valid: true, reason: '' };
    const revMd      = reviewer.marketplaceData || {};
    const sentBooking = (revMd.sentBookings || []).some(b =>
      b.targetId === targetId && ['confirmed','completed'].includes(b.status)
    );
    if (sentBooking) return { valid: true, reason: '' };
    return { valid: false, reason: 'Pa gen rezèvasyon konfime ak biznis sa a pou kite evalyasyon' };
  }

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

  return { valid: true, reason: '' };
}

// ── GET /trust-score ─────────────────────────────────────────

router.get('/trust-score', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, error: { message: 'userId requis' } });

  try {
    const user  = await userRepo.getById(userId);
    const rd    = getRD(user);
    user.reputationData = rd; // ensure getRD initialised result is in scope

    const score = computeTrustScore(user);
    const compl = computeCompleteness(user);

    rd.trustScore          = score;
    rd.trustScoreUpdatedAt = new Date().toISOString();
    computeBadges(user, rd);

    await userRepo.update(userId, {
      trustScore:          score,
      reputationData:      rd,
      profileCompleteness: compl.pct,
    });

    return res.json({
      success: true,
      data: { trustScore: score, completeness: compl, badges: rd.badges, updatedAt: rd.trustScoreUpdatedAt },
    });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── GET /badges ───────────────────────────────────────────────

router.get('/badges', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, error: { message: 'userId requis' } });

  try {
    const user = await userRepo.getById(userId);
    const rd   = getRD(user);
    user.reputationData = rd;

    rd.trustScore = computeTrustScore(user);
    rd.avgRating  = recomputeAvg(rd.workerReviews);
    const badges  = computeBadges(user, rd);

    await userRepo.update(userId, { reputationData: rd, trustScore: rd.trustScore });

    return res.json({ success: true, data: { badges } });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── GET /completeness ─────────────────────────────────────────

router.get('/completeness', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ success: false, error: { message: 'userId requis' } });

  try {
    const user  = await userRepo.getById(userId);
    const compl = computeCompleteness(user);
    await userRepo.update(userId, { profileCompleteness: compl.pct });
    return res.json({ success: true, data: compl });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── POST /reviews ─────────────────────────────────────────────

router.post('/reviews', async (req, res) => {
  const { reviewerId, targetId, rating, comment = '', criteria = {}, jobId = null } = req.body;

  if (!reviewerId || !targetId || !rating) {
    return res.status(400).json({ success: false, error: { message: 'reviewerId, targetId, ak rating obligatwa' } });
  }
  const parsedRating = parseFloat(rating);
  if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ success: false, error: { message: 'Rating dwe ant 1 ak 5' } });
  }
  if (reviewerId === targetId) {
    return res.status(400).json({ success: false, error: { message: 'Pa ka evalye tèt ou' } });
  }

  try {
    const [reviewer, target] = await Promise.all([
      userRepo.getById(reviewerId),
      userRepo.getById(targetId),
    ]);

    const targetRD   = getRD(target);
    const reviewerRD = getRD(reviewer);
    target.reputationData   = targetRD;
    reviewer.reputationData = reviewerRD;

    const rel = verifyRelationship(reviewer, target);
    if (!rel.valid) {
      return res.status(403).json({ success: false, error: { message: rel.reason } });
    }

    const existingIdx = targetRD.workerReviews.findIndex(r => r.reviewerId === reviewerId);
    const { flagScore, signals } = detectFakeReviewSignals(
      reviewer, targetId, parsedRating, comment, targetRD.workerReviews
    );
    const isFlagged = flagScore >= 5;
    const status    = isFlagged ? 'pending' : 'approved';

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
      reply:    existingIdx >= 0 ? (targetRD.workerReviews[existingIdx].reply ?? null) : null,
      reports:  existingIdx >= 0 ? (targetRD.workerReviews[existingIdx].reports ?? []) : [],
      createdAt: existingIdx >= 0 ? targetRD.workerReviews[existingIdx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      targetRD.workerReviews[existingIdx] = review;
    } else {
      targetRD.workerReviews = [review, ...targetRD.workerReviews];
    }

    targetRD.avgRating   = recomputeAvg(targetRD.workerReviews);
    targetRD.ratingCount = targetRD.workerReviews.filter(r => r.status === 'approved').length;
    const newTrustScore  = computeTrustScore({ ...target, reputationData: targetRD });
    targetRD.trustScore  = newTrustScore;

    reviewerRD.reviewsGiven = [
      { targetId, rating: parsedRating, createdAt: new Date().toISOString() },
      ...(reviewerRD.reviewsGiven || []),
    ];

    await Promise.all([
      userRepo.update(targetId, {
        reputationData: targetRD,
        trustScore:     newTrustScore,
        stats:          { ...(target.stats || {}), rating: targetRD.avgRating },
      }),
      userRepo.update(reviewerId, { reputationData: reviewerRD }),
    ]);

    await notificationRepo.insert({
      userId:   targetId,
      type:     'new_review',
      title:    isFlagged ? 'Evalyasyon anba revizyon' : 'Nouvo Evalyasyon ⭐',
      message:  isFlagged
        ? 'Yon evalyasyon soumèt pou ou — anba revizyon pou modérasyon.'
        : `${reviewer.name || 'Yon itilizatè'} ba ou ⭐ ${parsedRating}/5.`,
      sourceUserId: reviewerId,
    }).catch(() => {});

    return res.json({
      success: true,
      data: { review, avgRating: targetRD.avgRating, ratingCount: targetRD.ratingCount, trustScore: newTrustScore, flagged: isFlagged, signals },
    });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ success: false, error: { message: err.message } });
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── GET /reviews ──────────────────────────────────────────────

router.get('/reviews', async (req, res) => {
  const { targetId, status } = req.query;
  if (!targetId) return res.status(400).json({ success: false, error: { message: 'targetId requis' } });

  try {
    const target = await userRepo.getById(targetId);
    const rd     = getRD(target);
    let reviews  = [...(rd.workerReviews || [])];

    if (MARKETPLACE_PROVIDER_ROLES.has(target.role) && target.marketplaceData?.reviews) {
      const rdIds = new Set(reviews.map(r => r.reviewerId));
      for (const mr of target.marketplaceData.reviews) {
        if (!rdIds.has(mr.reviewerId)) reviews.push({ ...mr, source: 'marketplace' });
      }
    }

    if (status) reviews = reviews.filter(r => r.status === status);
    const publicReviews = reviews.filter(r => r.status === 'approved' || r.status == null);

    return res.json({
      success: true,
      data: { reviews: publicReviews, allCount: reviews.length, avgRating: rd.avgRating || target.marketplaceData?.avgRating || 0 },
    });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── POST /reviews/:id/reply ───────────────────────────────────

router.post('/reviews/:id/reply', async (req, res) => {
  const { id: reviewId }     = req.params;
  const { userId, reply }    = req.body;

  if (!userId || !reply?.trim()) {
    return res.status(400).json({ success: false, error: { message: 'userId ak reply obligatwa' } });
  }

  try {
    const user = await userRepo.getById(userId);
    const rd   = getRD(user);
    const idx  = rd.workerReviews.findIndex(r => r.id === reviewId);

    if (idx < 0) return res.status(404).json({ success: false, error: { message: 'Evalyasyon pa jwenn' } });

    rd.workerReviews[idx].reply = { text: reply.trim(), repliedAt: new Date().toISOString() };
    await userRepo.update(userId, { reputationData: rd });

    return res.json({ success: true, data: { reply: rd.workerReviews[idx].reply } });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── POST /reviews/:id/report ──────────────────────────────────

router.post('/reviews/:id/report', async (req, res) => {
  const { id: reviewId }                        = req.params;
  const { reporterId, targetId, reason = 'other' } = req.body;

  if (!reporterId || !targetId) {
    return res.status(400).json({ success: false, error: { message: 'reporterId ak targetId obligatwa' } });
  }

  try {
    const target = await userRepo.getById(targetId);
    const rd     = getRD(target);
    const idx    = rd.workerReviews.findIndex(r => r.id === reviewId);

    if (idx < 0) return res.status(404).json({ success: false, error: { message: 'Evalyasyon pa jwenn' } });

    const review = rd.workerReviews[idx];
    if (!Array.isArray(review.reports)) review.reports = [];

    if (review.reports.some(r => r.reporterId === reporterId)) {
      return res.status(409).json({ success: false, error: { message: 'Ou deja rapòte evalyasyon sa a' } });
    }

    review.reports.push({ reporterId, reason, createdAt: new Date().toISOString() });
    if (review.reports.length >= 3 && review.status === 'approved') {
      review.status    = 'pending';
      review.flagScore = Math.max(review.flagScore ?? 0, 5);
    }

    await userRepo.update(targetId, { reputationData: rd });

    return res.json({ success: true, data: { reported: true, reportCount: review.reports.length } });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── PATCH /reviews/:id/moderate ──────────────────────────────

router.patch('/reviews/:id/moderate', async (req, res) => {
  const { id: reviewId }                            = req.params;
  const { adminId, targetId, action, note = '' }    = req.body;

  if (!adminId || !targetId || !VALID_REVIEW_STATUSES.includes(action)) {
    return res.status(400).json({
      success: false,
      error: { message: `adminId, targetId, ak aksyon (${VALID_REVIEW_STATUSES.join('|')}) obligatwa` },
    });
  }

  try {
    const target = await userRepo.getById(targetId);
    const rd     = getRD(target);
    const idx    = rd.workerReviews.findIndex(r => r.id === reviewId);

    if (idx < 0) return res.status(404).json({ success: false, error: { message: 'Evalyasyon pa jwenn' } });

    rd.workerReviews[idx].status        = action;
    rd.workerReviews[idx].moderatedBy   = adminId;
    rd.workerReviews[idx].moderatedAt   = new Date().toISOString();
    rd.workerReviews[idx].moderationNote = note;

    rd.avgRating   = recomputeAvg(rd.workerReviews);
    rd.ratingCount = rd.workerReviews.filter(r => r.status === 'approved').length;
    rd.trustScore  = computeTrustScore({ ...target, reputationData: rd });

    rd.moderationHistory = rd.moderationHistory || [];
    rd.moderationHistory.unshift({ type: 'review_moderation', reviewId, action, adminId, note, createdAt: new Date().toISOString() });

    await userRepo.update(targetId, {
      reputationData: rd,
      trustScore:     rd.trustScore,
      stats:          { ...(target.stats || {}), rating: rd.avgRating },
    });

    return res.json({ success: true, data: { reviewId, action, avgRating: rd.avgRating, trustScore: rd.trustScore } });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── POST /complaints ──────────────────────────────────────────

router.post('/complaints', async (req, res) => {
  const {
    complainantId, respondentId,
    category    = 'other',
    description = '',
    evidence    = [],
    jobId       = null,
  } = req.body;

  if (!complainantId || !respondentId || !description.trim()) {
    return res.status(400).json({ success: false, error: { message: 'complainantId, respondentId, ak deskripsyon obligatwa' } });
  }
  if (complainantId === respondentId) {
    return res.status(400).json({ success: false, error: { message: 'Pa ka depoze plent kont tèt ou' } });
  }

  try {
    const [complainant, respondent] = await Promise.all([
      userRepo.getById(complainantId),
      userRepo.getById(respondentId),
    ]);

    const rel = verifyRelationship(complainant, respondent);
    if (!rel.valid) {
      return res.status(403).json({ success: false, error: { message: `Plent pa admisib: ${rel.reason}` } });
    }

    const compRD     = getRD(complainant);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayCount = (compRD.complaintsSent || []).filter(c => new Date(c.createdAt) >= todayStart).length;

    if (todayCount >= 2) {
      compRD.spamScore = Math.min(10, (compRD.spamScore ?? 0) + 2);
      await userRepo.update(complainantId, { reputationData: compRD });
      return res.status(429).json({ success: false, error: { message: 'Ou rive nan limit plent pou jodi a (2 pa jou)' } });
    }

    const respondentRD = getRD(respondent);

    const complaint = {
      id:              crypto.randomUUID(),
      complainantId,
      complainantName: complainant.name || 'Anonim',
      respondentId,
      respondentName:  respondent.name  || 'Anonim',
      category,
      description:     description.trim(),
      evidence:        Array.isArray(evidence) ? evidence : [],
      jobId,
      status:          'open',
      resolution:      null,
      appeal:          null,
      adminNotes:      [],
      createdAt:       new Date().toISOString(),
      updatedAt:       new Date().toISOString(),
    };

    respondentRD.complaints  = [complaint, ...(respondentRD.complaints || [])];
    compRD.complaintsSent    = [
      { complaintId: complaint.id, respondentId, status: 'open', createdAt: complaint.createdAt },
      ...(compRD.complaintsSent || []),
    ];

    const newTrustScore     = computeTrustScore({ ...respondent, reputationData: respondentRD });
    respondentRD.trustScore = newTrustScore;

    await Promise.all([
      userRepo.update(respondentId,  { reputationData: respondentRD, trustScore: newTrustScore }),
      userRepo.update(complainantId, { reputationData: compRD }),
    ]);

    await notificationRepo.insert({
      userId:   respondentId,
      type:     'complaint_received',
      title:    'Nouvo Plent Resevwa',
      message:  `${complainant.name || 'Yon itilizatè'} soumèt yon plent: ${category}.`,
      data:     { complaintId: complaint.id },
      sourceUserId: complainantId,
    }).catch(() => {});

    return res.json({ success: true, data: { complaint, trustScore: newTrustScore } });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ success: false, error: { message: err.message } });
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── GET /complaints ───────────────────────────────────────────

router.get('/complaints', async (req, res) => {
  const { userId, role: viewRole = 'received' } = req.query;
  if (!userId) return res.status(400).json({ success: false, error: { message: 'userId requis' } });

  try {
    const user = await userRepo.getById(userId);
    const rd   = getRD(user);
    const data = viewRole === 'sent' ? rd.complaintsSent || [] : rd.complaints || [];
    return res.json({ success: true, data: { complaints: data, total: data.length } });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── PATCH /complaints/:id/status ─────────────────────────────

router.patch('/complaints/:id/status', async (req, res) => {
  const { id: complaintId } = req.params;
  const { adminId, respondentId, newStatus, note = '', resolution = null } = req.body;

  if (!adminId || !respondentId || !COMPLAINT_VALID_STATUSES.includes(newStatus)) {
    return res.status(400).json({
      success: false,
      error: { message: `adminId, respondentId, ak newStatus valide obligatwa. Valè: ${COMPLAINT_VALID_STATUSES.join(', ')}` },
    });
  }

  try {
    const respondent = await userRepo.getById(respondentId);
    const rd         = getRD(respondent);
    const idx        = rd.complaints.findIndex(c => c.id === complaintId);

    if (idx < 0) return res.status(404).json({ success: false, error: { message: 'Plent pa jwenn' } });

    const complaint      = rd.complaints[idx];
    const currentStatus  = complaint.status;

    complaint.status    = newStatus;
    complaint.updatedAt = new Date().toISOString();
    if (resolution) complaint.resolution = resolution;
    if (!Array.isArray(complaint.adminNotes)) complaint.adminNotes = [];
    complaint.adminNotes.push({ adminId, note, status: newStatus, createdAt: new Date().toISOString() });

    rd.trustScore = computeTrustScore({ ...respondent, reputationData: rd });
    rd.moderationHistory = rd.moderationHistory || [];
    rd.moderationHistory.unshift({
      type: 'complaint_status', complaintId, fromStatus: currentStatus, toStatus: newStatus, resolution, adminId, note, createdAt: new Date().toISOString(),
    });

    await userRepo.update(respondentId, { reputationData: rd, trustScore: rd.trustScore });

    // Notify complainant (best-effort)
    if (complaint.complainantId) {
      await notificationRepo.insert({
        userId:   complaint.complainantId,
        type:     'complaint_update',
        title:    'Mizajou Plent',
        message:  `Plent ou a (${complaint.category}) chanje a estati: ${newStatus}.`,
        data:     { complaintId, newStatus, resolution },
        sourceUserId: adminId,
      }).catch(() => {});
    }

    return res.json({ success: true, data: { complaintId, newStatus, resolution, trustScore: rd.trustScore } });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── POST /complaints/:id/appeal ──────────────────────────────

router.post('/complaints/:id/appeal', async (req, res) => {
  const { id: complaintId } = req.params;
  const { userId, reason = '' } = req.body;

  if (!userId || !reason.trim()) {
    return res.status(400).json({ success: false, error: { message: 'userId ak rezon apèl obligatwa' } });
  }

  try {
    const user = await userRepo.getById(userId);
    const rd   = getRD(user);
    const idx  = rd.complaints.findIndex(c => c.id === complaintId);

    if (idx < 0) return res.status(404).json({ success: false, error: { message: 'Plent pa jwenn' } });

    const complaint = rd.complaints[idx];
    if (!['resolved','rejected'].includes(complaint.status)) {
      return res.status(400).json({ success: false, error: { message: 'Apèl sèlman posib apre Rezoud oswa Rejete' } });
    }
    if (complaint.appeal) {
      return res.status(409).json({ success: false, error: { message: 'Apèl deja soumèt' } });
    }

    complaint.appeal  = { reason: reason.trim(), status: 'pending', submittedAt: new Date().toISOString() };
    complaint.status  = 'escalated';
    complaint.updatedAt = new Date().toISOString();

    await userRepo.update(userId, { reputationData: rd });

    return res.json({ success: true, data: { appeal: complaint.appeal, newStatus: 'escalated' } });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── POST /verify/request ──────────────────────────────────────

router.post('/verify/request', async (req, res) => {
  const { userId, type, notes = '' } = req.body;

  if (!userId || !VALID_VERIFICATION_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      error: { message: `userId ak type (${VALID_VERIFICATION_TYPES.join('|')}) obligatwa` },
    });
  }

  try {
    const user = await userRepo.getById(userId);
    const rd   = getRD(user);
    const vs   = rd.verificationStatus;

    if (vs[type] === 'verified') {
      return res.status(409).json({ success: false, error: { message: `${type} deja verifye` } });
    }

    vs[type]       = 'pending';
    vs.requestedAt = new Date().toISOString();
    vs.notes       = notes.trim();

    rd.verificationRequests = rd.verificationRequests || [];
    rd.verificationRequests = [
      { type, status: 'pending', notes, requestedAt: vs.requestedAt },
      ...rd.verificationRequests,
    ];

    await userRepo.update(userId, { reputationData: rd });

    return res.json({ success: true, data: { type, status: 'pending', message: 'Demann verifikasyon resevwa — anba revizyon' } });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── PATCH /verify/status ──────────────────────────────────────

router.patch('/verify/status', async (req, res) => {
  const { adminId, userId, type, status, note = '' } = req.body;

  if (!adminId || !userId || !VALID_VERIFICATION_TYPES.includes(type) || !['verified','rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: { message: 'adminId, userId, type, ak status (verified|rejected) obligatwa' },
    });
  }

  try {
    const user = await userRepo.getById(userId);
    const rd   = getRD(user);
    const vs   = rd.verificationStatus;

    vs[type] = status;
    if (status === 'verified') {
      vs.verifiedAt = new Date().toISOString();
    } else {
      vs.rejectedAt = new Date().toISOString();
    }
    vs.notes = note;

    rd.trustScore = computeTrustScore({ ...user, reputationData: rd, verified: status === 'verified' && type === 'identity' ? true : user.verified });
    computeBadges({ ...user, reputationData: rd, verified: rd.trustScore > 0 ? user.verified : false }, rd);

    rd.moderationHistory = rd.moderationHistory || [];
    rd.moderationHistory.unshift({ type: 'verification', docType: type, status, adminId, note, createdAt: new Date().toISOString() });

    const updates = {
      reputationData: rd,
      trustScore:     rd.trustScore,
    };
    if (status === 'verified' && type === 'identity') updates.verified = true;

    await userRepo.update(userId, updates);

    await notificationRepo.insert({
      userId,
      type:    'verification_update',
      title:   status === 'verified' ? `Verifikasyon ${type} Konfime ✅` : `Verifikasyon ${type} Refize`,
      message: status === 'verified'
        ? `Verifikasyon ${type} ou konfime pa JOBFAST.`
        : `Verifikasyon ${type} refize. ${note}`,
      sourceUserId: adminId,
    }).catch(() => {});

    return res.json({ success: true, data: { type, status, trustScore: rd.trustScore, badges: rd.badges } });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ success: false, error: { message: 'Itilizatè pa jwenn' } });
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;