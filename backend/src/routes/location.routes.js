/* ==================================================
   🌍 JOBFAST LOCATION ROUTES (MVP STABLE)
   FILE: backend/src/routes/location.routes.js
   ================================================== */

import express from "express";

import {
  normalizeLocation,
  formatLocation,
  calculateDistanceKm,
  attachDistance,
  sortByDistance,
  filterNearby,
  createMapClusterPayload,
  groupByCity,
  hasValidCoordinates
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
   📍 EXPORT ROUTER
   ================================================== */

export default router;