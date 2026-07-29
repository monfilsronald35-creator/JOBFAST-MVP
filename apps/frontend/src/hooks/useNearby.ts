import { useState, useCallback } from 'react';
import useGPS, { type Coords } from './useGPS';
import { GPS_DEFAULT_RADIUS_KM } from '../config/gpsConfig';

const API_BASE = import.meta.env['VITE_API_URL'] || '/api/v1';

interface UseNearbyOptions {
  roles?:   string[];
  radius?:  number;
  enabled?: boolean;
}

export default function useNearby({
  roles   = [],
  radius  = GPS_DEFAULT_RADIUS_KM,
  enabled = true,
}: UseNearbyOptions = {}) {
  const gps = useGPS();
  const [results,  setResults]  = useState<unknown[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (location: Coords) => {
    if (!enabled || !location) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lat:    String(location.lat),
        lng:    String(location.lng),
        radius: String(radius),
        roles:  roles.join(','),
      });
      const res  = await fetch(`${API_BASE}/location/nearby-roles?${params}`);
      const data = await res.json() as { success: boolean; data?: unknown[]; error?: { message?: string } };
      if (data.success) {
        setResults(data.data || []);
      } else {
        setError(data.error?.message || 'Erè rechèch');
      }
    } catch {
      setError('Pa ka konekte ak sèvè');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [enabled, radius, roles]);

  const search = useCallback((overrideCoords: Coords | null = null) => {
    const location = overrideCoords || gps.coords;
    if (location) { doSearch(location); return; }
    gps.acquire({
      onSuccess: (c) => doSearch(c),
      onError:   () => setError('GPS pa disponib — itilize lokasyon manyèl'),
    });
  }, [gps, doSearch]);

  return {
    results, loading, error, searched,
    coords:    gps.coords,
    gpsState:  gps.gpsState,
    gpsError:  gps.error,
    search,
    setManual: gps.setManual,
  };
}