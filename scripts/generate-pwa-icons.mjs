// Pure-Node PNG icon generator — no external dependencies
// Generates JobFast lightning bolt icons for PWA/iOS

import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';

// ── Minimal PNG encoder ──────────────────────────────────────────

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (c & 1 ? 0xEDB88320 : 0);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const l = Buffer.allocUnsafe(4); l.writeUInt32BE(data.length, 0);
  const cr = Buffer.allocUnsafe(4); cr.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([l, t, data, cr]);
}

function encodePNG(width, height, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = ihdr[11] = ihdr[12] = 0; // RGBA

  const raw = Buffer.allocUnsafe(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixels[y * width + x];
      const i = y * (1 + width * 4) + 1 + x * 4;
      raw[i] = r; raw[i+1] = g; raw[i+2] = b; raw[i+3] = a;
    }
  }

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Drawing ──────────────────────────────────────────────────────

// Lightning bolt polygon (0..1 normalized)
const BOLT = [
  [0.60, 0.05],
  [0.35, 0.05],
  [0.22, 0.50],
  [0.45, 0.50],
  [0.40, 0.95],
  [0.65, 0.95],
  [0.78, 0.50],
  [0.55, 0.50],
];

function inPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (((yi > py) !== (yj > py)) && px < (xj - xi) * (py - yi) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

const BG   = [5, 11, 24, 255];   // #050B18
const GOLD = [250, 204, 21, 255]; // #FACC15

function generateIcon(size) {
  const ss = size >= 128 ? 4 : 2; // supersampling factor for anti-aliasing
  const pixels = [];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hits = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const fx = (x + (sx + 0.5) / ss) / size;
          const fy = (y + (sy + 0.5) / ss) / size;
          if (inPoly(fx, fy, BOLT)) hits++;
        }
      }
      const t = hits / (ss * ss);
      pixels.push(t === 0 ? BG : t === 1 ? GOLD : [
        Math.round(BG[0] * (1 - t) + GOLD[0] * t),
        Math.round(BG[1] * (1 - t) + GOLD[1] * t),
        Math.round(BG[2] * (1 - t) + GOLD[2] * t),
        255,
      ]);
    }
  }

  return encodePNG(size, size, pixels);
}

// ── Output ───────────────────────────────────────────────────────

mkdirSync('apps/frontend/public/icons', { recursive: true });

for (const size of [72, 96, 128, 192, 512]) {
  const buf = generateIcon(size);
  writeFileSync(`apps/frontend/public/icons/icon-${size}x${size}.png`, buf);
  console.log(`✓ icon-${size}x${size}.png  (${(buf.length/1024).toFixed(1)} KB)`);
}

const apple = generateIcon(180);
writeFileSync('apps/frontend/public/apple-touch-icon.png', apple);
console.log(`✓ apple-touch-icon.png  (${(apple.length/1024).toFixed(1)} KB)`);

console.log('\nDone! All PWA icons generated.');
