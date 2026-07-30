import type { MediaVisibility } from '../types/core';

export interface AccessPolicy {
  mediaId:       string;
  visibility:    MediaVisibility;
  allowedUsers?: string[];
  allowedRoles?: string[];
  expiresAt?:    number;
}

export interface VirusScanResult {
  mediaId:   string;
  clean:     boolean;
  threats?:  string[];
  scannedAt: number;
  engine:    string;
}

export interface AuditLogEntry {
  mediaId:    string;
  action:     'upload' | 'view' | 'download' | 'delete' | 'share' | 'transform';
  userId?:    string;
  ip?:        string;
  userAgent?: string;
  timestamp:  number;
}

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api/media/security${path}`, {
    method:  body !== undefined ? 'POST' : 'GET',
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body:    body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

async function getSignedUrl(mediaId: string, expiresInSeconds = 3600): Promise<{ url: string; expiresAt: number }> {
  return api('/signed-url', { mediaId, expiresInSeconds });
}

async function setAccessPolicy(policy: AccessPolicy): Promise<void> {
  await api('/access-policy', policy);
}

async function getAccessPolicy(mediaId: string): Promise<AccessPolicy> {
  return api<AccessPolicy>(`/access-policy/${mediaId}`);
}

async function checkAccess(mediaId: string, userId?: string): Promise<{ allowed: boolean; reason?: string }> {
  return api('/check-access', { mediaId, userId });
}

async function getVirusScanResult(mediaId: string): Promise<VirusScanResult | null> {
  try {
    return await api<VirusScanResult>(`/virus-scan/${mediaId}`);
  } catch {
    return null;
  }
}

async function requestVirusScan(mediaId: string): Promise<string> {
  const result = await api<{ jobId: string }>('/virus-scan/request', { mediaId });
  return result.jobId;
}

async function getAuditLog(mediaId: string, limit = 50, cursor?: string): Promise<{
  entries:     AuditLogEntry[];
  nextCursor?: string;
}> {
  return api('/audit-log', { mediaId, limit, cursor });
}

async function revokeAccess(mediaId: string, userId: string): Promise<void> {
  await api('/revoke-access', { mediaId, userId });
}

// Validate that a signed URL token is structurally correct before sending to backend
function validateSignedToken(token: string): boolean {
  if (!token || token.length < 20) return false;
  const parts = token.split('.');
  return parts.length === 3;  // JWT structure: header.payload.signature
}

export const MediaSecurity = {
  getSignedUrl,
  setAccessPolicy,
  getAccessPolicy,
  checkAccess,
  getVirusScanResult,
  requestVirusScan,
  getAuditLog,
  revokeAccess,
  validateSignedToken,
};
