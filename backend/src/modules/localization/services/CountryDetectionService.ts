/**
 * CountryDetectionService — multi-signal country detection.
 *
 * Signal priority (highest → lowest):
 *   1. user_selected  — user explicitly confirmed in app
 *   2. sim            — MCC code from device (mobile app header)
 *   3. gps            — GPS region header (X-GPS-Country)
 *   4. ip             — CF-IPCountry (Cloudflare) or X-Country-Code
 *   5. device_locale  — Accept-Language BCP47 tag → country mapping
 *   6. default        — 'HT' (JOBFAST primary market)
 */
import type { Request } from 'express';
import type { DetectionSource } from '../types/localization.types.js';

// BCP 47 language tag → most likely country mapping
const LANG_TO_COUNTRY: Record<string, string> = {
  'ht': 'HT',   // Haitian Creole → Haiti
  'fr': 'FR',   // French → France (not Haiti — FR covers more)
  'fr-HT': 'HT',
  'fr-CA': 'CA',
  'fr-BE': 'BE',
  'en': 'US',
  'en-US': 'US',
  'en-GB': 'GB',
  'en-CA': 'CA',
  'en-AU': 'AU',
  'es': 'DO',   // Spanish default → Dominican Republic (JOBFAST RD context)
  'es-DO': 'DO',
  'es-MX': 'MX',
  'es-CO': 'CO',
  'es-419': 'DO',  // Latin American Spanish
  'pt': 'BR',
  'pt-BR': 'BR',
  'pt-PT': 'PT',
  'de': 'DE',
  'de-DE': 'DE',
  'ar': 'AE',
  'ar-AE': 'AE',
  'ar-SA': 'SA',
  'zh': 'CN',
  'zh-CN': 'CN',
  'zh-TW': 'TW',
};

// MCC (Mobile Country Code) prefix → ISO country
const MCC_TO_COUNTRY: Record<string, string> = {
  '372': 'HT', '370': 'DO', '310': 'US', '311': 'US', '312': 'US',
  '208': 'FR', '302': 'CA', '724': 'BR', '262': 'DE', '424': 'AE',
  '334': 'MX', '732': 'CO', '234': 'GB', '235': 'GB',
};

export interface DetectionResult {
  country:       string;
  detectedFrom:  DetectionSource;
  confidence:    number;  // 0-100
}

export const CountryDetectionService = {
  /**
   * Detect country from an Express request.
   * Reads standard Cloudflare + custom headers set by the API gateway.
   */
  fromRequest(req: Request): DetectionResult {
    // 1. User-selected via X-User-Country header (set after confirmation)
    const userSelected = req.headers['x-user-country'];
    if (userSelected && typeof userSelected === 'string' && userSelected.length === 2) {
      return { country: userSelected.toUpperCase(), detectedFrom: 'user_selected', confidence: 100 };
    }

    // 2. SIM / MCC header (set by mobile app or API gateway)
    const mcc = req.headers['x-sim-mcc'];
    if (mcc && typeof mcc === 'string') {
      const prefix = mcc.slice(0, 3);
      const country = MCC_TO_COUNTRY[prefix];
      if (country) return { country, detectedFrom: 'sim', confidence: 95 };
    }

    // 3. GPS country (set by mobile app after permission granted)
    const gpsCountry = req.headers['x-gps-country'];
    if (gpsCountry && typeof gpsCountry === 'string' && gpsCountry.length === 2) {
      return { country: gpsCountry.toUpperCase(), detectedFrom: 'gps', confidence: 95 };
    }

    // 4. IP-based (Cloudflare CF-IPCountry or custom X-Country-Code)
    const cfCountry = req.headers['cf-ipcountry'] ?? req.headers['x-country-code'];
    if (cfCountry && typeof cfCountry === 'string' && cfCountry.length === 2 && cfCountry !== 'XX') {
      return { country: cfCountry.toUpperCase(), detectedFrom: 'ip', confidence: 80 };
    }

    // 5. Accept-Language → language → country
    const acceptLang = req.headers['accept-language'];
    if (acceptLang) {
      const country = _langToCountry(acceptLang);
      if (country) return { country, detectedFrom: 'device_locale', confidence: 60 };
    }

    // 6. Default: Haiti (JOBFAST primary market)
    return { country: 'HT', detectedFrom: 'default', confidence: 20 };
  },

  /**
   * Detect country from GPS coordinates (Haversine proximity to country centroids).
   * Used when the app sends GPS data and we need to map it to a country.
   */
  fromGPS(lat: number, lng: number): string {
    const CENTROIDS: Array<{ code: string; lat: number; lng: number }> = [
      { code: 'HT', lat: 18.97,  lng: -72.29 },
      { code: 'DO', lat: 18.74,  lng: -70.16 },
      { code: 'US', lat: 37.09,  lng: -95.71 },
      { code: 'FR', lat: 46.23,  lng:   2.21 },
      { code: 'CA', lat: 56.13,  lng: -106.35},
      { code: 'BR', lat: -14.24, lng: -51.93 },
      { code: 'DE', lat: 51.17,  lng:  10.45 },
      { code: 'AE', lat: 23.42,  lng:  53.85 },
      { code: 'MX', lat: 23.63,  lng: -102.55},
      { code: 'CO', lat:  4.57,  lng:  -74.30},
      { code: 'GB', lat: 55.38,  lng:  -3.44 },
    ];

    let nearest = 'HT';
    let minDist = Infinity;
    for (const c of CENTROIDS) {
      const dist = _haversine(lat, lng, c.lat, c.lng);
      if (dist < minDist) { minDist = dist; nearest = c.code; }
    }
    return nearest;
  },

  /**
   * Detect country from language tag (BCP 47).
   */
  fromLanguage(lang: string): string {
    return _langToCountry(lang) ?? 'HT';
  },
};

function _langToCountry(acceptLang: string): string | null {
  // Parse Accept-Language: "fr-HT,fr;q=0.9,en;q=0.8"
  const tags = acceptLang.split(',').map(p => p.split(';')[0]?.trim() ?? '').filter(Boolean);
  for (const tag of tags) {
    if (LANG_TO_COUNTRY[tag])            return LANG_TO_COUNTRY[tag] ?? null;
    const short = tag.split('-')[0] ?? '';
    if (short && LANG_TO_COUNTRY[short]) return LANG_TO_COUNTRY[short] ?? null;
  }
  return null;
}

function _haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R   = 6371;
  const dLat = _rad(lat2 - lat1);
  const dLng = _rad(lng2 - lng1);
  const a   = Math.sin(dLat / 2) ** 2 +
              Math.cos(_rad(lat1)) * Math.cos(_rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function _rad(deg: number): number { return deg * Math.PI / 180; }