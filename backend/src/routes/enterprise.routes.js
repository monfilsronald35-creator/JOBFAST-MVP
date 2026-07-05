/**
 * enterprise.routes.js
 *
 * Enterprise-specific REST endpoints.  All user data is read and
 * written through the shared in-memory usersDatabase from
 * register.controller.js.  Enterprise-specific structured data is
 * stored on the user object under user.enterpriseData.
 *
 * NOTE (MVP): userId is accepted from the request body / query
 * rather than relying on JWT middleware (known decoded.id vs
 * decoded.userId mismatch — fix before production).
 *
 * Mounted at: /api/v1/enterprise
 */

import express from 'express';
import crypto  from 'crypto';
import { usersDatabase }       from '../controllers/register.controller.js';
import { calculateDistanceKm } from '../utils/location.js';

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────

function safeUser(u) {
  // eslint-disable-next-line no-unused-vars
  const { password, ...safe } = u;
  return safe;
}

/** Return (initialising if absent) the enterprise-specific data block. */
function getED(user) {
  if (!user.enterpriseData) {
    user.enterpriseData = {
      profile:              {},
      countries:            [],
      regions:              [],
      branches:             [],
      jobs:                 [],
      employees:            [],
      paymentConfirmations: 0,
      complaints:           0,
    };
  }
  return user.enterpriseData;
}

// ── GET /api/v1/enterprise/stats?userId= ─────────────────────
// Returns the enterprise's full profile + derived global stats.

router.get('/stats', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Antrepriz pa jwenn' } });
  }

  const ed = getED(user);

  const completedJobs   = (ed.jobs      || []).filter(j =>
    ['completed', 'confirmed', 'paid', 'closed'].includes(j.status)
  ).length;
  const openJobs        = (ed.jobs      || []).filter(j =>
    ['posted', 'applied', 'hired', 'active'].includes(j.status)
  ).length;
  const activeBranches  = (ed.branches  || []).filter(b => b.status === 'active').length;
  const activeCountries = (ed.countries || []).length;
  const activeEmployees = (ed.employees || []).filter(e => e.status === 'active').length;

  return res.json({
    success: true,
    data: {
      ...safeUser(user),
      derived: {
        completedJobs,
        openJobs,
        activeBranches,
        totalBranches:   (ed.branches  || []).length,
        activeCountries,
        activeEmployees,
        totalEmployees:  (ed.employees || []).length,
        globalRevEst:    completedJobs * 2000,
      },
    },
  });
});

// ── PATCH /api/v1/enterprise/profile ─────────────────────────
// Additive merge of profileMetadata and enterpriseData.
// Body: { userId, profileMetadata?, enterpriseData? }

router.patch('/profile', (req, res) => {
  const { userId, profileMetadata, enterpriseData } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Antrepriz pa jwenn' } });
  }

  if (profileMetadata && typeof profileMetadata === 'object') {
    user.profileMetadata = { ...(user.profileMetadata || {}), ...profileMetadata };
  }

  if (enterpriseData && typeof enterpriseData === 'object') {
    const existing = getED(user);
    user.enterpriseData = { ...existing, ...enterpriseData };
  }

  usersDatabase.set(userId, user);
  return res.json({ success: true, data: safeUser(user) });
});

// ── POST /api/v1/enterprise/alert ────────────────────────────
// Multi-country worker search.  Supports GPS radius and country-
// code-based fallback for enterprises operating across borders.
//
// Body: {
//   enterpriseId,   — required
//   enterpriseName, — optional, used in notification text
//   skills,         — optional comma-separated filter
//   countryCodes,   — optional array of country codes (multi-country)
//   city,           — optional city fallback
//   country,        — optional country fallback (single)
//   lat, lng,       — optional GPS coords
//   radius,         — km radius (default 50 — larger than company)
// }

