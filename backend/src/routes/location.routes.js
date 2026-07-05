/* ==================================================
   🌍 JOBFAST LOCATION ROUTES (MVP STABLE)
   FILE: backend/src/routes/location.routes.js
   ================================================== */

import express from "express";
import crypto from "crypto";

import { usersDatabase } from "../controllers/register.controller.js";
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
} from "../utils/location.js";

const router = express.Router();

/* ==================================================
   📍 HEALTH CHECK
   ================================================== */

router.get("/", (req, res) => {
  return res.json({
    success: true,
    module: "location",
    status: "running"
  });
});

/* ==================================================
   📍 NORMALIZE LOCATION
   ================================================== */

router.post("/normalize", (req, res) => {
  const location =
    normalizeLocation(req.body || {});

  return res.json({
    success: true,
    data: location
  });
});

/* ==================================================
   📍 FORMAT LOCATION
   ================================================== */

router.post("/format", (req, res) => {
  const formatted =
    formatLocation(req.body || {});

  return res.json({
    success: true,
    data: formatted
  });
});

/* ==================================================
   📍 DISTANCE CALCULATOR
   ================================================== */

router.post("/distance", (req, res) => {
  const {
    lat1,
    lng1,
    lat2,
    lng2
  } = req.body || {};

  const distanceKm =
    calculateDistanceKm(
      lat1,
      lng1,
      lat2,
      lng2
    );

  return res.json({
    success: true,
    distanceKm
  });
});

/* ==================================================
   📍 ATTACH DISTANCE
   USERS / JOBS / BUSINESSES
   ================================================== */

router.post("/attach-distance", (req, res) => {
  const {
    items,
    currentLocation
  } = req.body || {};

  const result =
    attachDistance(
      Array.isArray(items)
        ? items
        : [],
      currentLocation || {}
    );

  return res.json({
    success: true,
    total: result.length,
    data: result
  });
});

/* ==================================================
   📍 SORT BY DISTANCE
   ================================================== */

router.post("/sort-distance", (req, res) => {
  const items = Array.isArray(req.body?.items)
    ? req.body.items
    : [];

  const result =
    sortByDistance(items);

  return res.json({
    success: true,
    total: result.length,
    data: result
  });
});

/* ==================================================
   📍 FILTER NEARBY
   ================================================== */

router.post("/nearby", (req, res) => {
  const items = Array.isArray(req.body?.items)
    ? req.body.items
    : [];

  const maxDistanceKm =
    req.body?.maxDistanceKm || 10;

  const result =
    filterNearby(
      items,
      maxDistanceKm
    );

  return res.json({
    success: true,
    total: result.length,
    data: result
  });
});

/* ==================================================
   📍 MAP CLUSTER PAYLOAD
   ================================================== */

router.post("/clusters", (req, res) => {
  const items = Array.isArray(req.body?.items)
    ? req.body.items
    : [];

  const clusters =
    createMapClusterPayload(items);

  return res.json({
    success: true,
    total: clusters.length,
    data: clusters
  });
});

/* ==================================================
   📍 GROUP BY CITY
   ================================================== */

router.post("/group-city", (req, res) => {
  const items = Array.isArray(req.body?.items)
    ? req.body.items
    : [];

  const grouped =
    groupByCity(items);

  return res.json({
    success: true,
    data: grouped
  });
});

/* ==================================================
   📍 GPS VALIDATION
   ================================================== */

router.post("/validate-gps", (req, res) => {
  const valid =
    hasValidCoordinates(
      req.body || {}
    );

  return res.json({
    success: true,
    valid
  });
});

/* ==================================================
   📍 NEARBY ROLES (multi-role nearby search)
   GET /nearby-roles?lat=&lng=&radius=&roles=
   roles = comma-separated list, e.g. worker,restaurant,hotel
   Returns users within radius sorted by distance, with role filter.
   ================================================== */

const SEARCHABLE_ROLES = new Set([
  'worker', 'company', 'enterprise',
  'restaurant', 'hotel', 'rental', 'office',
  'tourism', 'hospital', 'clinic', 'service_provider',
]);

