// Spike evaluation: screenshots, bytes loaded per spike (gzip) and a rough FPS sample.
// Usage: npm run build && npx vite preview --port 5318 & node scripts/evaluate.mjs [baseUrl]
// Writes docs/img/*.jpg, public/thumbs/*.jpg and docs/spike-metrics.json.
import { chromium } from 'playwright';
import { gzipSync } from 'node:zlib';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const BASE = process.argv[2] ?? 'http://127.0.0.1:5318/how-the-internet-works/';
const SPIKES = ['svg-gsap', 'svelte-svg', 'pixi', 'three-25d'];
const SHOTS = [
  { scene: 'overview', lang: 'en', w: 1280, h: 800 },
  { scene: 'wifi', lang: 'en', w: 1280, h: 800 },
  { scene: 'fibre', lang: 'da', w: 1280, h: 800 },
  { scene: 'overview', lang: 'ar', w: 1280, h: 800 },
  { scene: 'wifi', lang: 'da', w: 390, h: 844, tag: 'mobile' },
];
// GPU-backed headless where available (macOS: Metal via ANGLE); CPU swiftshader otherwise.
const ARGS = process.env.SWIFTSHADER ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];

mkdirSync('docs/img', { recursive: true });
mkdirSync('public/thumbs', { recursive: true });
const browser = await chromium.launch({ args: ARGS });
const metrics = {};

async function page(w, h) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 600 ? 2 : 1, hasTouch: w < 600 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => console.log('  pageerror', e.message));
  return { ctx, p };
}

/** Count frames over `ms`: fps, worst frame and main-thread busy time per frame (CDP TaskDuration). */
async function sample(p, cdp, ms) {
  const busy = async () => (await cdp.send('Performance.getMetrics')).metrics.find((m) => m.name === 'TaskDuration').value;
  const b0 = await busy();
  const r = await rafCount(p, ms);
  const b1 = await busy();
  return { ...r, cpuMsPerFrame: +(((b1 - b0) * 1000) / r.frames).toFixed(2) };
}
const rafCount = (p, ms) => p.evaluate((ms) => new Promise((res) => {
  let n = 0, last = performance.now(), worst = 0; const t0 = last;
  const f = (t) => { worst = Math.max(worst, t - last); last = t; n++; if (t - t0 < ms) requestAnimationFrame(f); else res({ fps: Math.round((n * 1000) / (t - t0)), worstMs: Math.round(worst), frames: n }); };
  requestAnimationFrame(f);
}), ms);

for (const spike of SPIKES) {
  console.log(spike);
  const m = (metrics[spike] = {});

  // 1. bytes: everything the page actually fetched from dist/, gzipped
  {
    const { ctx, p } = await page(1280, 800);
    const files = new Set();
    p.on('requestfinished', (r) => { const u = new URL(r.url()); if (u.href.startsWith(BASE)) files.add(u.pathname.replace('/how-the-internet-works/', '')); });
    await p.goto(`${BASE}spikes/${spike}/#/en/overview`);
    await p.waitForTimeout(2500);
    const size = { js: 0, css: 0, font: 0, other: 0 };
    for (const f of files) {
      const path = `dist/${f.endsWith('/') || f === '' ? f + 'index.html' : f}`;
      if (!existsSync(path)) continue;
      const buf = readFileSync(path);
      const kind = f.endsWith('.js') ? 'js' : f.endsWith('.css') ? 'css' : /\.woff2?$/.test(f) ? 'font' : 'other';
      size[kind] += kind === 'font' ? buf.length : gzipSync(buf).length;
    }
    m.kB = Object.fromEntries(Object.entries(size).map(([k, v]) => [k, +(v / 1024).toFixed(1)]));

    // 2. fps: idle overview, during a semantic-zoom flight, and the same with 4x CPU throttle
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Performance.enable');
    m.fps = {};
    m.fps.overview = await sample(p, cdp, 2000);
    await p.evaluate(() => { location.hash = '#/en/fibre'; });
    m.fps.flight = await sample(p, cdp, 1500);
    await p.waitForTimeout(500);
    m.fps.fibre = await sample(p, cdp, 1500);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
    await p.evaluate(() => { location.hash = '#/en/overview'; });
    m.fps.flightThrottled6x = await sample(p, cdp, 1500);
    await p.waitForTimeout(500);
    m.fps.overviewThrottled6x = await sample(p, cdp, 2000);
    await ctx.close();
  }

  // 3. screenshots
  for (const s of SHOTS) {
    const { ctx, p } = await page(s.w, s.h);
    await p.goto(`${BASE}spikes/${spike}/#/${s.lang}/${s.scene}`);
    await p.waitForTimeout(3000);
    const out = `docs/img/${spike}-${s.scene}-${s.lang}${s.tag ? '-' + s.tag : ''}.jpg`;
    await p.screenshot({ path: out, type: 'jpeg', quality: 78 });
    if (s.scene === 'overview' && s.lang === 'en') {
      await p.screenshot({ path: `public/thumbs/${spike}.jpg`, type: 'jpeg', quality: 80, clip: { x: 160, y: 190, width: 960, height: 600 } });
    }
    await ctx.close();
  }
  console.log(' ', JSON.stringify(m));
}
writeFileSync('docs/spike-metrics.json', JSON.stringify({ generated: new Date().toISOString(), gpu: !process.env.SWIFTSHADER, metrics }, null, 2) + '\n');
await browser.close();
