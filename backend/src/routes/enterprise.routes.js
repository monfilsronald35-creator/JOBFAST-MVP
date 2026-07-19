/**
 * enterprise.routes.js — Supabase (migrated from in-memory usersDatabase)
 * Mounted at: /api/v1/enterprise
 */

import express from 'express';
import userRepo from '../repositories/user.repository.js';
import notificationRepo from '../repositories/notification.repository.js';
import supabase from '../config/supabaseClient.js';
import { calculateDistanceKm } from '../utils/location.js';

const router = express.Router();

function getED(user) {
  if (!user.enterpriseData || !user.enterpriseData.jobs) {
    return {
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

router.get('/stats', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  try {
    const user = await userRepo.getById(userId);
    const ed   = getED(user);

    const { passwordHash: _pw, ...safeUser } = user;
    return res.json({
      success: true,
      data: {
        ...safeUser,
        derived: {
          completedJobs:   (ed.jobs      || []).filter(j => ['completed','confirmed','paid','closed'].includes(j.status)).length,
          openJobs:        (ed.jobs      || []).filter(j => ['posted','applied','hired','active'].includes(j.status)).length,
          activeBranches:  (ed.branches  || []).filter(b => b.status === 'active').length,
          totalBranches:   (ed.branches  || []).length,
          activeCountries: (ed.countries || []).length,
          activeEmployees: (ed.employees || []).filter(e => e.status === 'active').length,
          totalEmployees:  (ed.employees || []).length,
          globalRevEst:    (ed.jobs || []).filter(j => ['completed','confirmed','paid','closed'].includes(j.status)).length * 2000,
        },
      },
    });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Antrepriz pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── PATCH /api/v1/enterprise/profile ─────────────────────────

router.patch('/profile', async (req, res) => {
  const { userId, profileMetadata, enterpriseData } = req.body;
  if (!userId) {
    return res.status(400).json({ success: false, error: { message: 'userId requis' } });
  }

  try {
    const user    = await userRepo.getById(userId);
    const updates = {};

    if (profileMetadata && typeof profileMetadata === 'object') {
      updates.profileMetadata = { ...(user.profileMetadata || {}), ...profileMetadata };
    }
    if (enterpriseData && typeof enterpriseData === 'object') {
      updates.enterpriseData = { ...getED(user), ...enterpriseData };
    }

    const updated = await userRepo.update(userId, updates);
    const { passwordHash: _pw, ...safeUser } = updated;
    return res.json({ success: true, data: safeUser });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Antrepriz pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── POST /api/v1/enterprise/alert ────────────────────────────

router.post('/alert', async (req, res) => {
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

  const parsedLat       = lat != null ? parseFloat(lat) : null;
  const parsedLng       = lng != null ? parseFloat(lng) : null;
  const hasGPS          = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);
  const skillList       = skills
    ? String(skills).split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
    : [];
  const countryCodeList = Array.isArray(countryCodes)
    ? countryCodes.map(c => String(c).toLowerCase())
    : [];

  try {
    const { data: rows, error } = await supabase
      .from('profiles')
      .select('id, name, role, category, profession, profile_metadata, location_city, location_country, location_lat, location_lng, availability, is_available, stats')
      .in('role', ['worker', 'service_provider', 'user'])
      .eq('is_available', true)
      .neq('id', enterpriseId)
      .limit(500);

    if (error) throw error;

    let candidates = (rows || []).filter(u =>
      ['available', 'looking', 'online'].includes(u.availability || 'available')
    );

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

    if (hasGPS) {
      candidates = candidates
        .map(u => ({
          ...u,
          distanceKm: (u.location_lat != null && u.location_lng != null)
            ? calculateDistanceKm(parsedLat, parsedLng, u.location_lat, u.location_lng)
            : null,
        }))
        .filter(u => u.distanceKm == null || u.distanceKm <= parseFloat(radius));
    } else if (countryCodeList.length > 0) {
      candidates = candidates.filter(u => {
        const uCountry = (u.location_country || '').toLowerCase();
        return countryCodeList.some(cc => uCountry.includes(cc));
      });
    } else if (city || country) {
      candidates = candidates.filter(u => {
        const uCity    = (u.location_city    || '').toLowerCase();
        const uCountry = (u.location_country || '').toLowerCase();
        const matchCity    = city    ? uCity.includes(city.toLowerCase())       : true;
        const matchCountry = country ? uCountry.includes(country.toLowerCase()) : true;
        return matchCity || matchCountry;
      });
    }

    const matched = candidates.slice(0, 30);

    if (matched.length > 0) {
      const notifs = matched.map(w => ({
        userId:      w.id,
        type:        'job_match',
        title:       `${enterpriseName || 'Yon Gwo Antrepriz'} ap rekrite`,
        message:     `Antrepriz sa a ap chèche${skillList.length > 0 ? ` ${skillList.join(', ')}` : ' travayè disponib'} nan zòn ou a.`,
        actionUrl:   `/profile/${enterpriseId}`,
        sourceUserId: enterpriseId,
        expiresAt:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }));
      await notificationRepo.broadcast(notifs).catch(e =>
        console.error('[enterprise/alert] broadcast error:', e.message)
      );
    }

    const safeMatched = matched.map(({ profile_metadata: _m, ...w }) => ({
      ...w,
      location: { city: w.location_city, country: w.location_country },
    }));

    return res.json({ success: true, data: { workers: safeMatched, total: safeMatched.length } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// ── POST /api/v1/enterprise/confirm ──────────────────────────

router.post('/confirm', async (req, res) => {
  const { enterpriseId, jobId, jobTitle } = req.body;

  if (!enterpriseId || !jobId) {
    return res.status(400).json({
      success: false,
      error: { message: 'enterpriseId ak jobId obligatwa' },
    });
  }

  try {
    const enterprise = await userRepo.getById(enterpriseId);
    const ed         = getED(enterprise);
    const job        = (ed.jobs || []).find(j => j.id === jobId);
    const title      = jobTitle || job?.title || 'Travay';

    if (job) {
      job.status = 'confirmed';
      await userRepo.update(enterpriseId, { enterpriseData: ed });
    }

    const assignedIds  = (job?.applicants || []).filter(a => a.hireStatus === 'accepted').map(a => a.workerId);
    const employeeIds  = (ed.employees   || []).filter(e => e.status === 'active').map(e => e.workerId);
    const recipientIds = [...new Set([...assignedIds, ...employeeIds])];

    const PAYMENT_RESPONSES = ['paid_full', 'partial', 'not_paid', 'did_not_work'];

    if (recipientIds.length > 0) {
      const notifs = recipientIds.map(wId => ({
        userId:      wId,
        type:        'payment_confirm',
        title:       'Ou te peye pou travay sa a?',
        message:     `"${title}" — Konfime pèman ou jwenn nan men antrepriz lan.`,
        data:        { jobId, enterpriseId, responses: PAYMENT_RESPONSES },
        actionUrl:   '/notifications',
        sourceUserId: enterpriseId,
        expiresAt:   new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      }));
      await notificationRepo.broadcast(notifs).catch(e =>
        console.error('[enterprise/confirm] broadcast error:', e.message)
      );
    }

    return res.json({
      success: true,
      data: { notified: recipientIds.length, jobId, status: 'confirmed' },
    });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ success: false, error: { message: 'Antrepriz pa jwenn' } });
    }
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

export default router;