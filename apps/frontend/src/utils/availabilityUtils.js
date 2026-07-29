/**
 * availabilityUtils.js
 * Pure utility functions for availability state management.
 */

/**
 * Shallow-equal comparison of two geo coordinate objects.
 */
export function deepEqualGeo(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.lat === b.lat &&
    a.lng === b.lng &&
    a.label === b.label
  );
}

/**
 * Build an optimistic user object with updated availability fields.
 * Does not mutate the snapshot.
 */
export function buildOptimisticUser(snapshot, role, patch) {
  if (!snapshot) return patch;
  return {
    ...snapshot,
    availability: patch.availability ?? snapshot.availability,
    availabilityUntil: patch.availabilityUntil ?? snapshot.availabilityUntil,
    geo: patch.geo ?? snapshot.geo,
    presence: patch.presence ?? snapshot.presence,
    availabilityVersion: patch.version ?? (snapshot.availabilityVersion ?? 0) + 1,
    _optimistic: true,
  };
}

/**
 * Validate geo coordinates object.
 * Returns true if geo is usable for a backend update.
 */
export function validateGeo(geo) {
  if (!geo) return true; // geo is optional
  if (typeof geo !== 'object') return false;
  if (typeof geo.lat !== 'number' || typeof geo.lng !== 'number') return false;
  if (geo.lat < -90 || geo.lat > 90) return false;
  if (geo.lng < -180 || geo.lng > 180) return false;
  return true;
}

/**
 * Validate availabilityUntil timestamp.
 * Returns true if the value is a valid future timestamp or null/undefined.
 */
export function validateAvailabilityUntil(until) {
  if (until == null) return true;
  const ts = new Date(until).getTime();
  if (Number.isNaN(ts)) return false;
  return ts > Date.now();
}