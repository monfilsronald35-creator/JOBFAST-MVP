import { db } from '../../../core/database/SupabaseClient.js';
import type { TrackingPoint, NearbyWorker } from '../types/maps.types.js';
import { GeoService } from './GeoService.js';

export const TrackingService = {
  async updatePosition(point: TrackingPoint): Promise<void> {
    await db.client().from('maps_tracking').insert({
      entity_id:   point.entityId,
      entity_type: point.entityType,
      lat:         point.lat,
      lng:         point.lng,
      ...(point.speed    !== undefined && { speed:    point.speed }),
      ...(point.heading  !== undefined && { heading:  point.heading }),
      ...(point.accuracy !== undefined && { accuracy: point.accuracy }),
      recorded_at: new Date().toISOString(),
    });
  },

  async getLatestPosition(entityId: string): Promise<TrackingPoint | null> {
    const { data } = await db.client()
      .from('maps_tracking').select('*')
      .eq('entity_id', entityId)
      .order('recorded_at', { ascending: false })
      .limit(1).single();
    if (!data) return null;
    const d = data as Record<string, unknown>;
    const tp: TrackingPoint = {
      entityId:   String(d['entity_id']),
      entityType: String(d['entity_type']) as TrackingPoint['entityType'],
      lat:        Number(d['lat']),
      lng:        Number(d['lng']),
      recordedAt: String(d['recorded_at']),
    };
    if (d['speed']    !== null && d['speed']    !== undefined) tp.speed    = Number(d['speed']);
    if (d['heading']  !== null && d['heading']  !== undefined) tp.heading  = Number(d['heading']);
    if (d['accuracy'] !== null && d['accuracy'] !== undefined) tp.accuracy = Number(d['accuracy']);
    return tp;
  },

  async findNearbyWorkers(lat: number, lng: number, radiusKm: number, role?: string): Promise<NearbyWorker[]> {
    // Query profiles that are online with a lat/lng stored
    let q = db.client()
      .from('profiles')
      .select('id, name, role, lat, lng, rating, is_online, category')
      .eq('is_online', true)
      .not('lat', 'is', null)
      .not('lng', 'is', null);
    if (role) q = q.eq('role', role);

    const { data } = await q.limit(200);
    const rows = (data ?? []) as Record<string, unknown>[];

    return rows
      .map(r => {
        const wLat = Number(r['lat']);
        const wLng = Number(r['lng']);
        const dist = GeoService.haversineKm(lat, lng, wLat, wLng);
        const w: NearbyWorker = {
          userId:     String(r['id']),
          name:       String(r['name'] ?? ''),
          role:       String(r['role'] ?? ''),
          lat:        wLat,
          lng:        wLng,
          distanceKm: Math.round(dist * 10) / 10,
          rating:     Number(r['rating'] ?? 0),
          isOnline:   Boolean(r['is_online']),
        };
        if (r['category']) w.category = String(r['category']);
        return w;
      })
      .filter(w => w.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 20);
  },

  async setServiceArea(ownerId: string, name: string, lat: number, lng: number, radiusKm: number, city: string): Promise<string> {
    const { data } = await db.client().from('maps_service_areas').insert({
      owner_id: ownerId, name, center_lat: lat, center_lng: lng, radius_km: radiusKm, city,
    }).select('id').single();
    return data ? String((data as Record<string, unknown>)['id']) : '';
  },

  async getServiceAreas(ownerId: string) {
    const { data } = await db.client()
      .from('maps_service_areas').select('*')
      .eq('owner_id', ownerId).eq('is_active', true)
      .order('created_at', { ascending: false });
    return (data ?? []) as Record<string, unknown>[];
  },

  async pruneOldTracking(): Promise<void> {
    const cutoff = new Date(Date.now() - 86400000).toISOString();
    await db.client().from('maps_tracking').delete().lt('recorded_at', cutoff);
  },
};