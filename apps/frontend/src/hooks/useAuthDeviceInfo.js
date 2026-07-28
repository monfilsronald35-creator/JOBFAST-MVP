import { useMemo } from 'react';

function parseDevice() {
  if (typeof navigator === 'undefined') return { device: 'unknown', browser: 'unknown', os: 'unknown', timezone: 'UTC', locale: 'ht' };
  const ua = navigator.userAgent || '';
  const device  = /Mobile|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';
  const browser =
    /Edg\//i.test(ua)    ? 'Edge'    :
    /Chrome/i.test(ua)   ? 'Chrome'  :
    /Firefox/i.test(ua)  ? 'Firefox' :
    /Safari/i.test(ua)   ? 'Safari'  : 'Other';
  const os =
    /Windows/i.test(ua)  ? 'Windows' :
    /Mac OS/i.test(ua)   ? 'macOS'   :
    /Android/i.test(ua)  ? 'Android' :
    /iPhone|iPad/i.test(ua) ? 'iOS'  : 'Other';
  const timezone = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone || 'UTC';
  const locale   = navigator.language || 'ht';
  return { device, browser, os, timezone, locale };
}

export function useAuthDeviceInfo() {
  const deviceInfo = useMemo(parseDevice, []);
  return { deviceInfo };
}
