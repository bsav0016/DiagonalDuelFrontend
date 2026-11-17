// Draws a simpler Diagonal Duel icon (a 5x5 diamond board with bigger discs and a clear winning line) and a preview
// that shows it next to the current icon at the sizes a phone actually uses.
//   node scripts/make-icon-options.js <path to chrome(.exe)>   Output: docs/store/icon-simple-1024.png, icon-compare.png
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const out = path.join(__dirname, '..', 'docs', 'store');
const current = fs.readFileSync(path.join(__dirname, '..', 'assets', 'images', 'icon.png')).toString('base64');

const STEP = 118;
const K = Math.SQRT1_2;
const pos = (i, j) => [512 + ((i - 2) * STEP - (j - 2) * STEP) * K, 512 + ((i - 2) * STEP + (j - 2) * STEP) * K];
// Yellow: four on the screen-horizontal line (the winning line). Red: a few others. Everything else is empty.
const YELLOW = [[0, 4], [1, 3], [2, 2], [3, 1]];
const RED = [[1, 1], [3, 3], [2, 4], [4, 2], [0, 2]];

function discs() {
  const lit = (list, i, j) => list.some(([a, b]) => a === i && b === j);
  let svg = '';
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      const [x, y] = pos(i, j);
      if (lit(YELLOW, i, j)) svg += `<circle cx="${x}" cy="${y}" r="55" fill="#FACC15" filter="url(#glow)"/>`;
      else if (lit(RED, i, j)) svg += `<circle cx="${x}" cy="${y}" r="52" fill="#EF4444"/>`;
      else svg += `<circle cx="${x}" cy="${y}" r="46" fill="#3B82F6"/>`;
    }
  }
  const [x1, y1] = pos(0, 4);
  const [x2, y2] = pos(3, 1);
  svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#fff" stroke-width="16" stroke-linecap="round"/>`;
  return svg;
}

const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5a73f0"/><stop offset="1" stop-color="#2a3aa8"/></linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <rect x="${512 - 330}" y="${512 - 330}" width="660" height="660" rx="78" fill="#1B2380" transform="rotate(45 512 512)"/>
  ${discs()}
</svg>`;

(async () => {
  const exe = process.argv[2];
  if (!exe) throw new Error('Pass the path to a Chromium executable.');
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0">${icon}</body>`);
  await page.screenshot({ path: path.join(out, 'icon-simple-1024.png') });

  const simple = fs.readFileSync(path.join(out, 'icon-simple-1024.png')).toString('base64');
  const tile = (src, size) => `<img src="data:image/png;base64,${src}" style="width:${size}px;height:${size}px;border-radius:${Math.round(size * 0.22)}px">`;
  const row = (label, src) => `<div style="display:flex;align-items:center;gap:28px;margin:18px 0"><div style="width:120px;font:600 22px system-ui">${label}</div>${tile(src, 240)}${tile(src, 120)}${tile(src, 60)}${tile(src, 40)}</div>`;
  await page.setViewportSize({ width: 760, height: 560 });
  await page.setContent(`<body style="margin:0;padding:24px;background:#f3f5f9;font-family:system-ui">${row('Current', current)}${row('Simpler', simple)}</body>`);
  await page.screenshot({ path: path.join(out, 'icon-compare.png') });
  await browser.close();
  console.log('icon options written');
})();
