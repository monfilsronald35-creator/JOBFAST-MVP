import type { MapPOI, POIType } from '../types/travel.types.js';

// Curated POI data (seeded; production would be stored in DB or via Maps API)
const HAITI_POIS: MapPOI[] = [
  // Hotels
  { id: 'h1', name: 'Hôtel Oloffson', type: 'hotel', lat: 18.5473, lng: -72.3390, city: 'Port-au-Prince', country: 'HT', address: 'Ave Christophe', rating: 4.2, isOpen: true },
  { id: 'h2', name: 'Karibe Hotel', type: 'hotel', lat: 18.5167, lng: -72.3333, city: 'Port-au-Prince', country: 'HT', address: 'Juvenat 6, Pétion-Ville', rating: 4.5, isOpen: true },
  { id: 'h3', name: 'Hotel Mont Joli', type: 'hotel', lat: 19.7607, lng: -72.2028, city: 'Cap-Haïtien', country: 'HT', address: 'Rue 19', rating: 4.3, isOpen: true },
  // Beaches
  { id: 'b1', name: 'Plaj Labadie', type: 'beach', lat: 19.7800, lng: -72.2600, city: 'Cap-Haïtien', country: 'HT', rating: 4.8, isOpen: true },
  { id: 'b2', name: 'Plaj Cyvadier', type: 'beach', lat: 18.2200, lng: -72.5200, city: 'Jacmel', country: 'HT', rating: 4.6, isOpen: true },
  { id: 'b3', name: 'Plaj Raymond-les-Bains', type: 'beach', lat: 18.2300, lng: -72.5100, city: 'Jacmel', country: 'HT', rating: 4.5, isOpen: true },
  // Restaurants
  { id: 'r1', name: 'Quartier Latin', type: 'restaurant', lat: 18.5432, lng: -72.3276, city: 'Port-au-Prince', country: 'HT', address: 'Rue Capois', rating: 4.4, isOpen: true },
  { id: 'r2', name: 'Manje Lakay', type: 'restaurant', lat: 18.5120, lng: -72.2980, city: 'Pétion-Ville', country: 'HT', rating: 4.3, isOpen: true },
  // Hospitals
  { id: 'med1', name: 'Hôpital Général', type: 'hospital', lat: 18.5471, lng: -72.3404, city: 'Port-au-Prince', country: 'HT', address: 'Ave de la Santé', isOpen: true },
  // ATMs
  { id: 'atm1', name: 'BNC ATM Pétion-Ville', type: 'atm', lat: 18.5130, lng: -72.2990, city: 'Pétion-Ville', country: 'HT', isOpen: true },
  { id: 'atm2', name: 'Unibank ATM', type: 'atm', lat: 18.5400, lng: -72.3300, city: 'Port-au-Prince', country: 'HT', isOpen: true },
  // Events
  { id: 'ev1', name: 'Kanaval Jacmel 2026', type: 'event', lat: 18.2340, lng: -72.5360, city: 'Jacmel', country: 'HT', isOpen: true },
  // Citadelle
  { id: 'at1', name: 'Citadelle Laferrière', type: 'store', lat: 19.5780, lng: -72.3120, city: 'Cap-Haïtien', country: 'HT', rating: 5.0, isOpen: true },
];

export const TravelMapsService = {
  async getNearbyPOIs(lat: number, lng: number, radiusKm: number, types?: POIType[]): Promise<MapPOI[]> {
    function dist(p: MapPOI): number {
      const dL = (p.lat - lat) * Math.PI / 180;
      const dG = (p.lng - lng) * Math.PI / 180;
      const a  = Math.sin(dL / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(p.lat * Math.PI / 180) * Math.sin(dG / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    return HAITI_POIS
      .filter(p => dist(p) <= radiusKm)
      .filter(p => !types || types.includes(p.type))
      .sort((a, b) => dist(a) - dist(b));
  },

  async getPOIsByCity(city: string, type?: POIType): Promise<MapPOI[]> {
    return HAITI_POIS
      .filter(p => p.city.toLowerCase() === city.toLowerCase())
      .filter(p => !type || p.type === type);
  },

  async getRouteInfo(originLat: number, originLng: number, destLat: number, destLng: number): Promise<{
    distanceKm: number; estimatedMinutes: number; etaText: string;
  }> {
    const dL = (destLat - originLat) * Math.PI / 180;
    const dG = (destLng - originLng) * Math.PI / 180;
    const a  = Math.sin(dL / 2) ** 2 + Math.cos(originLat * Math.PI / 180) * Math.cos(destLat * Math.PI / 180) * Math.sin(dG / 2) ** 2;
    const distanceKm = Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    const estimatedMinutes = Math.round(distanceKm * 3);  // ~20 km/h average Haiti urban
    const eta = estimatedMinutes < 60
      ? `${estimatedMinutes} minit`
      : `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}min`;
    return { distanceKm, estimatedMinutes, etaText: eta };
  },

  async searchPOIs(query: string, city?: string): Promise<MapPOI[]> {
    const q = query.toLowerCase();
    return HAITI_POIS
      .filter(p => p.name.toLowerCase().includes(q) || p.type.includes(q))
      .filter(p => !city || p.city.toLowerCase() === city.toLowerCase());
  },
};