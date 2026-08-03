"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nowMs = exports.generateId = void 0;
exports.encodeCursor = encodeCursor;
exports.decodeCursor = decodeCursor;
exports.msToISO = msToISO;
exports.slugify = slugify;
exports.maskEmail = maskEmail;
exports.omit = omit;
exports.pick = pick;
exports.formatMinorUnits = formatMinorUnits;
exports.withRetry = withRetry;
const crypto_1 = require("crypto");
// ——— ID generation ————————————————————————————————————————————————————————
const generateId = () => (0, crypto_1.randomUUID)();
exports.generateId = generateId;
function encodeCursor(payload) {
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
}
function decodeCursor(cursor) {
    try {
        return JSON.parse(Buffer.from(cursor, 'base64url').toString());
    }
    catch {
        return null;
    }
}
// ——— Date ————————————————————————————————————————————————————————————————————
const nowMs = () => Date.now();
exports.nowMs = nowMs;
function msToISO(ms) {
    return new Date(ms).toISOString();
}
// ——— String ——————————————————————————————————————————————————————————————————
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
function maskEmail(email) {
    const [user, domain] = email.split('@');
    if (!user || !domain)
        return '***';
    return `${user[0]}***${user.slice(-1)}@${domain}`;
}
// ——— Object ——————————————————————————————————————————————————————————————————
function omit(obj, keys) {
    const result = { ...obj };
    for (const k of keys)
        delete result[k];
    return result;
}
function pick(obj, keys) {
    const result = {};
    for (const k of keys)
        result[k] = obj[k];
    return result;
}
// ——— Money ——————————————————————————————————————————————————————————————————
/** Convert integer minor units to display string — e.g. 1050 → "10.50" */
function formatMinorUnits(amount, currency = 'USD') {
    const divisor = currency === 'HTG' ? 100 : 100;
    return (amount / divisor).toFixed(2);
}
// ——— Retry ——————————————————————————————————————————————————————————————————
async function withRetry(fn, maxAttempts = 3, baseDelayMs = 500) {
    let lastErr;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
            lastErr = err;
            if (attempt < maxAttempts - 1) {
                await new Promise(r => setTimeout(r, baseDelayMs * 2 ** attempt));
            }
        }
    }
    throw lastErr;
}
//# sourceMappingURL=index.js.map