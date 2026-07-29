import { useState, useCallback, useRef } from 'react';
import API from '../api/axios';

const MODES = ['driving', 'walking', 'cycling', 'transit'] as const;
type Mode = typeof MODES[number];

interface Destination {
  coords?: [number, number];
  lat?: number;
  lng?: number;
  name?: string;
  label?: string;
}

interface Step { instruction?: string; icon?: string; [key: string]: unknown; }

interface UseNavigationRouteOptions {
  userPos: [number, number] | null;
  speak?: (text: string) => void;
}

function metersToLabel(m: number | null | undefined): string {
  if (m == null) return '';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function secondsToLabel(s: number | null | undefined): string {
  if (s == null) return '';
  if (s < 60) return `${Math.round(s)} sec`;
  if (s < 3600) return `${Math.round(s / 60)} min`;
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return `${h}h ${m}min`;
}

export function useNavigationRoute({ userPos, speak }: UseNavigationRouteOptions) {
  const [destPos,    setDestPos]    = useState<[number, number] | null>(null);
  const [destName,   setDestName]   = useState('');
  const [mode,       setMode]       = useState<Mode>('driving');
  const [routeCoords, setRouteCoords] = useState<unknown[]>([]);
  const [steps,      setSteps]      = useState<Step[]>([]);
  const [curStep,    setCurStep]    = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [totalDist,  setTotalDist]  = useState<number | null>(null);
  const [totalTime,  setTotalTime]  = useState<number | null>(null);
  const [eta,        setEta]        = useState<string | null>(null);
  const [routeErr,   setRouteErr]   = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const buildRoute = useCallback(async (destination: Destination) => {
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
      const res = await API.post<{
        coordinates?: unknown[];
        steps?: Step[];
        totalDistanceMeters?: number;
        totalTimeSeconds?: number;
        eta?: string;
      }>('/navigation/route', payload, { signal: controller.signal });
      const data = res.data ?? {};
      setDestPos(destination.coords ?? [destination.lat ?? 0, destination.lng ?? 0]);
      setDestName(destination.name ?? destination.label ?? '');
      setRouteCoords(data.coordinates ?? []);
      setSteps(data.steps ?? []);
      setTotalDist(data.totalDistanceMeters ?? null);
      setTotalTime(data.totalTimeSeconds ?? null);
      setEta(data.eta ?? null);
      setCurStep(0);
      setActiveStep(0);
      setNavigating(true);
      const firstInstruction = data.steps?.[0]?.instruction;
      if (firstInstruction) speak?.(firstInstruction);
    } catch (err: unknown) {
      const e = err as { name?: string; response?: { data?: { message?: string } } };
      if (e?.name !== 'AbortError') {
        setRouteErr(e?.response?.data?.message ?? 'Route calculation failed');
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