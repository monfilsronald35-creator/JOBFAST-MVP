import { useState, useCallback, useRef } from 'react';
import API from '../api/axios';

const MODES = ['driving', 'walking', 'cycling', 'transit'];

function metersToLabel(m) {
  if (m == null) return '';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function secondsToLabel(s) {
  if (s == null) return '';
  if (s < 60) return `${Math.round(s)} sec`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return `${h}h ${m}min`;
}

/**
 * useNavigationRoute — route calculation and turn-by-turn state.
 */
export function useNavigationRoute({ userPos, speak }) {
  const [destPos, setDestPos] = useState(null);
  const [destName, setDestName] = useState('');
  const [mode, setMode] = useState('driving');
  const [routeCoords, setRouteCoords] = useState([]);
  const [steps, setSteps] = useState([]);
  const [curStep, setCurStep] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [totalDist, setTotalDist] = useState(null);
  const [totalTime, setTotalTime] = useState(null);
  const [eta, setEta] = useState(null);
  const [routeErr, setRouteErr] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const abortRef = useRef(null);

  const buildRoute = useCallback(async (destination) => {
    if (!userPos) {
      setRouteErr('Waiting for GPS position…');
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRouteErr(null);
    setNavigating(false);
    try {
      const payload = {
        origin: { lat: userPos[0], lng: userPos[1] },
        destination,
        mode,
      };
      const res = await API.post('/navigation/route', payload, {
        signal: controller.signal,
      });
      const data = res.data ?? {};
      setDestPos(destination.coords ?? [destination.lat, destination.lng]);
      setDestName(destination.name ?? destination.label ?? '');
      setRouteCoords(data.coordinates ?? []);
      setSteps(data.steps ?? []);
      setTotalDist(data.totalDistanceMeters ?? null);
      setTotalTime(data.totalTimeSeconds ?? null);
      setEta(data.eta ?? null);
      setCurStep(0);
      setActiveStep(0);
      setNavigating(true);
      if (data.steps?.[0]?.instruction) speak?.(data.steps[0].instruction);
    } catch (err) {
      if (err?.name !== 'AbortError') {
        setRouteErr(err?.response?.data?.message ?? 'Route calculation failed');
      }
    }
  }, [userPos, mode, speak]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setNavigating(false);
    setRouteCoords([]);
    setSteps([]);
    setCurStep(0);
    setActiveStep(0);
    setDestPos(null);
    setDestName('');
  }, []);

  const currentStep = steps[curStep];
  const stepInstruction = currentStep?.instruction ?? '';
  const stepIcon = currentStep?.icon ?? '→';

  return {
    destPos, destName, mode, routeCoords, steps, curStep, navigating,
    totalDist, totalTime, eta, routeErr, activeStep,
    setMode, buildRoute, stop, setCurStep,
    metersToLabel, secondsToLabel, stepInstruction, stepIcon,
  };
}