router.post('/alert', (req, res) => {
  const {
    enterpriseId, enterpriseName, skills,
    countryCodes,
    city, country,
    lat, lng,
    radius = 50,
  } = req.body;

  if (!enterpriseId) {
    return res.status(400).json({ success: false, error: { message: 'enterpriseId requis' } });
  }

  const parsedLat  = lat != null ? parseFloat(lat) : null;
  const parsedLng  = lng != null ? parseFloat(lng) : null;
  const hasGPS     = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

  const skillList  = skills
    ? String(skills).split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : [];

  const countryCodeList = Array.isArray(countryCodes)
    ? countryCodes.map(c => String(c).toLowerCase())
    : [];

  // ── Candidate workers ────────────────────────────────────
  let candidates = Array.from(usersDatabase.values()).filter(u => {
    const uid = u._id || u.id;
    if (uid === enterpriseId) return false;
    if (!['worker', 'service_provider', 'user'].includes(u.role)) return false;
    const avail = u.availability ?? 'available';
    return ['available', 'looking', 'online'].includes(avail);
  });

  // ── Skill filter ─────────────────────────────────────────
  if (skillList.length > 0) {
    candidates = candidates.filter(u => {
      const userSkills = [
        u.profession,
        u.category,
        ...(u.profileMetadata?.skills || []),
      ].map(s => String(s || '').toLowerCase());
      return skillList.some(sk => userSkills.some(us => us.includes(sk)));
    });
  }

  // ── Location filter — GPS → country codes → city/country text ──
  if (hasGPS) {
    candidates = candidates
      .map(u => {
        const coordLat = u.location?.coordinates?.latitude;
        const coordLng = u.location?.coordinates?.longitude;
        const distanceKm = (coordLat != null && coordLng != null)
          ? calculateDistanceKm(parsedLat, parsedLng, coordLat, coordLng)
          : null;
        return { ...u, distanceKm };
      })
      .filter(u => u.distanceKm == null || u.distanceKm <= parseFloat(radius));
  } else if (countryCodeList.length > 0) {
    candidates = candidates.filter(u => {
      const uCountry = (u.location?.country || '').toLowerCase();
      return countryCodeList.some(cc => uCountry.includes(cc));
    });
  } else if (city || country) {
    candidates = candidates.filter(u => {
      const uCity    = (u.location?.city    || '').toLowerCase();
      const uCountry = (u.location?.country || '').toLowerCase();
      const matchCity    = city    ? uCity.includes(city.toLowerCase())       : true;
      const matchCountry = country ? uCountry.includes(country.toLowerCase()) : true;
      return matchCity || matchCountry;
    });
  }

  // Cap results and strip passwords
  const matched = candidates.slice(0, 30).map(u => {
    // eslint-disable-next-line no-unused-vars
    const { password, notifications: _n, ...safe } = u;
    return safe;
  });

  // ── In-memory notifications on matched workers ───────────
  for (const w of matched) {
    const wId = w._id || w.id;
    if (!wId) continue;
    const worker = usersDatabase.get(wId);
    if (!worker) continue;
    if (!worker.notifications) worker.notifications = [];
    worker.notifications.unshift({
      id:        crypto.randomUUID(),
      type:      'job_match',
      title:     `${enterpriseName || 'Yon Gwo Antrepriz'} ap rekrite`,
      message:   `Antrepriz sa a ap chèche${skillList.length > 0 ? ` ${skillList.join(', ')}` : ' travayè disponib'} nan zòn ou a.`,
      actionUrl: `/profile/${enterpriseId}`,
      createdAt: new Date().toISOString(),
      isRead:    false,
    });
    usersDatabase.set(wId, worker);
  }

  return res.json({
    success: true,
    data: { workers: matched, total: matched.length },
  });
});

// ── POST /api/v1/enterprise/confirm ──────────────────────────
// Enterprise confirms a job; notifies assigned workers with a
// payment confirmation request.
//
// Body: { enterpriseId, jobId, jobTitle? }

router.post('/confirm', (req, res) => {
  const { enterpriseId, jobId, jobTitle } = req.body;

  if (!enterpriseId || !jobId) {
    return res.status(400).json({
      success: false,
      error: { message: 'enterpriseId ak jobId obligatwa' },
    });
  }

  const enterprise = usersDatabase.get(enterpriseId);
  if (!enterprise) {
    return res.status(404).json({ success: false, error: { message: 'Antrepriz pa jwenn' } });
  }

  const ed    = getED(enterprise);
  const job   = (ed.jobs || []).find(j => j.id === jobId);
  const title = jobTitle || job?.title || 'Travay';

  if (job) {
    job.status = 'confirmed';
    usersDatabase.set(enterpriseId, enterprise);
  }

  const assignedIds = (job?.applicants || [])
    .filter(a => a.hireStatus === 'accepted')
    .map(a => a.workerId);

  const employeeIds = (ed.employees || [])
    .filter(e => e.status === 'active')
    .map(e => e.workerId);

  const recipientIds = [...new Set([...assignedIds, ...employeeIds])];

  const PAYMENT_RESPONSES = ['paid_full', 'partial', 'not_paid', 'did_not_work'];

  for (const wId of recipientIds) {
    const worker = usersDatabase.get(wId);
    if (!worker) continue;
    if (!worker.notifications) worker.notifications = [];
    worker.notifications.unshift({
      id:        crypto.randomUUID(),
      type:      'payment_confirm',
      title:     'Ou te peye pou travay sa a?',
      message:   `"${title}" — Konfime pèman ou jwenn nan men antrepriz lan.`,
      data:      { jobId, enterpriseId, responses: PAYMENT_RESPONSES },
      actionUrl: '/notifications',
      createdAt: new Date().toISOString(),
      isRead:    false,
    });
    usersDatabase.set(wId, worker);
  }

  return res.json({
    success: true,
    data: { notified: recipientIds.length, jobId, status: 'confirmed' },
  });
});

export default router;