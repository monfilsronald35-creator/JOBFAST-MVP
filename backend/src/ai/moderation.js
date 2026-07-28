/**
 * AI — Content Moderation
 * Text: profanity filter, spam detection, PII detection
 * Image: Supabase Storage moderation hook (stub for external API)
 */

// Basic profanity list (extend as needed)
const BLOCKED_WORDS = ['spam', 'scam', 'fake', 'fraud'];

const PII_PATTERNS = [
  /\b\d{10,11}\b/g,                                  // Phone numbers
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}\b/gi, // Emails
  /\b\d{3}-\d{2}-\d{4}\b/g,                          // SSN-like
];

const SPAM_PATTERNS = [
  /buy now/i, /click here/i, /free money/i, /guaranteed/i,
  /whatsapp me/i, /call me at/i, /send me/i,
];

export function moderateText(text = '') {
  if (!text) return { ok: true, flags: [], score: 0 };

  const flags  = [];
  let   score  = 0;
  const lower  = text.toLowerCase();

  // Profanity
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) { flags.push({ type: 'profanity', term: word }); score += 20; }
  }

  // Spam patterns
  for (const pat of SPAM_PATTERNS) {
    if (pat.test(text)) { flags.push({ type: 'spam', pattern: pat.source }); score += 15; }
  }

  // PII detection
  for (const pat of PII_PATTERNS) {
    const matches = text.match(pat);
    if (matches) { flags.push({ type: 'pii', count: matches.length }); score += 10; }
  }

  // Length anomaly
  if (text.length > 5000) { flags.push({ type: 'excessive_length' }); score += 5; }

  // All caps (shouting)
  const words = text.split(/\s+/);
  const capsRatio = words.filter(w => w === w.toUpperCase() && /[A-Z]/.test(w)).length / words.length;
  if (capsRatio > 0.6) { flags.push({ type: 'all_caps' }); score += 10; }

  return {
    ok:     score < 30,
    action: score >= 60 ? 'block' : score >= 30 ? 'review' : 'allow',
    score:  Math.min(score, 100),
    flags,
  };
}

// Sanitize text: strip PII before storage
export function sanitizeText(text = '') {
  let sanitized = text;
  for (const pat of PII_PATTERNS) {
    sanitized = sanitized.replace(pat, '[REDACTED]');
  }
  return sanitized;
}

// Image moderation stub — integrate with Google Vision or AWS Rekognition
export async function moderateImage(imageUrl) {
  // TODO: call external moderation API
  // const result = await googleVision.safeSearch(imageUrl);
  return { ok: true, action: 'allow', score: 0, flags: [] };
}

// Profile moderation — check bio, name, photo
export async function moderateProfile(profile) {
  const results = {};
  if (profile.bio)  results.bio  = moderateText(profile.bio);
  if (profile.name) results.name = moderateText(profile.name);
  const overallOk = Object.values(results).every(r => r.ok);
  return { ok: overallOk, fields: results };
}

export default { moderateText, moderateImage, moderateProfile, sanitizeText };
