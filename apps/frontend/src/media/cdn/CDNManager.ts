import type { MediaTransform } from '../types/core';

const CDN_BASE_URL = (typeof process !== 'undefined' ? process.env['VITE_CDN_BASE_URL'] : undefined) ?? '';

function buildUrl(storageKey: string, transform?: MediaTransform): string {
  if (!transform) return `${CDN_BASE_URL}/${storageKey}`;

  const params = new URLSearchParams();

  if (transform.width)     params.set('w',    String(transform.width));
  if (transform.height)    params.set('h',    String(transform.height));
  if (transform.quality)   params.set('q',    String(transform.quality));
  if (transform.format)    params.set('fm',   transform.format);
  if (transform.fit)       params.set('fit',  transform.fit);
  if (transform.blur)      params.set('blur', String(transform.blur));
  if (transform.grayscale) params.set('gray', '1');
  if (transform.rotate)    params.set('rot',  String(transform.rotate));
  if (transform.flip)      params.set('flip', transform.flip);

  if (transform.watermark) {
    params.set('wm_pos', transform.watermark.position);
    if (transform.watermark.text)     params.set('wm_text', transform.watermark.text);
    if (transform.watermark.imageKey) params.set('wm_img',  transform.watermark.imageKey);
  }

  return `${CDN_BASE_URL}/${storageKey}?${params.toString()}`;
}

// Request a signed CDN URL from the backend (for private media)
async function getSignedUrl(storageKey: string, expiresInSeconds = 3600): Promise<string> {
  const res = await fetch('/api/media/cdn/signed-url', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ storageKey, expiresInSeconds }),
  });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json() as { url: string };
  return json.url;
}

// Purge CDN cache for one or more keys (admin only)
async function purgeCache(storageKeys: string[]): Promise<void> {
  const res = await fetch('/api/media/cdn/purge', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ storageKeys }),
  });
  if (!res.ok) throw new Error(await res.text());
}

// Build a srcset string for responsive images
function buildSrcSet(storageKey: string, widths: number[], format: 'webp' | 'avif' | 'jpeg' = 'webp', quality = 80): string {
  return widths
    .map(w => `${buildUrl(storageKey, { width: w, format, quality })} ${w}w`)
    .join(', ');
}

// Resolve the best CDN edge based on user geolocation hint
async function resolveEdge(): Promise<string> {
  try {
    const res  = await fetch('/api/media/cdn/edge');
    const json = await res.json() as { edgeUrl: string };
    return json.edgeUrl;
  } catch {
    return CDN_BASE_URL;
  }
}

export const CDNManager = {
  buildUrl,
  buildSrcSet,
  getSignedUrl,
  purgeCache,
  resolveEdge,
};
