export interface GeoCoords {
  lat: number;
  lng: number;
  label?: string;
}

export interface AvailabilityPatch {
  availability?: string;
  availabilityUntil?: string | null;
  geo?: GeoCoords | null;
  presence?: string;
  version?: number;
}

export interface UserSnapshot extends AvailabilityPatch {
  availabilityVersion?: number;
  _optimistic?: boolean;
  [key: string]: unknown;
}

/** Shallow-equal comparison of two geo coordinate objects. */
export function deepEqualGeo(
  a: GeoCoords | null | undefined,
  b: GeoCoords | null | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.lat === b.lat && a.lng === b.lng && a.label === b.label;
}

/**
 * Build an optimistic user object with updated availability fields.
 * Does not mutate the snapshot.
 */
export function buildOptimisticUser(
  snapshot: UserSnapshot | null | undefined,
  _role: string,
  patch: AvailabilityPatch & { version?: number },
): UserSnapshot {
  if (!snapshot) return { ...patch, _optimistic: true };
  return {
    ...snapshot,
    availability:        patch.availability        ?? snapshot.availability,
    availabilityUntil:   patch.availabilityUntil   ?? snapshot.availabilityUntil,
    geo:                 patch.geo                 ?? snapshot.geo,
    presence:            patch.presence            ?? snapshot.presence,
    availabilityVersion: patch.version             ?? (snapshot.availabilityVersion ?? 0) + 1,
    _optimistic: true,
  };
}

/** Validate geo coordinates object. Returns true if usable for a backend update. */
export function validateGeo(geo: unknown): boolean {
  if (!geo) return true; // geo is optional
  if (typeof geo !== 'object' || geo === null) return false;
  const g = geo as Record<string, unknown>;
  if (typeof g['lat'] !== 'number' || typeof g['lng'] !== 'number') return false;
  if ((g['lat'] as number) < -90 || (g['lat'] as number) > 90) return false;
  if ((g['lng'] as number) < -180 || (g['lng'] as number) > 180) return false;
  return true;
}

/**
 * Validate availabilityUntil timestamp.
 * Returns true if valid future timestamp, or null/undefined.
 */
export function validateAvailabilityUntil(until: string | null | undefined): boolean {
  if (until == null) return true;
  const ts = new Date(until).getTime();
  if (Number.isNaN(ts)) return false;
  return ts > Date.now();
}