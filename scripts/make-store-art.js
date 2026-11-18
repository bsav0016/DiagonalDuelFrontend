// Makes the store screenshots from the real app captures in docs/store/raw (taken from the running app on an Android
// emulator): each capture goes in a phone frame under a short headline on the app's blue. Needs playwright-core and a
// Chromium: node scripts/make-store-art.js <path to chrome(.exe)>   Output: docs/store/ios and docs/store/android.
//
// The captures are cropped of the phone's own status bar and gesture bar first, so no Android-only chrome shows in
// the iPhone images.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const raw = path.join(__dirname, '..', 'docs', 'store', 'raw');
const SHOTS = [
  // showTo: the capture row (of 2400) where the useful part of the screen ends; the empty space below is left out.
  { file: 'puzzle.png', name: '1-daily-puzzle', title: 'A new puzzle every day', showTo: 1750 },
  { file: 'threat.png', name: '2-block-the-line', title: 'Block it before they win', showTo: 1990 },
  { file: 'puzzle-solved.png', name: '3-keep-your-streak', title: 'Keep your streak going', showTo: 1950 },
  { file: 'win.png', name: '4-four-in-a-row', title: 'Line up four to win', showTo: 1990 },
  { file: 'level.png', name: '5-play-the-computer', title: 'Play the computer, level 0 to 100', showTo: 1700 },
  { file: 'how-to-play.png', name: '6-learn-in-a-minute', title: 'Easy to learn in a minute', showTo: 2290 },
  { file: 'home.png', name: '7-ways-to-play', title: 'Puzzle, computer, friends or online', showTo: 2200 },
];
// 1080x2400 captures: drop the status bar at the top and the gesture bar at the bottom.
const CROP_TOP = 118;
const SRC_W = 1080;

const TARGETS = [
  { dir: 'ios', w: 1290, h: 2796, top: 150, headline: 118, phoneW: 1090, bezel: 16, radius: 80, bottomMargin: 110 },
  { dir: 'android', w: 1080, h: 1920, top: 64, headline: 80, phoneW: 850, bezel: 12, radius: 58, bottomMargin: 70 },
];

function html(t, shot, dataUrl) {
  const imgW = t.phoneW - 2 * t.bezel;
  const scale = imgW / SRC_W;
  const imgH = Math.round((shot.showTo - CROP_TOP) * scale);
  // The headline takes up to two lines; the phone sits centred in the space below it.
  const headlineBottom = t.top + Math.round(t.headline * 1.12 * 2);
  const phoneH = imgH + 2 * t.bezel;
  const free = t.h - headlineBottom - t.bottomMargin;
  const phoneTop = headlineBottom + Math.max(30, Math.round((free - phoneH) / 2));
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; margin: 0; }
    body { width: ${t.w}px; height: ${t.h}px; overflow: hidden; font-family: 'Segoe UI', system-ui, Roboto, Arial, sans-serif;
      background: linear-gradient(160deg, #5a73f0 0%, #4058DA 45%, #2a3aa8 100%); position: relative; }
    h1 { position: absolute; left: 0; right: 0; top: ${t.top}px; text-align: center; color: #fff; font-weight: 800;
      font-size: ${t.headline}px; line-height: 1.12; letter-spacing: -1px; padding: 0 ${Math.round(t.w * 0.07)}px; text-wrap: balance; }
    .phone { position: absolute; left: ${Math.round((t.w - t.phoneW) / 2)}px; top: ${phoneTop}px;
      width: ${t.phoneW}px; padding: ${t.bezel}px; background: #0f1630; border-radius: ${t.radius}px;
      box-shadow: 0 0 80px rgba(8, 14, 60, .55); }
    .screen { width: ${imgW}px; height: ${imgH}px; overflow: hidden; border-radius: ${t.radius - t.bezel}px; }
    .screen img { display: block; width: ${imgW}px; margin-top: -${Math.round(CROP_TOP * scale)}px; }
  </style></head><body>
    <h1>${shot.title}</h1>
    <div class="phone"><div class="screen"><img src="${dataUrl}"></div></div>
  </body></html>`;
}

(async () => {
  const exe = process.argv[2];
  if (!exe) throw new Error('Pass the path to a Chromium executable.');
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  for (const t of TARGETS) {
    for (const shot of SHOTS) {
      const data = fs.readFileSync(path.join(raw, shot.file)).toString('base64');
      const page = await browser.newPage({ viewport: { width: t.w, height: t.h }, deviceScaleFactor: 1 });
      await page.setContent(html(t, shot, `data:image/png;base64,${data}`));
      await page.screenshot({ path: path.join(__dirname, '..', 'docs', 'store', t.dir, `${shot.name}.png`) });
      await page.close();
    }
  }
  await browser.close();
  console.log('store screenshots written');
})();
