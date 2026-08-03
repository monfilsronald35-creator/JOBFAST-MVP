import { db }    from '../../../core/database/SupabaseClient.js';
import type { GeocodeResult, RouteResult } from '../types/maps.types.js';

// Haiti city coordinates
const HAITI_CITIES: Record<string, { lat: number; lng: number; country: string }> = {
  'port-au-prince': { lat: 18.5944, lng: -72.3074, country: 'HT' },
  'cap-haïtien':    { lat: 19.7607, lng: -72.2028, country: 'HT' },
  'cap-haitien':    { lat: 19.7607, lng: -72.2028, country: 'HT' },
  'jacmel':         { lat: 18.2341, lng: -72.5362, country: 'HT' },
  'les cayes':      { lat: 18.1938, lng: -73.7509, country: 'HT' },
  'gonaïves':       { lat: 19.4481, lng: -72.6858, country: 'HT' },
  'gonaives':       { lat: 19.4481, lng: -72.6858, country: 'HT' },
  'pétion-ville':   { lat: 18.5120, lng: -72.2990, country: 'HT' },
  'petion-ville':   { lat: 18.5120, lng: -72.2990, country: 'HT' },
  'saint-marc':     { lat: 19.1059, lng: -72.7018, country: 'HT' },
  'hinche':         { lat: 19.1392, lng: -72.0086, country: 'HT' },
};

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R  = 6371;
  const dL = (lat2 - lat1) * Math.PI / 180;
  const dG = (lng2 - lng1) * Math.PI / 180;
  const a  = Math.sin(dL / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const GeoService = {
  async geocode(address: string): Promise<GeocodeResult> {
    const key = address.toLowerCase().trim();

    // Check DB cache first
    const { data: cached } = await db.client()
      .from('maps_geocache').select('*').eq('query_key', key)
      .gte('expires_at', new Date().toISOString()).single();
    if (cached) {
      const c = cached as Record<string, unknown>;
      return { address: String(c['address']), lat: Number(c['lat']), lng: Number(c['lng']), city: c['city'] ? String(c['city']) : undefined, country: String(c['country']) };
    }

    // Match against known Haiti cities
    for (const [city, coords] of Object.entries(HAITI_CITIES)) {
      if (key.includes(city)) {
        const result: GeocodeResult = { address, lat: coords.lat, lng: coords.lng, city, country: coords.country };
        // Cache it
        await db.client().from('maps_geocache').insert({
          query_key: key, address, lat: coords.lat, lng: coords.lng, city, country: coords.country,
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
        }).onConflict('query_key').ignore();
        return result;
      }
    }

    // If external API key present, delegate (sandbox: return Port-au-Prince default)
    const apiKey = process.env['GOOGLE_MAPS_API_KEY'] ?? process.env['MAPBOX_TOKEN'];
    void apiKey; // would be used in production
    const fallback: GeocodeResult = { address, lat: 18.5944, lng: -72.3074, city: 'Port-au-Prince', country: 'HT' };
    await db.client().from('maps_geocache').insert({
      query_key: key, address, lat: fallback.lat, lng: fallback.lng, city: fallback.city, country: fallback.country,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    }).onConflict('query_key').ignore();
    return fallback;
  },

  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult> {
    const key = `rev:${lat.toFixed(4)},${lng.toFixed(4)}`;
    const { data: cached } = await db.client()
      .from('maps_geocache').select('*').eq('query_key', key)
      .gte('expires_at', new Date().toISOString()).single();
    if (cached) {
      const c = cached as Record<string, unknown>;
      return { address: String(c['address']), lat: Number(c['lat']), lng: Number(c['lng']), country: String(c['country']) };
    }

    // Nearest known city
    let nearest = { name: 'Port-au-Prince', ...HAITI_CITIES['port-au-prince']! };
    let minDist  = Infinity;
    for (const [name, coords] of Object.entries(HAITI_CITIES)) {
      const d = haversineKm(lat, lng, coords.lat, coords.lng);
      if (d < minDist) { minDist = d; nearest = { name, ...coords }; }
    }
    const result: GeocodeResult = { address: `${nearest.name}, Haiti`, lat, lng, city: nearest.name, country: 'HT' };
    await db.client().from('maps_geocache').insert({
      query_key: key, address: result.address, lat, lng, city: nearest.name, country: 'HT',
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    }).onConflict('query_key').ignore();
    return result;
  },

  getRoute(originLat: number, originLng: number, destLat: number, destLng: number): RouteResult {
    const distanceKm       = Math.round(haversineKm(originLat, originLng, destLat, destLng) * 10) / 10;
    const estimatedMinutes = Math.round(distanceKm * 3);   // ~20 km/h Haiti urban
    const etaText          = estimatedMinutes < 60
      ? `${estimatedMinutes} minit`
      : `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}min`;
    return { originLat, originLng, destLat, destLng, distanceKm, estimatedMinutes, etaText };
  },

  haversineKm,
};