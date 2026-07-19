/* ==================================================
   JOBFAST LOCATION ROUTES (Supabase)
   FILE: backend/src/routes/location.routes.js
   ================================================== */

import express from 'express';
import crypto from 'crypto';
import supabase from '../config/supabaseClient.js';
import notificationRepo from '../repositories/notification.repository.js';
import {
  normalizeLocation,
  formatLocation,
  calculateDistanceKm,
  attachDistance,
  sortByDistance,
  filterNearby,
  createMapClusterPayload,
  groupByCity,
  hasValidCoordinates,
  clusterMarkers,
} from '../utils/location.js';

const router = express.Router();

/* ── Health ─────────────────────────────────────────────────────────────── */

router.get('/', (req, res) => res.json({ success: true, module: 'location', status: 'running' }));

/* ── Pure utility routes (no DB) ───────────────────────────────────────── */

router.post('/normalize', (req, res) =>
  res.json({ success: true, data: normalizeLocation(req.body || {}) }));

router.post('/format', (req, res) =>
  res.json({ success: true, data: formatLocation(req.body || {}) }));

router.post('/distance', (req, res) => {
  const { lat1, lng1, lat2, lng2 } = req.body || {};
  res.json({ success: true, distanceKm: calculateDistanceKm(lat1, lng1, lat2, lng2) });
});

router.post('/attach-distance', (req, res) => {
  const { items, currentLocation } = req.body || {};
  const result = attachDistance(Array.isArray(items) ? items : [], currentLocation || {});
  res.json({ success: true, total: result.length, data: result });
});

router.post('/sort-distance', (req, res) => {
  const result = sortByDistance(Array.isArray(req.body?.items) ? req.body.items : []);
  res.json({ success: true, total: result.length, data: result });
});

router.post('/nearby', (req, res) => {
  const result = filterNearby(
    Array.isArray(req.body?.items) ? req.body.items : [],
    req.body?.maxDistanceKm || 10,
  );
  res.json({ success: true, total: result.length, data: result });
});

router.post('/clusters', (req, res) => {
  const clusters = createMapClusterPayload(Array.isArray(req.body?.items) ? req.body.items : []);
  res.json({ success: true, total: clusters.length, data: clusters });
});

router.post('/group-city', (req, res) => {
  const grouped = groupByCity(Array.isArray(req.body?.items) ? req.body.items : []);
  res.json({ success: true, data: grouped });
});

router.post('/validate-gps', (req, res) =>
  res.json({ success: true, valid: hasValidCoordinates(req.body || {}) }));

/* ── Nearby roles ────────────────────────────────────────────────────────── */

const SEARCHABLE_ROLES = new Set([
  'worker', 'company', 'enterprise',
  'restaurant', 'hotel', 'rental', 'office',
  'tourism', 'hospital', 'clinic', 'service_provider',
]);

