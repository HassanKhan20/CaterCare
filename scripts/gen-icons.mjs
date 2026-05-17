// Generates PWA icons from the Catercare brand mark (circle + wave),
// olive palette. Run: node scripts/gen-icons.mjs
import { createRequire } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const sharp = require(
  resolve('node_modules/.pnpm/sharp@0.34.5/node_modules/sharp'),
);

const BG = '#ECEDE6';
const ACCENT = '#5C7546';

// Brand mark on a transparent field (used for 192/512 standard icons)
function markSVG(size, withBg) {
  const s = size;
  const c = s / 2;
  const r = s * 0.34;
  const sw = s * 0.05;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  ${withBg ? `<rect width="${s}" height="${s}" rx="${s * 0.22}" fill="${BG}"/>` : ''}
  <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${ACCENT}" stroke-width="${sw}"/>
  <path d="M ${c - r * 0.62} ${c} q ${r * 0.31} ${-r * 0.55} ${r * 0.62} 0 q ${r * 0.31} ${r * 0.55} ${r * 0.62} 0"
        fill="none" stroke="${ACCENT}" stroke-width="${sw}" stroke-linecap="round"/>
</svg>`;
}

// Maskable: full-bleed olive bg with the mark inside the ~80% safe zone
function maskableSVG(size) {
  const s = size;
  const c = s / 2;
  const r = s * 0.26;
  const sw = s * 0.045;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" fill="${BG}"/>
  <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${ACCENT}" stroke-width="${sw}"/>
  <path d="M ${c - r * 0.62} ${c} q ${r * 0.31} ${-r * 0.55} ${r * 0.62} 0 q ${r * 0.31} ${r * 0.55} ${r * 0.62} 0"
        fill="none" stroke="${ACCENT}" stroke-width="${sw}" stroke-linecap="round"/>
</svg>`;
}

const outDir = resolve('public/icons');
mkdirSync(outDir, { recursive: true });

async function png(svg, file, size) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  writeFileSync(resolve(outDir, file), buf);
  console.log('wrote', file);
}

await png(markSVG(192, false), 'icon-192.png', 192);
await png(markSVG(512, false), 'icon-512.png', 512);
await png(maskableSVG(512), 'icon-maskable-512.png', 512);
// Apple touch icon must be opaque (iOS adds its own rounding)
await png(markSVG(180, true), '../apple-touch-icon.png', 180);
console.log('done');
