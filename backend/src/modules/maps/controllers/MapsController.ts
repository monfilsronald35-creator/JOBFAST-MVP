import type { Request, Response } from 'express';
import { GeoService }      from '../services/GeoService.js';
import { TrackingService } from '../services/TrackingService.js';

export const MapsController = {
  async geocode(req: Request, res: Response): Promise<void> {
    const address = String(req.query['address'] ?? '').trim();
    if (!address) { res.status(400).json({ error: 'address requis' }); return; }
    try {
      const result = await GeoService.geocode(address);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ error: 'Geocode echoue', detail: String(err) });
    }
  },

  async reverseGeocode(req: Request, res: Response): Promise<void> {
    const lat = parseFloat(String(req.query['lat'] ?? ''));
    const lng = parseFloat(String(req.query['lng'] ?? ''));
    if (isNaN(lat) || isNaN(lng)) { res.status(400).json({ error: 'lat/lng invalide' }); return; }
    try {
      const result = await GeoService.reverseGeocode(lat, lng);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ error: 'Reverse geocode echoue', detail: String(err) });
    }
  },

  async getRoute(req: Request, res: Response): Promise<void> {
    const oLat = parseFloat(String(req.query['originLat']  ?? ''));
    const oLng = parseFloat(String(req.query['originLng']  ?? ''));
    const dLat = parseFloat(String(req.query['destLat']    ?? ''));
    const dLng = parseFloat(String(req.query['destLng']    ?? ''));
    if ([oLat, oLng, dLat, dLng].some(isNaN)) {
      res.status(400).json({ error: 'Koordonat invalide — originLat/Lng ak destLat/Lng obligatwa' });
      return;
    }
    const route = GeoService.getRoute(oLat, oLng, dLat, dLng);
    res.json({ success: true, data: route });
  },

  async updatePosition(req: Request, res: Response): Promise<void> {
    const { entityId, entityType, lat, lng, speed, heading, accuracy } = req.body as Record<string, unknown>;
    if (!entityId || !lat || !lng) { res.status(400).json({ error: 'entityId, lat, lng obligatwa' }); return; }
    const point = {
      entityId:   String(entityId),
      entityType: String(entityType ?? 'driver') as 'driver' | 'worker' | 'delivery' | 'ambulance',
      lat:        Number(lat), lng: Number(lng),
      recordedAt: new Date().toISOString(),
    };
    if (speed    !== undefined) (point as Record<string, unknown>)['speed']    = Number(speed);
    if (heading  !== undefined) (point as Record<string, unknown>)['heading']  = Number(heading);
    if (accuracy !== undefined) (point as Record<string, unknown>)['accuracy'] = Number(accuracy);
    await TrackingService.updatePosition(point as Parameters<typeof TrackingService.updatePosition>[0]);
    res.json({ success: true });
  },

  async getPosition(req: Request, res: Response): Promise<void> {
    const entityId = String(req.params['entityId'] ?? '');
    const pos = await TrackingService.getLatestPosition(entityId);
    if (!pos) { res.status(404).json({ error: 'Pozisyon pa jwenn' }); return; }
    res.json({ success: true, data: pos });
  },

  async findNearbyWorkers(req: Request, res: Response): Promise<void> {
    const lat      = parseFloat(String(req.query['lat']      ?? ''));
    const lng      = parseFloat(String(req.query['lng']      ?? ''));
    const radius   = parseFloat(String(req.query['radius']   ?? '10'));
    const role     = req.query['role'] ? String(req.query['role']) : undefined;
    if (isNaN(lat) || isNaN(lng)) { res.status(400).json({ error: 'lat/lng invalide' }); return; }
    const workers = await TrackingService.findNearbyWorkers(lat, lng, radius, role);
    res.json({ success: true, data: workers, count: workers.length });
  },

  async setServiceArea(req: Request, res: Response): Promise<void> {
    const userId = (req as unknown as { user?: { id?: string } }).user?.id ?? '';
    const { name, lat, lng, radiusKm, city } = req.body as Record<string, unknown>;
    if (!name || lat === undefined || lng === undefined) {
      res.status(400).json({ error: 'name, lat, lng obligatwa' });
      return;
    }
    const id = await TrackingService.setServiceArea(
      userId, String(name), Number(lat), Number(lng),
      Number(radiusKm ?? 10), String(city ?? 'Port-au-Prince'),
    );
    res.status(201).json({ success: true, data: { id } });
  },

  async getServiceAreas(req: Request, res: Response): Promise<void> {
    const userId = (req as unknown as { user?: { id?: string } }).user?.id ?? '';
    const areas = await TrackingService.getServiceAreas(userId);
    res.json({ success: true, data: areas });
  },
};