router.get('/nearby-roles', async (req, res) => {
  const { lat, lng, radius = '10', roles = '' } = req.query;

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
    return res.status(400).json({ success: false, error: { message: 'lat ak lng requis (numewik)' } });
  }

  const maxRadius = Math.min(200, Math.max(1, parseFloat(radius) || 10));
  const requestedRoles = roles
    ? roles.split(',').map(r => r.trim()).filter(r => SEARCHABLE_ROLES.has(r))
    : [...SEARCHABLE_ROLES];

  if (requestedRoles.length === 0) return res.json({ success: true, data: [], total: 0 });

  try {
    const { data: sourceUsers = [] } = await supabase
      .from('profiles')
      .select('id, name, role, profession, category, profile_photo, is_available, location_city, location_country')
      .in('role', requestedRoles)
      .limit(500);

    const results = [];
    for (const user of sourceUsers) {
      // Coordinates stored as PostGIS POINT — parse if available via lat/lng columns
      const loc = user.location_lat != null && user.location_lng != null
        ? { latitude: user.location_lat, longitude: user.location_lng }
        : null;
      if (!loc) continue;

      const dist = calculateDistanceKm(userLat, userLng, loc.latitude, loc.longitude);
      if (dist === null || dist > maxRadius) continue;
      results.push({
        id:           user.id,
        name:         user.name,
        role:         user.role,
        profession:   user.profession,
        category:     user.category,
        profilePhoto: user.profile_photo,
        availability: user.is_available ? 'available' : 'unavailable',
        location:     { city: user.location_city, country: user.location_country },
        distanceKm:   dist,
      });
    }

    results.sort((a, b) => a.distanceKm - b.distanceKm);
    return res.json({ success: true, total: results.length, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/* ── Radius alert ────────────────────────────────────────────────────────── */

router.post('/radius-alert', async (req, res) => {
  const {
    senderId,
    senderName = 'JOBFAST',
    roles = [],
    lat, lng,
    radius = 25,
    title = 'Alèt Nouvo',
    message = '',
    alertType = 'nearby_alert',
  } = req.body;

  const senderLat = parseFloat(lat);
  const senderLng = parseFloat(lng);
  if (!Number.isFinite(senderLat) || !Number.isFinite(senderLng)) {
    return res.status(400).json({ success: false, error: { message: 'lat ak lng requis' } });
  }

  const maxRadius    = Math.min(200, Math.max(1, parseFloat(radius) || 25));
  const targetRoles  = Array.isArray(roles) ? roles : [roles];
  const notified     = [];

  try {
    let q = supabase.from('profiles').select('id, role, location_lat, location_lng').limit(1000);
    if (targetRoles.length > 0) q = q.in('role', targetRoles);
    const { data: users = [] } = await q;

    const toNotify = [];
    for (const user of users) {
      if (String(user.id) === String(senderId)) continue;
      if (user.location_lat == null || user.location_lng == null) continue;
      const dist = calculateDistanceKm(senderLat, senderLng, user.location_lat, user.location_lng);
      if (dist === null || dist > maxRadius) continue;
      toNotify.push({
        userId:    user.id,
        type:      alertType,
        title,
        message,
        data:      { senderId, senderName, distanceKm: dist },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
      notified.push(user.id);
    }

    if (toNotify.length) await notificationRepo.broadcast(toNotify);

    return res.json({ success: true, data: { notified: notified.length, userIds: notified } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

/* ── Clusters map ────────────────────────────────────────────────────────── */

router.get('/clusters-map', async (req, res) => {
  const { lat, lng, radius = '25', roles = '', gridSize = '1.5' } = req.query;

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
    return res.status(400).json({ success: false, error: { message: 'lat ak lng requis' } });
  }

  const maxRadius  = Math.min(200, Math.max(1,   parseFloat(radius)   || 25));
  const gridSizeKm = Math.min(10,  Math.max(0.1, parseFloat(gridSize) || 1.5));

  const requestedRoles = roles
    ? roles.split(',').map(r => r.trim()).filter(r => SEARCHABLE_ROLES.has(r))
    : [...SEARCHABLE_ROLES];

  try {
    let q = supabase
      .from('profiles')
      .select('id, name, role, is_available, location_city, location_lat, location_lng')
      .limit(1000);
    if (requestedRoles.length > 0) q = q.in('role', requestedRoles);
    const { data: users = [] } = await q;

    const nearby = [];
    for (const user of users) {
      if (user.location_lat == null || user.location_lng == null) continue;
      const dist = calculateDistanceKm(userLat, userLng, user.location_lat, user.location_lng);
      if (dist === null || dist > maxRadius) continue;
      nearby.push({
        id:           user.id,
        name:         user.name,
        role:         user.role,
        distanceKm:   dist,
        location:     { lat: user.location_lat, lng: user.location_lng, city: user.location_city },
        availability: user.is_available ? 'available' : 'unavailable',
      });
    }

    const clusters = clusterMarkers(nearby, gridSizeKm);
    return res.json({ success: true, total: nearby.length, clusters: clusters.length, data: clusters });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;