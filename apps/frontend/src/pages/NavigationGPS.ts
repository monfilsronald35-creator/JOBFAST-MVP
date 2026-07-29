import { useState, useEffect, useRef } from 'react';

interface UseNavigationGPSOptions { highAccuracy?: boolean; }

export function useNavigationGPS({ highAccuracy = false }: UseNavigationGPSOptions = {}) {
  const [position,  setPosition]  = useState<[number, number] | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [speedKmh,  setSpeedKmh]  = useState(0);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: highAccuracy,
      timeout: 10_000,
      maximumAge: highAccuracy ? 0 : 5_000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        const mps = pos.coords.speed ?? 0;
        setSpeedKmh(Math.round(mps * 3.6));
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      options,
    );

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [highAccuracy]);

  return { position, error, speedKmh };
}