/**
 * useNearby.js
 *
 * Shared hook for nearby search across all JOBFAST role types.
 * Wraps useGPS and calls the backend multi-role nearby search endpoint.
 *
 * Supports: worker, company, restaurant, hotel, rental,
 *           tourism, hospital, clinic, office, service_provider
 *
 * Usage:
 *   const { results, loading, error, searched, coords, gpsState, search } =
 *     useNearby({ roles: ['worker', 'service_provider'], radius: 10 });
 *
 *   // Trigger search (acquires GPS if needed, then fetches)
 *   <button onClick={() => search()}>Chèche Toupre</button>
 *
 *   // Manual coord override (offline mode)
 *   <button onClick={() => search({ lat: 18.59, lng: -72.30 })}>
 *     Chèche Kounye a
 *   </button>
 */

import { useState, useCallback } from 'react';
import useGPS from './useGPS';
import { GPS_DEFAULT_RADIUS_KM } from '../config/gpsConfig';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export default function useNearby({
  roles   = [],
  radius  = GPS_DEFAULT_RADIUS_KM,
  enabled = true,
} = {}) {
  const gps = useGPS();
  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (location) => {
    if (!enabled || !location) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lat:    location.lat,
        lng:    location.lng,
        radius: radius,
        roles:  roles.join(','),
      });
      const res  = await fetch(`${API_BASE}/location/nearby-roles?${params}`);
      const data = await res.json();
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

  /**
   * Trigger a nearby search.
   * If overrideCoords is provided, uses those directly.
   * Otherwise acquires GPS first, then searches.
   */
  const search = useCallback((overrideCoords = null) => {
    const location = overrideCoords || gps.coords;

    if (location) {
      doSearch(location);
      return;
    }

    // No coords available — acquire GPS first
    gps.acquire({
      onSuccess: (c) => doSearch(c),
      onError: () => setError('GPS pa disponib — itilize lokasyon manyèl'),
    });
  }, [gps, doSearch]);

  return {
    results,
    loading,
    error,
    searched,
    coords:   gps.coords,
    gpsState: gps.gpsState,
    gpsError: gps.error,
    search,
    setManual: gps.setManual,
  };
}