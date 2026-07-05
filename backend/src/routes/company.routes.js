/**
 * company.routes.js
 *
 * Company-specific REST endpoints.  All user data is read and
 * written through the shared in-memory usersDatabase from
 * register.controller.js.  Company-specific structured data
 * (jobs, employees, projects, branches) is stored directly on
 * the user object under user.companyData so it persists across
 * requests within the same server process.
 *
 * NOTE (MVP): userId is accepted from the request body / query
 * rather than relying on JWT middleware (known decoded.id vs
 * decoded.userId mismatch — fix before production).
 *
 * Mounted at: /api/v1/company
 */

import express from 'express';
import crypto  from 'crypto';
import { usersDatabase }     from '../controllers/register.controller.js';
import { calculateDistanceKm } from '../utils/location.js';

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────

function safeUser(u) {
  // eslint-disable-next-line no-unused-vars
  const { password, ...safe } = u;
  return safe;
}

/** Return (initialising if absent) the company-specific data block. */
function getCD(user) {
  if (!user.companyData) {
    user.companyData = {
      jobs:                 [],
      employees:            [],
      projects:             [],
      branches:             [],
      paymentConfirmations: 0,
      complaints:           0,
    };
  }
  return user.companyData;
}

// ── GET /api/v1/company/stats?userId= ────────────────────────
// Returns the company's full profile + derived stats.

router.get('/stats', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Konpayi pa jwenn' } });
  }

  const cd          = getCD(user);
  const completedJobs = (cd.jobs || []).filter(j =>
    ['completed', 'confirmed', 'paid', 'closed'].includes(j.status)
  ).length;

  return res.json({
    success: true,
    data: {
      ...safeUser(user),
      derived: {
        completedJobs,
        activeEmployees: (cd.employees || []).filter(e => e.status === 'active').length,
        openJobs:        (cd.jobs      || []).filter(j => ['posted','applied','hired','active'].includes(j.status)).length,
        activeProjects:  (cd.projects  || []).filter(p => p.status === 'active').length,
        totalBranches:   (cd.branches  || []).length,
      },
    },
  });
});

// ── PATCH /api/v1/company/profile ────────────────────────────
// Additive merge of profileMetadata and companyData.
// Body: { userId, profileMetadata?, companyData? }

router.patch('/profile', (req, res) => {
  const { userId, profileMetadata, companyData } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  const user = usersDatabase.get(userId);
  if (!user) {
    return res.status(404).json({ success: false, error: { message: 'Konpayi pa jwenn' } });
  }

  if (profileMetadata && typeof profileMetadata === 'object') {
    user.profileMetadata = { ...(user.profileMetadata || {}), ...profileMetadata };
  }

  if (companyData && typeof companyData === 'object') {
    const existing = getCD(user);
    user.companyData = { ...existing, ...companyData };
  }

  usersDatabase.set(userId, user);
  return res.json({ success: true, data: safeUser(user) });
});

// ── POST /api/v1/company/alert ───────────────────────────────
// Find available workers near the company and notify them.
//
// Body: {
//   companyId,    — required
//   companyName,  — optional, used in notification text
//   skills,       — optional comma-separated string filter
//   city,         — fallback when GPS unavailable
//   country,      — fallback when GPS unavailable
//   lat, lng,     — GPS coords (optional but preferred)
//   radius,       — km radius (default 25)
// }

router.post('/alert', (req, res) => {
  const {
    companyId, companyName, skills,
    city, country,
    lat, lng,
    radius = 25,
  } = req.body;

  if (!companyId) {
    return res.status(400).json({ success: false, error: { message: 'companyId requis' } });
  }

  const parsedLat = lat != null ? parseFloat(lat) : null;
  const parsedLng = lng != null ? parseFloat(lng) : null;
  const hasGPS    = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);

  const skillList = skills
    ? String(skills).split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : [];

  // ── Candidate workers ────────────────────────────────────
  let candidates = Array.from(usersDatabase.values()).filter(u => {
    const uid = u._id || u.id;
    if (uid === companyId) return false;                                // exclude self
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

  // ── GPS or location fallback ─────────────────────────────
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
  } else if (city || country) {
    // Graceful fallback: match by city and/or country
    candidates = candidates.filter(u => {
      const uCity    = (u.location?.city    || '').toLowerCase();
      const uCountry = (u.location?.country || '').toLowerCase();
      const matchCity    = city    ? uCity.includes(city.toLowerCase())       : true;
      const matchCountry = country ? uCountry.includes(country.toLowerCase()) : true;
      return matchCity || matchCountry;
    });
  }

  // ── Cap results and strip passwords ─────────────────────
  const matched = candidates.slice(0, 20).map(u => {
    // eslint-disable-next-line no-unused-vars
    const { password, notifications: _n, ...safe } = u;
    return safe;
  });

  // ── Create in-memory notifications on matched workers ────
  // Real implementation would push to MongoDB Notification collection.
  for (const w of matched) {
    const wId = w._id || w.id;
    if (!wId) continue;
    const worker = usersDatabase.get(wId);
    if (!worker) continue;
    if (!worker.notifications) worker.notifications = [];
    worker.notifications.unshift({
      id:        crypto.randomUUID(),
      type:      'job_match',
      title:     `${companyName || 'Yon Konpayi'} ap chèche travayè`,
      message:   `Yo ap chèche${skillList.length > 0 ? ` ${skillList.join(', ')}` : ' travayè disponib'} pre ou.`,
      actionUrl: `/profile/${companyId}`,
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

// ── POST /api/v1/company/confirm ─────────────────────────────
// Company confirms a job is complete; notifies assigned workers
// with a payment confirmation request.
//
// Body: { companyId, jobId, jobTitle? }

router.post('/confirm', (req, res) => {
  const { companyId, jobId, jobTitle } = req.body;

  if (!companyId || !jobId) {
    return res.status(400).json({
      success: false,
      error: { message: 'companyId ak jobId obligatwa' },
    });
  }

  const company = usersDatabase.get(companyId);
  if (!company) {
    return res.status(404).json({ success: false, error: { message: 'Konpayi pa jwenn' } });
  }

  const cd  = getCD(company);
  const job = (cd.jobs || []).find(j => j.id === jobId);
  const title = jobTitle || job?.title || 'Travay';

  // Mark job as confirmed on the company side
  if (job) {
    job.status = 'confirmed';
    usersDatabase.set(companyId, company);
  }

  // Collect workers to notify:
  // 1. applicants with hireStatus === 'accepted'
  const assignedIds = (job?.applicants || [])
    .filter(a => a.hireStatus === 'accepted')
    .map(a => a.workerId);

  // 2. all active employees as fallback
  const employeeIds = (cd.employees || [])
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
      message:   `"${title}" — Konfime pèman ou jwenn nan men konpayi an.`,
      data:      { jobId, companyId, responses: PAYMENT_RESPONSES },
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