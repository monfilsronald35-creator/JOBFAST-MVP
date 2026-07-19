/**
 * company.routes.js — Supabase (migrated from in-memory usersDatabase)
 * Mounted at: /api/v1/company
 */

import express from 'express';
import crypto  from 'crypto';
import userRepo from '../repositories/user.repository.js';
import notificationRepo from '../repositories/notification.repository.js';
import supabase from '../config/supabaseClient.js';
import { calculateDistanceKm } from '../utils/location.js';

const router = express.Router();

function getCD(user) {
  if (!user.companyData || !user.companyData.jobs) {
    return {
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

router.get('/stats', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  try {
    const user = await userRepo.getById(userId);
    const cd   = getCD(user);

    const { passwordHash: _pw, ...safeUser } = user;
    return res.json({
      success: true,
      data: {
        ...safeUser,
        derived: {
          completedJobs:   (cd.jobs      || []).filter(j => ['completed','confirmed','paid','closed'].includes(j.status)).length,
          activeEmployees: (cd.employees || []).filter(e => e.status === 'active').length,
          openJobs:        (cd.jobs      || []).filter(j => ['posted','applied','hired','active'].includes(j.status)).length,
          activeProjects:  (cd.projects  || []).filter(p => p.status === 'active').length,
          totalBranches:   (cd.branches  || []).length,
        },
      },
    });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Konpayi pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── PATCH /api/v1/company/profile ────────────────────────────

router.patch('/profile', async (req, res) => {
  const { userId, profileMetadata, companyData } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  try {
    const user    = await userRepo.getById(userId);
    const updates = {};

    if (profileMetadata && typeof profileMetadata === 'object') {
      updates.profileMetadata = { ...(user.profileMetadata || {}), ...profileMetadata };
    }
    if (companyData && typeof companyData === 'object') {
      updates.companyData = { ...getCD(user), ...companyData };
    }

    const updated = await userRepo.update(userId, updates);
    const { passwordHash: _pw, ...safeUser } = updated;
    return res.json({ success: true, data: safeUser });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Konpayi pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── POST /api/v1/company/alert ───────────────────────────────

router.post('/alert', async (req, res) => {
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

  try {
    // Fetch available workers from Supabase
    const { data: rows, error } = await supabase
      .from('profiles')
      .select('id, name, role, category, profession, profile_metadata, location_city, location_country, location_lat, location_lng, availability, is_available, stats')
      .in('role', ['worker', 'service_provider', 'user'])
      .eq('is_available', true)
      .neq('id', companyId)
      .limit(500);

    if (error) throw error;

    let candidates = (rows || []).filter(u =>
      ['available', 'looking', 'online'].includes(u.availability || 'available')
    );

    // Skill filter
    if (skillList.length > 0) {
      candidates = candidates.filter(u => {
        const userSkills = [
          u.profession,
          u.category,
          ...(u.profile_metadata?.skills || []),
        ].map(s => String(s || '').toLowerCase());
        return skillList.some(sk => userSkills.some(us => us.includes(sk)));
      });
    }

    // Location filter
    if (hasGPS) {
      candidates = candidates
        .map(u => ({
          ...u,
          distanceKm: (u.location_lat != null && u.location_lng != null)
            ? calculateDistanceKm(parsedLat, parsedLng, u.location_lat, u.location_lng)
            : null,
        }))
        .filter(u => u.distanceKm == null || u.distanceKm <= parseFloat(radius));
    } else if (city || country) {
      candidates = candidates.filter(u => {
        const uCity    = (u.location_city    || '').toLowerCase();
        const uCountry = (u.location_country || '').toLowerCase();
        const matchCity    = city    ? uCity.includes(city.toLowerCase())       : true;
        const matchCountry = country ? uCountry.includes(country.toLowerCase()) : true;
        return matchCity || matchCountry;
      });
    }

    const matched = candidates.slice(0, 20);

    // Broadcast notifications to matched workers
    if (matched.length > 0) {
      const notifs = matched.map(w => ({
        userId:     w.id,
        type:       'job_match',
        title:      `${companyName || 'Yon Konpayi'} ap chèche travayè`,
        message:    `Yo ap chèche${skillList.length > 0 ? ` ${skillList.join(', ')}` : ' travayè disponib'} pre ou.`,
        actionUrl:  `/profile/${companyId}`,
        sourceUserId: companyId,
        expiresAt:  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }));
      await notificationRepo.broadcast(notifs).catch(e =>
        console.error('[company/alert] broadcast error:', e.message)
      );
    }

    const safeMatched = matched.map(({ profile_metadata: _m, ...w }) => ({
      ...w,
      name:     w.name,
      role:     w.role,
      location: { city: w.location_city, country: w.location_country },
    }));

    return res.json({ success: true, data: { workers: safeMatched, total: safeMatched.length } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── POST /api/v1/company/confirm ─────────────────────────────

router.post('/confirm', async (req, res) => {
  const { companyId, jobId, jobTitle } = req.body;

  if (!companyId || !jobId) {
    return res.status(400).json({
      success: false,
      error: { message: 'companyId ak jobId obligatwa' },
    });
  }

  try {
    const company = await userRepo.getById(companyId);
    const cd      = getCD(company);
    const job     = (cd.jobs || []).find(j => j.id === jobId);
    const title   = jobTitle || job?.title || 'Travay';

    if (job) {
      job.status = 'confirmed';
      await userRepo.update(companyId, { companyData: cd });
    }

    const assignedIds  = (job?.applicants || []).filter(a => a.hireStatus === 'accepted').map(a => a.workerId);
    const employeeIds  = (cd.employees   || []).filter(e => e.status === 'active').map(e => e.workerId);
    const recipientIds = [...new Set([...assignedIds, ...employeeIds])];

    const PAYMENT_RESPONSES = ['paid_full', 'partial', 'not_paid', 'did_not_work'];

    if (recipientIds.length > 0) {
      const notifs = recipientIds.map(wId => ({
        userId:      wId,
        type:        'payment_confirm',
        title:       'Ou te peye pou travay sa a?',
        message:     `"${title}" — Konfime pèman ou jwenn nan men konpayi an.`,
        data:        { jobId, companyId, responses: PAYMENT_RESPONSES },
        actionUrl:   '/notifications',
        sourceUserId: companyId,
        expiresAt:   new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      }));
      await notificationRepo.broadcast(notifs).catch(e =>
        console.error('[company/confirm] broadcast error:', e.message)
      );
    }

    return res.json({
      success: true,
      data: { notified: recipientIds.length, jobId, status: 'confirmed' },
    });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Konpayi pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;