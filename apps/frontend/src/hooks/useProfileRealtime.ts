/**
 * useProfileRealtime — Live profile patch subscription via Socket.io.
 * Called as: useProfileRealtime(profileId, patchFn)
 *
 * Listens for 'profile:update' events on the shared AuthContext socket
 * and calls patchFn with the delta when the target profile changes.
 * Auto-joins / leaves the profile room on mount/unmount.
 */
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { UserProfile } from '../types';

type PatchFn = (delta: Partial<UserProfile>) => void;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL as string | undefined ??
  (import.meta.env.PROD
    ? 'https://jobfast-backend.onrender.com'
    : 'http://localhost:5000');

// ── Per-profile socket singletons (avoids duplicate connections) ───────────────
const sockets = new Map<string, { socket: Socket; refs: number }>();

function acquireSocket(profileId: string, token: string | null): Socket {
  const existing = sockets.get(profileId);
  if (existing) {
    existing.refs++;
    return existing.socket;
  }

  const socket = io(SOCKET_URL, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    auth: token ? { token } : {},
    reconnectionAttempts: 5,
    reconnectionDelay: 2_000,
  });

  socket.emit('profile:subscribe', { profileId });
  sockets.set(profileId, { socket, refs: 1 });
  return socket;
}

function releaseSocket(profileId: string): void {
  const entry = sockets.get(profileId);
  if (!entry) return;
  entry.refs--;
  if (entry.refs <= 0) {
    entry.socket.emit('profile:unsubscribe', { profileId });
    entry.socket.disconnect();
    sockets.delete(profileId);
  }
}

function getStoredToken(): string | null {
  try {
    const user = JSON.parse(localStorage.getItem('jobfast_user') ?? '{}') as { token?: string };
    return user?.token ?? null;
  } catch {
    return null;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useProfileRealtime(
  profileId: string | null | undefined,
  patchFn: PatchFn,
): void {
  const patchRef = useRef<PatchFn>(patchFn);
  patchRef.current = patchFn;

  useEffect(() => {
    if (!profileId) return;

    const token = getStoredToken();
    const socket = acquireSocket(profileId, token);

    const handleUpdate = (payload: { profileId: string; delta: Partial<UserProfile> }) => {
      if (payload.profileId === profileId) {
        patchRef.current(payload.delta);
      }
    };

    const handleAvailability = (payload: { profileId: string; isAvailable: boolean }) => {
      if (payload.profileId === profileId) {
        patchRef.current({ isAvailable: payload.isAvailable });
      }
    };

    const handleVerification = (payload: { profileId: string; verificationStatus: UserProfile['verificationStatus'] }) => {
      if (payload.profileId === profileId) {
        patchRef.current({ verificationStatus: payload.verificationStatus });
      }
    };

    socket.on('profile:update', handleUpdate);
    socket.on('profile:availability', handleAvailability);
    socket.on('profile:verification', handleVerification);

    return () => {
      socket.off('profile:update', handleUpdate);
      socket.off('profile:availability', handleAvailability);
      socket.off('profile:verification', handleVerification);
      releaseSocket(profileId);
    };
  }, [profileId]);
}