router.get("/nearby-roles", (req, res) => {
  const { lat, lng, radius = "10", roles = "" } = req.query;

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
    return res.status(400).json({
      success: false,
      error: { message: 'lat ak lng requis (numewik)' },
    });
  }

  const maxRadius = Math.min(200, Math.max(1, parseFloat(radius) || 10));

  // Parse requested roles; default to all searchable roles
  const requestedRoles = roles
    ? roles.split(",").map(r => r.trim()).filter(r => SEARCHABLE_ROLES.has(r))
    : [...SEARCHABLE_ROLES];

  if (requestedRoles.length === 0) {
    return res.json({ success: true, data: [], total: 0 });
  }

  const roleSet = new Set(requestedRoles);

  const results = [];
  for (const user of usersDatabase.values()) {
    if (!roleSet.has(user.role)) continue;

    const loc = user.location?.coordinates;
    if (!loc?.latitude || !loc?.longitude) continue;

    const dist = calculateDistanceKm(userLat, userLng, loc.latitude, loc.longitude);
    if (dist === null || dist > maxRadius) continue;

    const { password, notifications: _n, ...safe } = user;
    results.push({
      ...safe,
      distanceKm: dist,
      availability: user.marketplaceData?.availability ?? user.availability ?? null,
    });
  }

  // Sort by distance ascending
  results.sort((a, b) => a.distanceKm - b.distanceKm);

  return res.json({ success: true, total: results.length, data: results });
});

/* ==================================================
   📍 RADIUS ALERT
   POST /radius-alert
   Sends a notification to all users of target roles within a radius.
   Body: { senderId, senderName, roles[], lat, lng, radius, title, message }
   ================================================== */


router.post("/radius-alert", (req, res) => {
  const {
    senderId,
    senderName = "JOBFAST",
    roles = [],
    lat, lng,
    radius = 25,
    title = "Alèt Nouvo",
    message = "",
    alertType = "nearby_alert",
  } = req.body;

  const senderLat = parseFloat(lat);
  const senderLng = parseFloat(lng);

  if (!Number.isFinite(senderLat) || !Number.isFinite(senderLng)) {
    return res.status(400).json({
      success: false,
      error: { message: 'lat ak lng requis' },
    });
  }

  const maxRadius = Math.min(200, Math.max(1, parseFloat(radius) || 25));
  const targetRoleSet = new Set(Array.isArray(roles) ? roles : [roles]);
  const notified = [];

  for (const user of usersDatabase.values()) {
    if (user._id === senderId || user.id === senderId) continue;
    if (targetRoleSet.size > 0 && !targetRoleSet.has(user.role)) continue;

    const loc = user.location?.coordinates;
    if (!loc?.latitude || !loc?.longitude) continue;

    const dist = calculateDistanceKm(senderLat, senderLng, loc.latitude, loc.longitude);
    if (dist === null || dist > maxRadius) continue;

    if (!user.notifications) user.notifications = [];
    user.notifications.unshift({
      id:        crypto.randomUUID(),
      type:      alertType,
      title,
      message,
      data:      { senderId, senderName, distanceKm: dist },
      createdAt: new Date().toISOString(),
      isRead:    false,
    });

    usersDatabase.set(user._id || user.id, user);
    notified.push(user._id || user.id);
  }

  return res.json({
    success: true,
    data: { notified: notified.length, userIds: notified },
  });
});

/* ==================================================
   📍 CLUSTERS MAP
   GET /clusters-map?lat=&lng=&radius=&roles=&gridSize=
   Returns grid-clustered markers for all roles in the radius.
   ================================================== */

router.get("/clusters-map", (req, res) => {
  const { lat, lng, radius = "25", roles = "", gridSize = "1.5" } = req.query;

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  if (!Number.isFinite(userLat) || !Number.isFinite(userLng)) {
    return res.status(400).json({
      success: false,
      error: { message: 'lat ak lng requis' },
    });
  }

  const maxRadius  = Math.min(200, Math.max(1,  parseFloat(radius)   || 25));
  const gridSizeKm = Math.min(10,  Math.max(0.1, parseFloat(gridSize) || 1.5));

  const requestedRoles = roles
    ? roles.split(",").map(r => r.trim()).filter(r => SEARCHABLE_ROLES.has(r))
    : [...SEARCHABLE_ROLES];

  const roleSet = new Set(requestedRoles);
  const nearby = [];

  for (const user of usersDatabase.values()) {
    if (roleSet.size > 0 && !roleSet.has(user.role)) continue;
    const loc = user.location?.coordinates;
    if (!loc?.latitude || !loc?.longitude) continue;
    const dist = calculateDistanceKm(userLat, userLng, loc.latitude, loc.longitude);
    if (dist === null || dist > maxRadius) continue;
    nearby.push({
      id:         user._id || user.id,
      name:       user.name,
      role:       user.role,
      distanceKm: dist,
      location:   { lat: loc.latitude, lng: loc.longitude, city: user.location?.city },
      availability: user.marketplaceData?.availability ?? user.availability ?? null,
    });
  }

  const clusters = clusterMarkers(nearby, gridSizeKm);

  return res.json({
    success:  true,
    total:    nearby.length,
    clusters: clusters.length,
    data:     clusters,
  });
});

/* ==================================================
   📍 EXPORT ROUTER
   ================================================== */

export default router;