// App evaluation: screenshots (desktop + portrait phone, and a few short-landscape phone) of the key places, dives,
// layer dives, languages and a caught packet (pause + step, the peek and its detail tree), bytes loaded, and frame
// timings (idle, zoom flights, a 3-level dive, sideways travel between dives, catching and stepping a packet, the place
// morphs (back to 1995, and to the street), opening a layer dive from the peek and stepping up the stack) at 1× and 6×
// CPU throttle.
// Usage: npm run build && npx vite preview --host 127.0.0.1 --port 5318 &  npm run evaluate [-- baseUrl] [--only=shots|perf|a11y|vision|fit|subpath] [--style=id]
//   [--mode=night]       night mode (issue #43): shots as app-<style>-night-*.jpg, metrics under "<style>-night"
//   --only=a11y          accessibility (#53): axe-core (WCAG 2.2 A/AA + best practice) on the key states in every view,
//                        and keyboard journeys (Tab never lands on the page, on something hidden or without a visible
//                        ring; focus comes back after a door, a catch, the picker and the time machine; read aloud
//                        and the announcer say a scene's description; the first-run coach marks, which every other
//                        run skips; the ▶ walk, with nothing on the console); every control at least 24 px, not cut
//                        off (at 200 % zoom too: the zoom view) and not under another; every scene's labels at 4.5:1
//                        (3:1 when large) on their halo or what's behind them. Prints what fails, exits 1 if anything does; writes nothing.
//   --only=vision        colour-vision sheets (#53): a few scenes and the chrome as seen with protanopia, deuteranopia,
//                        tritanopia and achromatopsia, and with forced colours. Writes .tmp/vision/*.png to look at.
//   --only=fit           every dive fits its panel (#136): each dive on every route, on a phone upright and on its
//                        side, in both languages, at both levels: no text or technical tag past the frame drawn round its
//                        panel, off the window or under the chrome, no card across the frame, and nothing on the
//                        console. Prints what's cut, exits 1 if anything is; writes nothing.
//   --only=subpath       the build under a sub-path (#185): serves dist/ itself at /how-the-internet-works/ (as GitHub
//                        Pages does; no preview server needed) and checks that everything that loads, lazily too, stays
//                        under it, the icons and og:image. Exits 1 on any problem; writes nothing.
//   [--diff=<otherUrl>]  pixel diff instead: every screenshot (lossless, the clock held still, taken until two in a row
//                        match) from baseUrl against the same one from otherUrl (e.g. main, built and previewed on
//                        another port). Prints the changed pixels per shot and writes .tmp/diff/<name>.png (changes in
//                        red) for those that differ.
// Writes docs/img/app-<style>-*.jpg and merges into docs/app-metrics.json (other styles' entries are kept).
// Runs take turns machine-wide (a lock in the temp dir, scripts/lock.mjs); EVALUATE_NO_LOCK=1 opts out.
import { chromium } from 'playwright';
import { gzipSync } from 'node:zlib';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join } from 'node:path';
import { lock } from './lock.mjs';

const args = process.argv.slice(2);
const flag = (k) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const BASE = args.find((a) => !a.startsWith('--')) ?? 'http://127.0.0.1:5318/';
const ONLY = flag('only');
const MODE = flag('mode') === 'night' ? 'night' : 'day';
const DIFF = flag('diff');
const STYLES = flag('style')
  ? [flag('style')]
  : readdirSync('content/themes').filter((d) => existsSync(`content/themes/${d}/meta.json`))
      .sort((a, b) => JSON.parse(readFileSync(`content/themes/${a}/meta.json`)).order - JSON.parse(readFileSync(`content/themes/${b}/meta.json`)).order);
// zoom: a 1280 × 900 window at 200 % page zoom (or large text), which is a 640 × 450 CSS viewport at 2 px per px
const VIEWS = { desktop: { w: 1440, h: 900, dpr: 1 }, phone: { w: 390, h: 844, dpr: 2, touch: true }, short: { w: 844, h: 390, dpr: 2, touch: true }, zoom: { w: 640, h: 450, dpr: 2 } };
// GPU-backed headless: macOS through Metal, Linux through the GPU's EGL driver (Mesa; the lab runners pass /dev/dri
// into the container), both via ANGLE. SWIFTSHADER=1 forces the CPU renderer.
const GPU_ARGS = process.platform === 'linux' ? ['--use-gl=angle', '--use-angle=gl-egl'] : ['--use-angle=metal'];
const ARGS = process.env.SWIFTSHADER ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : [...GPU_ARGS, '--enable-gpu', '--ignore-gpu-blocklist'];

// One evaluate at a time on this machine (another lane's headless Chrome skews frame timings): scripts/lock.mjs.
await lock();

mkdirSync('docs/img', { recursive: true });
const browser = await chromium.launch({ args: ARGS });
{
  // which renderer Chrome ended up with (a missing or blocked GPU falls back to software quietly)
  const page = await browser.newPage();
  const gl = await page.evaluate(() => {
    const c = document.createElement('canvas').getContext('webgl');
    return c ? c.getParameter(c.getExtension('WEBGL_debug_renderer_info')?.UNMASKED_RENDERER_WEBGL ?? c.RENDERER) : 'no WebGL';
  });
  console.log(`  renderer: ${gl}`);
  await page.close();
}
const metricsPath = 'docs/app-metrics.json';
const old = existsSync(metricsPath) ? JSON.parse(readFileSync(metricsPath, 'utf8')).metrics : {};
const metrics = { ...old };

/** `speech`: give the page a fake speechSynthesis with an English and a Danish voice (a headless browser may have no
 *  voices at all), which notes what it was asked to say in `window.__said`; `on` also turns read aloud on (#53).
 *  `coach`: a first visit, which gets the coach marks (#21), or what a returning reader has stored (`'1'`: they had
 *  them before the time machine's card, #59); every other page has had them all already, so no shot, timing or check
 *  sees them unasked. `errors` collects the page's errors and console errors as they come (printed as well), for the
 *  checks that fail on them: the walk and the fit sweep (#182). */
async function open(view, url, speech = null, coach = false) {
  const v = VIEWS[view];
  const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: v.dpr, hasTouch: !!v.touch, isMobile: !!v.touch, colorScheme: MODE === 'night' ? 'dark' : 'light' });
  const p = await ctx.newPage();
  if (coach !== true) await p.addInitScript(coached, coach || undefined);
  if (speech) await p.addInitScript(fakeSpeech, speech.on);
  const errors = [];
  p.on('pageerror', (e) => { errors.push(e.message); console.log('  pageerror', e.message); });
  p.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); console.log('  console', m.text()); } });
  await p.goto(url);
  await p.waitForFunction(() => window.__app, null, { timeout: 15000 });
  await p.evaluate(() => document.fonts.ready);
  return { ctx, p, errors };
}
/** Had the coach marks (all of them, '2', unless told), unless the page has stored otherwise since. */
function coached(was = '2') { if (localStorage.getItem('coached') === null) localStorage.setItem('coached', was); }
function fakeSpeech(on) {
  const said = (window.__said = []);
  const voices = [{ lang: 'en-GB', default: true, localService: true, name: 'en' }, { lang: 'da-DK', default: false, localService: true, name: 'da' }];
  const synth = Object.assign(new EventTarget(), { speaking: false, getVoices: () => voices, speak: (u) => said.push(u.text), cancel() {} });
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  if (on) localStorage.setItem('speech', '1');
}
/** Wait for the camera to land. */
const settle = (p) => p.waitForFunction(() => !window.__app.busy(), null, { timeout: 8000 }).then(() => p.waitForTimeout(400));
/** Wait until the page stands still: the camera has landed (not `busy`) and no CSS animation or transition is running
 *  (`document.getAnimations()`), two frames after the last one ended. The a11y pass checks settled states only: a
 *  fixed wait let axe see the caught packet's envelopes mid fade-in on a slow (SWIFTSHADER) runner (#70). It allows
 *  30 s: it doesn't time anything, and a software-rendered flight at night on a CI runner can take over 8 s. */
const still = (p) => p.evaluate(async () => {
  const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  for (const end = performance.now() + 30000; performance.now() < end;) {
    await frames();
    if (window.__app.busy()) continue;
    const moving = document.getAnimations().filter((a) => a.playState === 'running' && Number.isFinite(a.effect?.getComputedTiming().endTime));
    if (!moving.length) return;
    await Promise.all(moving.map((a) => a.finished.catch(() => {})));
  }
  throw new Error('still moving after 30 s');
});
/** `where` is the hash after the language, e.g. 'home/watch-video/internet'. Every page is muted (`sound=off`, #189),
 *  so no run depends on audio. */
const url = (style, lang, where, q = '', base = BASE) => `${base}?style=${style}${MODE === 'night' ? '&mode=night' : ''}&sound=off${q}#/${lang}/${where}`;
/** Catch a packet of `kind` where it enters the view (`__app.catch`, #74), then step it on a hop for each hop after the
 *  first in `at`, checking each time that it waits at that hop. A catch that lands anywhere else (#40) fails the run
 *  rather than giving a different picture, or checking a different state. */
async function catchAt(p, kind, at, label) {
  await p.evaluate((k) => window.__app.catch(k), kind);
  await p.waitForSelector('.peek');
  for (const [i, hop] of at.entries()) {
    if (i) { await p.waitForTimeout(800); await p.evaluate(() => window.__app.step(1)); }
    const got = await p.evaluate(() => window.__app.caught()?.hop ?? null);
    if (got !== hop) throw new Error(`${label}: the caught ${kind} waits at ${got ?? 'nothing'}${i ? ` ${i} hop(s) on` : ''}, not at ${hop}`);
  }
}

/** For a pixel diff: screenshots until two in a row are the same. Under load the GPU now and then hands over a frame
 *  with some tiles not final yet (the page's dot grid, shadows and blurs off by a level or two). */
async function stableShot(p, name) {
  let a = await p.screenshot({ type: 'png' });
  for (let i = 0; i < 5; i++) {
    await p.waitForTimeout(100);
    const b = await p.screenshot({ type: 'png' });
    if (a.equals(b)) return a;
    a = b;
  }
  throw new Error(`${name}: still changing after 6 screenshots`);
}

/** In the page: compare two PNGs (base64). Returns the pixels that differ at all, those that differ visibly, the
 *  largest difference (sum over RGB), and a diff image: `b` faded, changes in red. */
async function comparePng([a, b]) {
  const load = (d) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `data:image/png;base64,${d}`; });
  const [ia, ib] = await Promise.all([load(a), load(b)]);
  const c = document.createElement('canvas');
  c.width = ia.width; c.height = ia.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(ia, 0, 0);
  const da = g.getImageData(0, 0, c.width, c.height).data;
  g.drawImage(ib, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height), db = img.data;
  let n = 0, big = 0, max = 0;
  for (let i = 0; i < da.length; i += 4) {
    const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
    if (d) { n++; if (d > 24) big++; if (d > max) max = d; db[i] = 255; db[i + 1] = 0; db[i + 2] = 60; }
    else { const v = 205 + (db[i] + db[i + 1] + db[i + 2]) / 15; db[i] = db[i + 1] = db[i + 2] = v; }
  }
  if (!n) return { n, big, max, total: da.length / 4, png: null };
  g.putImageData(img, 0, 0);
  return { n, big, max, total: da.length / 4, png: c.toDataURL('image/png').split(',')[1] };
}

/** Frame times over `ms` (rAF deltas) plus main-thread busy time per frame (CDP TaskDuration). */
async function sample(p, cdp, ms, during) {
  const busy = async () => (await cdp.send('Performance.getMetrics')).metrics.find((m) => m.name === 'TaskDuration').value;
  const b0 = await busy();
  const run = p.evaluate((ms) => new Promise((res) => {
    const d = []; let last = performance.now(); const t0 = last;
    const f = (t) => { d.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(f); else res(d); };
    requestAnimationFrame(f);
  }), ms);
  if (during) await during();
  const d = (await run).slice(1).sort((a, b) => a - b);
  const b1 = await busy();
  const q = (x) => +d[Math.min(d.length - 1, Math.floor(d.length * x))].toFixed(1);
  return { fps: Math.round((d.length * 1000) / d.reduce((a, b) => a + b, 0)), p50: q(0.5), p95: q(0.95), worst: q(1), cpuMsPerFrame: +(((b1 - b0) * 1000) / d.length).toFixed(2) };
}

// ------------------------------------------------------------------ accessibility (--only=a11y)
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const A11Y_STATES = [
  { name: 'overview', where: 'home/watch-video', views: ['desktop', 'phone', 'short', 'zoom'] },
  // "What can I explore?" on (#122): the caption lists the doors and packets, on the overview and in a dive
  { name: 'explore', where: 'home/watch-video', explore: true, views: ['desktop', 'phone', 'short', 'zoom'] },
  { name: 'explore-wifi', where: 'home/watch-video/phone-ap', explore: true, views: ['desktop', 'phone', 'short'] },
  { name: 'internet', where: 'home/watch-video/internet', views: ['desktop'] },
  { name: 'wifi', where: 'home/watch-video/phone-ap', views: ['desktop', 'phone', 'short', 'zoom'] },
  { name: 'router', where: 'home/watch-video/router', views: ['desktop'] },
  { name: 'ip', where: 'home/watch-video/router~ip', views: ['desktop', 'phone', 'zoom'] },
  // the caption folded away by its chevron (#168): the pill, its title alone
  { name: 'folded', where: 'home/watch-video/phone-ap', fold: true, views: ['desktop', 'phone'] },
  { name: 'technical-da', where: 'home/watch-video', lang: 'da', q: '&level=technical', views: ['desktop', 'zoom'] },
  { name: 'caught', where: 'home/watch-video', catch: 'video', at: ['router'], views: ['desktop', 'phone', 'short', 'zoom'] },
  { name: 'caught-detail', where: 'home/watch-video', q: '&level=technical', catch: 'video', at: ['router'], detail: true, views: ['desktop'] },
  // a phone's peek is a third of the screen (#139); its grip opens it all the way: the detail tree, Danish
  { name: 'caught-full', where: 'home/watch-video', lang: 'da', q: '&level=technical', catch: 'video', at: ['router'], detail: true, full: true, views: ['phone', 'short'] },
  { name: 'picker', where: 'home/watch-video', picker: true, views: ['desktop', 'phone', 'zoom'] },
  // another way online (#3): the phone line's dive; the picker in 1995 (#59), whose "On the go" is a laptop on GSM (#147)
  { name: 'dsl', where: 'home-dsl/watch-video/internet/home-cabinet', views: ['desktop', 'phone', 'short'] },
  { name: 'picker-1995', where: 'home-dialup/watch-video', q: '&level=technical', picker: true, views: ['phone', 'short'] },
  { name: 'dialup', where: 'home-dialup/watch-video/pc-internet', views: ['desktop', 'phone', 'short'] },
  // the time machine (#59): its panel from the top bar, on today's home; from the street on 1995, a laptop on a GSM
  // call (#147; `timeTo`: how many eras back); from its chip on the 2010 overview
  { name: 'time', where: 'home/watch-video', time: true, views: ['desktop', 'phone', 'short', 'zoom'] },
  { name: 'time-on-the-go', where: 'on-the-go/watch-video/phone~tcp', q: '&level=technical', time: true, timeTo: 2, views: ['desktop', 'phone', 'short', 'zoom'] },
  { name: 'time-chip', where: 'home-dsl/watch-video', lang: 'da', time: 'chip', views: ['desktop', 'phone'] },
  { name: 'ladder', where: 'home/watch-video', ladder: true, views: ['desktop', 'phone', 'short', 'zoom'] },
  { name: 'menu', where: 'home/watch-video/router', menu: true, views: ['desktop', 'phone', 'short', 'zoom'] },
  // the ⋯ menu over a caught packet's layers (#90)
  { name: 'caught-menu', where: 'home/watch-video', catch: 'video', at: ['router'], menu: true, views: ['desktop', 'phone', 'short'] },
  { name: 'about', where: 'home/watch-video', menu: true, about: true, views: ['desktop', 'phone', 'zoom'] },
  // the languages, the list ⋯ opens in its place: each by its own name, its name in the reader's and its code
  { name: 'languages', where: 'home/watch-video', lang: 'da', menu: true, languages: true, views: ['desktop', 'phone', 'short', 'zoom'] },
  // the scene's keys (#53): two stops along, the ring on the Wi‑Fi; and the list view, opened by the skip link
  { name: 'keys', where: 'home/watch-video', keys: 2, views: ['desktop', 'phone', 'short'] },
  { name: 'map', where: 'home/watch-video/internet', map: true, views: ['desktop', 'phone', 'short', 'zoom'] },
  // read aloud on: the caption's "Read again", and the ⋯ menu with its toggle (#53)
  { name: 'speech', where: 'home/watch-video/phone-ap', speech: true, views: ['desktop', 'phone', 'short'] },
  { name: 'speech-menu', where: 'home/watch-video', speech: true, menu: true, views: ['desktop', 'phone'] },
  // a Technical extra in a dive (#31), and in the list view
  { name: 'extra', where: 'home/watch-video/router-internet', lang: 'da', q: '&level=technical', views: ['desktop', 'phone', 'short'] },
  { name: 'extra-map', where: 'home/watch-video', q: '&level=technical', map: true, views: ['desktop', 'phone'] },
  // a first visit's coach marks (#21): the first, on "Open up", "What can I explore?" and the last, on the time machine
  // (`coach`: how many times Next was pressed); and the one card a reader who had them before the time machine gets
  { name: 'coach', where: 'home/watch-video', coach: 0, views: ['desktop', 'phone', 'short', 'zoom'] },
  { name: 'coach-explore', where: 'home/watch-video', coach: 2, views: ['desktop', 'phone', 'short', 'zoom'] },
  { name: 'coach-time', where: 'home/watch-video', coach: 3, views: ['desktop', 'phone', 'short', 'zoom'] },
  { name: 'coach-new', where: 'home/watch-video', coach: 0, coachWas: '1', lang: 'da', views: ['desktop', 'phone', 'short'] },
];
/** In the page: why the focused element is wrong (on the page itself, hidden, inert, or without a visible ring), or
 *  null. */
function focusProblem() {
  const e = document.activeElement;
  if (!e || e === document.body) return 'focus on the page';
  const name = `${e.tagName.toLowerCase()}${e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : ''} "${(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30)}"`;
  if (e.closest('[inert]')) return `${name} is inert`;
  let o = 1;
  for (let a = e; a; a = a.parentElement) {
    const cs = getComputedStyle(a);
    if (cs.visibility === 'hidden' || cs.display === 'none') return `${name} is hidden`;
    o *= +cs.opacity;
  }
  const r = e.getBoundingClientRect();
  if (o < 0.2 || r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return `${name} can't be seen`;
  if (e.matches(':focus-visible')) {
    const cs = getComputedStyle(e);
    // the scene's keys: a stop's ring is drawn in the scene (the theme's `kbd`); the whole scene's outline is scaled
    // with the camera (3 px on screen), so its own width means nothing
    if (e.matches('.scene-key:not([data-kind=scene])')) { if (!document.querySelector('#stage .kbd')) return `${name} has no ring in the scene`; }
    else if (cs.outlineStyle === 'none' || (!e.matches('.scene-key') && parseFloat(cs.outlineWidth) < 2)) return `${name} has no focus ring`;
  }
  return null;
}
/** In the page: what's wrong with the controls you can see (#53). Each is at least 24 × 24 px (WCAG 2.5.8, inline
 *  links too), inside the window or a box that scrolls (nothing cut off, at 200 % zoom too), and on top: no other
 *  control lies over it (bar an open pop-up, which Esc closes; one scrolled out of its box is checked when there). */
function controlProblems() {
  const out = [];
  const name = (e) => `${e.tagName.toLowerCase()} "${(e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30)}"`;
  const CONTROL = 'button, a[href], [role^=menuitem], [role=option], select, input';
  const shown = [...document.querySelectorAll(CONTROL)]
    .filter((e) => !e.matches('.scene-key, .skip:not(:focus)') && !e.closest('[inert], [aria-hidden=true]') && e.checkVisibility({ opacityProperty: true, visibilityProperty: true }));
  for (const e of shown) {
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.width < 23.5 || r.height < 23.5) out.push(`${name(e)} is ${Math.round(r.width)} × ${Math.round(r.height)} px`);
    // cut off by the window, or by a box that hides its overflow (one that scrolls is fine: you can get there)
    let clip = { left: 0, top: 0, right: innerWidth, bottom: innerHeight }, scroller = null;
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const cs = getComputedStyle(a);
      if (/auto|scroll/.test(cs.overflowX + cs.overflowY)) { clip = null; scroller = a.getBoundingClientRect(); break; }
      if (/hidden|clip/.test(cs.overflowX + cs.overflowY)) {
        const b = a.getBoundingClientRect();
        clip = { left: Math.max(clip.left, b.left), top: Math.max(clip.top, b.top), right: Math.min(clip.right, b.right), bottom: Math.min(clip.bottom, b.bottom) };
      }
    }
    if (clip && (r.left < clip.left - 1 || r.top < clip.top - 1 || r.right > clip.right + 1 || r.bottom > clip.bottom + 1)) out.push(`${name(e)} is cut off`);
    else {
      const x = r.left + r.width / 2, y = r.top + r.height / 2;
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight || (scroller && (x < scroller.left || y < scroller.top || x > scroller.right || y > scroller.bottom))) continue;
      const top = document.elementFromPoint(x, y), over = top?.closest(CONTROL), pop = e.closest('.pop:not(.pinned)');
      // an open menu or list is on top of everything, not only of other controls (#90: ⋯ under the packet's panel)
      if (pop && top && !pop.contains(top)) out.push(`${name(e)} is under ${top.closest('[class]')?.getAttribute('class') || top.tagName}`);
      else if (over && !e.contains(over) && !over.contains(e) && !over.closest('.pop:not(.pinned)')) out.push(`${name(e)} is under ${name(over)}`);
    }
  }
  return out;
}
// every scene's labels against what they're drawn on (#45): the path scenes, and every dive, at both levels
const LABEL_SCENES = ['home/watch-video', 'on-the-go/watch-video', 'home/watch-video/internet', 'on-the-go/watch-video/internet',
  'home/watch-video/phone-ap', 'on-the-go/watch-video/phone-cell-tower', 'home/watch-video/router', 'on-the-go/watch-video/cell-tower',
  'home/watch-video/ap-router', 'home/watch-video/internet/home-cabinet', 'home/watch-video/internet/olt-bng',
  'home/watch-video/internet/bng-core', 'home/watch-video/internet/core-border', 'home/watch-video/router~ip', 'home/watch-video/internet/core~ip', 'home/watch-video/ap~ip',
  'on-the-go/watch-video/internet/mobile-core~ip', 'home/watch-video/phone~tcp', 'home/watch-video/router~tcp', 'home/watch-video/phone~tls',
  'home/watch-video/phone~http', 'home/watch-video/router~http', 'home/watch-video/internet/datacentre/cdn~http',
  'on-the-go/watch-video/cell-tower~gtp', 'home/watch-video/ap~wifi', 'home/watch-video/router~ethernet',
  'home/watch-video/internet/olt~ethernet', 'home/watch-video/internet/olt~vlan', 'home/watch-video/internet/core~mpls',
  'home/watch-video/router~gpon', 'on-the-go/watch-video/phone~nr', 'home/watch-video/internet/datacentre',
  'home/watch-video/internet/datacentre/spine', 'home/watch-video/internet/datacentre/cdn',
  // the other ways online at home (#3): the phone line, fibre to the building and dial-up
  'home-dsl/watch-video', 'home-dsl/watch-video/router', 'home-dsl/watch-video/internet/home-cabinet',
  // and 2010's data centre (#59 step 8): the colocation hall and its three-tier tree
  'home-dsl/watch-video/internet/datacentre', 'home-dsl/watch-video/internet/datacentre/spine',
  'home-fttb/watch-video', 'home-fttb/watch-video/router', 'home-fttb/watch-video/internet',
  'home-fttb/watch-video/internet/basement-backhaul',
  // and dial-up: the call, its PPP envelope at both ends, and the telephone exchange on the way
  'home-dialup/watch-video', 'home-dialup/watch-video/pc-internet', 'home-dialup/watch-video/internet',
  'home-dialup/watch-video/pc~ppp', 'home-dialup/watch-video/internet/bng~ppp',
  // and on the go in 1995 (#147): GSM's slots on the air, the Abis quarters and the trunk between the switches
  'on-the-go-1995/watch-video', 'on-the-go-1995/watch-video/phone-cell-tower', 'on-the-go-1995/watch-video/internet',
  'on-the-go-1995/watch-video/internet/cell-tower-bsc', 'on-the-go-1995/watch-video/internet/mobile-core-exchange'];
/** In the page: the scene's text you can see (not faded, not under the chrome or under art drawn after it), each with
 *  its colour, its halo (a stroke painted under it) if it has one, its box on screen and the contrast it needs (3:1
 *  when large: 24 px, or 18.7 px bold). */
function sceneTexts() {
  const rgb = (v) => {
    const m = v.match(/^rgba?\(([^)]+)\)$/) ?? v.match(/^color\(srgb ([^)]+)\)$/);
    if (!m) return null;
    const n = m[1].split(/[\s,/]+/).map(Number);
    return v.startsWith('color') ? n.slice(0, 3).map((x) => x * 255) : n.slice(0, 3);
  };
  return [...document.querySelectorAll('#stage svg text')].flatMap((t) => {
    const r = t.getBoundingClientRect(), cs = getComputedStyle(t), text = t.textContent.trim();
    if (!text || r.width < 2 || r.bottom < 0 || r.right < 0 || r.top > innerHeight || r.left > innerWidth || !t.checkVisibility({ visibilityProperty: true })) return [];
    let o = +cs.fillOpacity;
    for (let a = t; a && a.tagName !== 'svg'; a = a.parentElement) o *= +getComputedStyle(a).opacity;
    const fill = rgb(cs.fill);
    if (!fill || o < 0.6) return [];
    const over = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2), svg = t.closest('#stage svg');
    if (over && over !== t && !t.contains(over) && !over.contains(t)) {
      if (!svg.contains(over)) return [];
      const ocs = getComputedStyle(over);
      const solid = !/^(none|transparent|rgba\(0, 0, 0, 0\))$/.test(ocs.fill) && +ocs.fillOpacity * +ocs.opacity > 0.5;
      if (solid && t.compareDocumentPosition(over) & Node.DOCUMENT_POSITION_FOLLOWING) return [];
    }
    const m = t.getScreenCTM(), px = parseFloat(cs.fontSize) * Math.hypot(m.a, m.b);
    const halo = cs.paintOrder.startsWith('stroke') && parseFloat(cs.strokeWidth) > 0 && +cs.strokeOpacity > 0.6 ? rgb(cs.stroke) : null;
    return [{ text: text.slice(0, 40), fill, o, halo, box: [r.left, r.top, r.width, r.height], min: px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700) ? 3 : 4.5 }];
  });
}
/** In the page: each text's contrast, on its halo or on the median of the pixels behind it (the picture with the
 *  text hidden, a PNG in base64), whichever is more: a dark halo round dark ink on a bright body still reads. */
async function textContrast([texts, png, dpr]) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `data:image/png;base64,${png}`; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const lum = (v) => v.reduce((s, x, i) => { x /= 255; return s + [0.2126, 0.7152, 0.0722][i] * (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); }, 0);
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  return texts.map((t) => {
    const halo = t.halo ? ratio(t.fill, t.halo) : 0;
    const [x, y, w, h] = t.box.map((v) => Math.round(v * dpr));
    const x0 = Math.max(0, x), y0 = Math.max(0, y), w0 = Math.min(c.width, x + w) - x0, h0 = Math.min(c.height, y + h) - y0;
    if (w0 < 1 || h0 < 1) return { ...t, ratio: 21, on: 'nothing' };
    const d = g.getImageData(x0, y0, w0, h0).data, rs = [];
    for (let i = 0; i < d.length; i += 4 * 3) {
      const bg = [d[i], d[i + 1], d[i + 2]];
      rs.push(ratio(t.fill.map((f, k) => f * t.o + bg[k] * (1 - t.o)), bg));
    }
    rs.sort((a, b) => a - b);
    const picture = rs[Math.floor(rs.length / 2)];
    // a halo in the ink's own tone smears the letters into one blot, whatever the picture behind (#90)
    const smear = !!t.halo && halo < 1.5;
    return halo > picture ? { ...t, ratio: halo, on: 'its halo', smear } : { ...t, ratio: picture, on: 'the picture', smear };
  });
}
/** In the page: the scene's text (and technical tags) that runs out of what it is drawn on (#90): a nested scene's panel,
 *  inside its frame, or the window at the root. */
function textEscapes() {
  const out = [];
  for (const t of document.querySelectorAll('#stage svg text, #stage svg g.tag')) {
    if (t.tagName === 'text' && t.closest('g.tag')) continue;
    const r = t.getBoundingClientRect(), text = t.textContent.trim();
    if (!text || r.width < 2 || !t.checkVisibility({ visibilityProperty: true })) continue;
    let o = 1;
    for (let a = t; a && a.tagName !== 'svg'; a = a.parentElement) o *= +getComputedStyle(a).opacity;
    if (o < 0.6) continue;
    const g = t.parentElement.closest('g[clip-path]');
    let box = { l: 0, r: innerWidth, t: -Infinity, b: Infinity }, where = 'the window';
    if (g) {
      // the panel is the world's rect its scene is clipped to; its frame is drawn over the outer few units
      const c = document.getElementById(g.getAttribute('clip-path').slice(5, -1)).querySelector('rect'), m = g.getScreenCTM(), k = Math.hypot(m.a, m.b), rim = 6 * k;
      box = { l: m.e + rim, r: m.e + +c.getAttribute('width') * k - rim, t: m.f + rim, b: m.f + +c.getAttribute('height') * k - rim };
      where = 'its panel';
    }
    const over = Math.max(box.l - r.left, r.right - box.r, box.t - r.top, r.bottom - box.b);
    if (over > 1) out.push(`"${text.slice(0, 30)}" runs ${Math.round(over)} px out of ${where}`);
  }
  return out;
}
// the path scenes, where labels grow the most on small screens and the technical tags are long, in both languages (#90)
const PATH_SCENES = ['home/watch-video', 'on-the-go/watch-video', 'home/watch-video/internet', 'on-the-go/watch-video/internet',
  'home/watch-video/internet/datacentre', 'home-dsl/watch-video', 'home-dsl/watch-video/internet/datacentre', 'home-fttb/watch-video', 'home-fttb/watch-video/internet',
  'home-dialup/watch-video', 'home-dialup/watch-video/internet', 'on-the-go-1995/watch-video', 'on-the-go-1995/watch-video/internet'];
const PATH_VIEWS = [['phone', 'en', '&level=technical'], ['phone', 'da', ''], ['short', 'en', ''], ['short', 'da', '&level=technical'], ['desktop', 'da', '&level=technical']];
async function labelContrast(style, fail) {
  for (const where of LABEL_SCENES)
    for (const [view, q] of [['desktop', ''], ['desktop', '&level=technical'], ['phone', '']]) {
      const { ctx, p } = await open(view, url(style, 'en', where, q));
      await still(p);
      await p.evaluate(() => window.__app.setClock(5.2, true));
      await p.waitForTimeout(100);
      for (const bad of await p.evaluate(textEscapes)) fail(`labels ${where}${q && ' technical'} ${view}`, bad);
      const texts = await p.evaluate(sceneTexts);
      await p.addStyleTag({ content: '#stage svg text { visibility: hidden !important; }' });
      const png = (await p.screenshot()).toString('base64');
      for (const t of await p.evaluate(textContrast, [texts, png, VIEWS[view].dpr]))
        if (t.ratio < t.min) fail(`labels ${where}${q && ' technical'} ${view}`, `"${t.text}" ${t.ratio.toFixed(2)} < ${t.min} on ${t.on}`);
        else if (t.smear) fail(`labels ${where}${q && ' technical'} ${view}`, `"${t.text}" haloed in its own tone`);
      await ctx.close();
    }
  for (const where of PATH_SCENES)
    for (const [view, lang, q] of PATH_VIEWS) {
      const { ctx, p } = await open(view, url(style, lang, where, q));
      await still(p);
      for (const bad of await p.evaluate(textEscapes)) fail(`labels ${where} ${lang}${q && ' technical'} ${view}`, bad);
      await ctx.close();
    }
}

async function a11y(style) {
  const axe = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
  const fails = [];
  const fail = (where, what) => { fails.push(`${where}: ${what}`); console.log(`  ✗ ${where}: ${what}`); };
  const prep = async (s, view) => {
    const { ctx, p } = await open(view, url(style, s.lang ?? 'en', s.where, s.q ?? ''), s.speech ? { on: true } : null, s.coachWas ?? s.coach !== undefined);
    await still(p);
    if (s.coach !== undefined) { await p.waitForSelector('.coach.placed'); for (let i = 0; i < s.coach; i++) await p.click('.coach-next'); }
    if (s.catch) await catchAt(p, s.catch, s.at, `${s.name} (${view})`);
    if (s.detail) await p.click('.peek header .chip');
    if (s.full) await p.click('.peek-grip');
    if (s.explore) { await p.click('.explore-btn'); await still(p); }
    if (s.fold) await p.click('.cap-fold');
    if (s.picker) { await p.evaluate(() => window.__app.picker(true)); await p.waitForSelector('.picker'); }
    if (s.time === 'chip') { if (!(await p.isVisible('.caption .chip.time'))) await p.click('.cap-toggle'); await p.click('.caption .chip.time'); }
    else if (s.time) await p.click('.time-btn');
    if (s.time) await p.waitForSelector('.picker.time');
    for (let i = 0; i < (s.timeTo ?? 0); i++) await p.keyboard.press('ArrowLeft');
    if (s.ladder) await p.click('.crumbs .here');
    if (s.menu) { await p.click('.more-btn'); await p.waitForSelector('.menu'); }
    if (s.about) { await p.click('.menu [role=menuitem]:last-child'); await p.waitForSelector('.about-box'); }
    if (s.languages) { await p.click('.menu [data-list=lang]'); await p.waitForSelector('.menu-pick'); }
    if (s.keys) { await p.focus('.scene-key'); for (let i = 0; i < s.keys; i++) await p.keyboard.press('ArrowRight'); }
    if (s.map) { await p.focus('.skip'); await p.keyboard.press('Enter'); await p.waitForSelector('.map'); }
    await still(p);
    if (s.speech) {
      const there = s.menu ? p.locator('.menu [role=menuitemcheckbox]', { hasText: 'Read aloud' }) : p.locator('.caption .read');
      if (!(await there.count())) fail(`${s.name} ${view}`, s.menu ? 'no "Read aloud" in ⋯' : 'no "Read again" in the caption');
    }
    return { ctx, p };
  };
  // 1. axe on every state
  for (const s of A11Y_STATES)
    for (const view of s.views) {
      const { ctx, p } = await prep(s, view);
      await p.addScriptTag({ content: axe });
      const r = await p.evaluate((tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }), AXE_TAGS);
      for (const v of r.violations)
        for (const n of v.nodes) fail(`${s.name} ${view}`, `${v.id} (${v.impact}) ${n.target.join(' ')}: ${n.failureSummary.split('\n').slice(1).join(' ').trim()}`);
      for (const bad of await p.evaluate(controlProblems)) fail(`${s.name} ${view}`, bad);
      await ctx.close();
    }
  // 2. Tab once round each state: focus is always somewhere you can see, with a ring. Tab past the last stop goes to
  //    the browser's own controls, which the page sees as focus on <body>: that ends the round. (Danish Technical, the later
  //    coach marks and the panel from its chip Tab like the overview, the first mark and the panel from the top bar; a
  //    phone's peek opened all the way has no desktop.)
  for (const s of A11Y_STATES.filter((x) => !['technical-da', 'coach-explore', 'coach-time', 'time-chip', 'caught-full'].includes(x.name))) {
    const { ctx, p } = await prep(s, 'desktop');
    // a long route has many stops (the list view has a button for each), so the round may take as many Tabs as the
    // page has things to focus, and a few more
    const most = (await p.locator('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])').count()) + 5;
    for (let i = 1; i <= most; i++) {
      await p.keyboard.press('Tab');
      const bad = await p.evaluate(focusProblem);
      // (the time machine opens on its eras, a Tab from its last control)
      if (bad === 'focus on the page') { if (i < (s.time ? 2 : 3)) fail(`${s.name} Tab ${i}`, 'nothing to Tab to'); break; }
      if (bad) fail(`${s.name} Tab ${i}`, bad);
      if (i === most) fail(s.name, 'Tab never gets round');
    }
    await ctx.close();
  }
  // 3. journeys: focus comes back after "What can I explore?", a door, a catch, letting go, the picker, folding the
  //    caption away and the time machine
  const { ctx, p } = await open('desktop', url(style, 'en', 'home/watch-video'));
  await still(p);
  const check = async (step) => { const bad = await p.evaluate(focusProblem); if (bad) fail(`journey: ${step}`, bad); };
  // "What can I explore?" (#122): a toggle; on, focus goes into its list and the announcer says how many things there
  // are; Esc puts the story back and focus on the button. A door from the list, or a catch, ends it too.
  const explore = async () => { await p.focus('.explore-btn'); await p.keyboard.press('Enter'); await still(p); };
  const pressed = () => p.evaluate(() => document.querySelector('.explore-btn')?.getAttribute('aria-pressed'));
  if (await p.$('.caption .doors')) fail('journey: explore', 'the caption lists the doors before it is asked to');
  await explore();
  if ((await pressed()) !== 'true') fail('journey: explore', 'its button is not pressed');
  if (!(await p.evaluate(() => !!document.activeElement?.closest('.caption .doors')))) fail('journey: explore', 'focus is not in its list');
  await check('explore');
  const things = await p.waitForFunction(() => document.querySelector('[role=status]')?.textContent?.trim(), null, { timeout: 2000 }).then((h) => h.jsonValue(), () => '');
  if (!/^\d+ things to explore$/.test(things)) fail('journey: explore', `the announcer says "${things}"`);
  await p.keyboard.press('Escape'); await still(p);
  if (!(await p.evaluate(() => document.activeElement?.matches('.explore-btn') && !document.querySelector('.caption .doors'))) || (await pressed()) !== 'false')
    fail('journey: explore', 'Esc does not bring the story back, with focus on its button');
  await explore();
  await p.focus('.caption .door-dive .door'); await p.keyboard.press('Enter'); await still(p); await check('a door from the caption');
  if ((await pressed()) === 'true') fail('journey: explore', 'it stays on through a door');
  await p.keyboard.press('Escape'); await still(p);
  await explore();
  await p.focus('.caption .door-catch .door'); await p.keyboard.press('Enter'); await p.waitForSelector('.peek'); await still(p);
  if (!(await p.evaluate(() => document.activeElement?.id === 'peek-title'))) fail('journey: catch', 'focus is not on the peek panel');
  await p.keyboard.press('Tab'); await check('Tab in the peek panel');
  await p.keyboard.press('Escape'); await still(p); await check('letting go');
  if (!(await p.evaluate(() => document.activeElement?.matches('.explore-btn')))) fail('journey: catch', 'letting go, focus is not back on "What can I explore?"');
  await p.focus('.more-btn'); await p.keyboard.press('Enter'); await p.waitForSelector('.menu');
  if (!(await p.evaluate(() => !!document.activeElement?.closest('.menu')))) fail('journey: ⋯', 'focus is not in the menu');
  // the languages open in the menu's place, on the one you read in; Esc goes back to their entry, then closes ⋯
  await p.focus('.menu [data-list=lang]'); await p.keyboard.press('Enter'); await p.waitForSelector('.menu-pick');
  if (!(await p.evaluate(() => document.activeElement?.matches('.menu-pick[aria-checked=true]')))) fail('journey: languages', 'focus is not on the language you read in');
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  if (!(await p.evaluate(() => document.activeElement?.matches('.menu [data-list=lang]')))) fail('journey: languages', 'Esc: focus is not back on Language');
  await p.keyboard.press('Escape'); await p.waitForTimeout(100);
  if (!(await p.evaluate(() => document.activeElement?.matches('.more-btn')))) fail('journey: ⋯', 'focus is not back on ⋯');
  await p.focus('.caption .foot > .chip'); await p.keyboard.press('Enter'); await still(p);
  for (let i = 0; i < 12; i++) {
    await p.keyboard.press('Tab');
    const at = await p.evaluate(() => (document.activeElement === document.body ? 'browser' : document.activeElement?.closest('.picker') ? 'dialog' : 'page'));
    if (at === 'page') { fail('journey: picker', 'Tab reaches the page behind the dialog'); break; }
  }
  await p.keyboard.press('Escape'); await still(p);
  if (!(await p.evaluate(() => document.activeElement?.matches('.caption .foot > .chip')))) fail('journey: picker', 'focus is not back on its button');
  // folding the caption away (#168): C in the picture folds it and focus stays there; it stays folded through a dive
  // and back up; Enter on the pill unfolds it, with focus on its chevron
  const tucked = () => p.evaluate(() => !!document.querySelector('.caption.compact .cap-toggle[aria-expanded="false"]'));
  await p.focus('.scene-key[tabindex="0"]'); await p.keyboard.press('c'); await still(p);
  if (!(await tucked())) fail('journey: fold', 'C in the picture does not fold the caption away');
  if (!(await p.evaluate(() => !!document.activeElement?.closest('.scene-keys')))) fail('journey: fold', 'focus is not in the picture after C');
  await p.evaluate(() => window.__app.go({ path: ['phone-ap'] })); await still(p);
  await p.keyboard.press('Escape'); await still(p);
  if (!(await tucked())) fail('journey: fold', 'it unfolds by itself on the way');
  await p.focus('.cap-toggle'); await p.keyboard.press('Enter'); await still(p);
  if ((await tucked()) || !(await p.evaluate(() => document.activeElement?.matches('.cap-fold')))) fail('journey: fold', 'Enter on the pill does not unfold it, with focus on its chevron');
  // the time machine (#59): it opens on where you are, Tab stays in it and Esc comes back; the arrows choose 1995 and
  // Enter goes there: focus on the caption's title, and the announcer says what the picture shows
  const timeIn = () => p.evaluate(() => (document.activeElement === document.body ? 'browser' : document.activeElement?.closest('.picker.time') ? 'dialog' : 'page'));
  await p.focus('.caption .chip.time'); await p.keyboard.press('Enter'); await p.waitForSelector('.picker.time'); await still(p);
  if (!(await p.evaluate(() => document.activeElement?.matches('.picker.time input[data-here]:checked')))) fail('journey: time machine', 'it does not open on where you are');
  for (let i = 0; i < 12; i++) {
    await p.keyboard.press('Tab');
    const where = await timeIn();
    if (where === 'page') { fail('journey: time machine', 'Tab reaches the page behind the dialog'); break; }
    if (where !== 'browser') await check('Tab in the time machine');
  }
  await p.keyboard.press('Escape'); await still(p);
  if (!(await p.evaluate(() => document.activeElement?.matches('.caption .chip.time')))) fail('journey: time machine', 'focus is not back on its button');
  // from the list view: it opens on where you are, and Esc gives focus back to what opened the list
  await p.focus('.skip'); await p.keyboard.press('Enter'); await p.waitForSelector('.map'); await still(p);
  await p.focus('.map button:has-text("Travel in time")'); await p.keyboard.press('Enter'); await p.waitForSelector('.picker.time'); await still(p);
  if (!(await p.evaluate(() => !document.querySelector('.map') && document.activeElement?.matches('.picker.time input[data-here]')))) fail('journey: time machine', 'from the list view, it does not open on where you are');
  await p.keyboard.press('Escape'); await still(p);
  if (!(await p.evaluate(() => document.activeElement?.matches('.skip')))) fail('journey: time machine', 'from the list view, focus is not back on the skip link');
  await p.focus('.caption .chip.time');
  await p.keyboard.press('Enter'); await p.waitForSelector('.picker.time'); await still(p);
  await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('Enter'); await still(p);
  if ((await p.evaluate(() => window.__app.loc().places[0])) !== 'home-dialup') fail('journey: time machine', `Enter on 1995 goes to ${await p.evaluate(() => window.__app.loc().places[0])}`);
  if (!(await p.evaluate(() => document.activeElement?.matches('.caption h2')))) fail('journey: time machine', 'focus is not on the caption after the trip');
  const told = await p.evaluate(() => document.querySelector('[role=status]')?.textContent?.trim() ?? '');
  if (told.length < 40) fail('journey: time machine', `arriving, the announcer says only "${told}"`);
  await p.focus('.caption .chip.time'); await p.keyboard.press('Enter'); await p.waitForSelector('.picker.time'); await still(p);
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('Enter'); await still(p);
  if ((await p.evaluate(() => window.__app.loc().places[0])) !== 'home') fail('journey: time machine', 'it does not come back to today');
  // from the top bar, inside a dive: the PC's TCP in 1995, focus on the caption's title, and the announcer names the
  // era first; from the street, the street's own 1995 (#147). Esc gives focus back to the button.
  const told1st = () => p.waitForFunction(() => document.querySelector('[role=status]')?.textContent?.trim(), null, { timeout: 3000 }).then((h) => h.jsonValue(), () => '');
  for (const [from, says, to] of [['home', 'It’s 1995. ', 'home-dialup/pc~tcp'], ['on-the-go', 'It’s 1995. ', 'on-the-go-1995/phone~tcp']]) {
    await p.evaluate((f) => window.__app.go({ places: [f], path: ['phone~tcp'] }), from); await still(p);
    await p.focus('.time-btn'); await p.keyboard.press('Enter'); await p.waitForSelector('.picker.time'); await still(p);
    if (!(await p.evaluate(() => document.querySelector('.time-btn')?.getAttribute('aria-expanded') === 'true'))) fail('journey: time machine', 'its top-bar button is not expanded');
    await p.keyboard.press('Escape'); await still(p);
    if (!(await p.evaluate(() => document.activeElement?.matches('.time-btn')))) fail('journey: time machine', 'focus is not back on the top bar\'s button');
    await p.keyboard.press('Enter'); await p.waitForSelector('.picker.time'); await still(p);
    await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('Enter'); await still(p);
    const l = await p.evaluate(() => window.__app.loc());
    if (`${l.places[0]}/${l.path.join('/')}` !== to) fail('journey: time machine', `from the ${from}'s TCP, 1995 is ${l.places[0]}/${l.path.join('/')}`);
    if (!(await p.evaluate(() => document.activeElement?.matches('.caption h2')))) fail('journey: time machine', `from the ${from}, focus is not on the caption after the trip`);
    const heard = await told1st();
    if (!heard.startsWith(says) || heard.length < says.length + 40) fail('journey: time machine', `from the ${from}, the announcer says "${heard}"`);
    if ((await p.evaluate(() => document.querySelector('.time-btn')?.textContent?.trim())) !== '1995') fail('journey: time machine', 'the top bar\'s button does not say 1995');
  }
  await p.evaluate(() => window.__app.go({ places: ['home'], path: [] })); await still(p);
  // the scene's keys (#53): into the picture, two stops along, in through the Wi‑Fi's door and back out
  const at = () => p.evaluate(() => { const l = window.__app.loc(); return `${l.path.join('/')}:${l.stop}`; });
  await p.focus('.scene-key'); await check('the scene');
  await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); await still(p);
  if ((await at()) !== ':phone-ap') fail('journey: arrows in the scene', `at ${await at()}, not the Wi‑Fi`);
  await check('arrows in the scene');
  await p.keyboard.press('Enter'); await still(p);
  if ((await at()) !== 'phone-ap:null') fail('journey: Enter in the scene', `at ${await at()}, not in the Wi‑Fi`);
  await check('Enter in the scene');
  await p.keyboard.press('Escape'); await still(p); await check('Esc from the scene');
  // the list view: the skip link opens it at where you are, Tab stays in it, Esc comes back
  await p.focus('.skip'); await p.keyboard.press('Enter'); await p.waitForSelector('.map'); await still(p);
  if (!(await p.evaluate(() => !!document.activeElement?.closest('.map [data-here]')))) fail('journey: list view', 'it does not open at where you are');
  for (let i = 0; i < 80; i++) {
    await p.keyboard.press('Tab');
    const where = await p.evaluate(() => (document.activeElement === document.body ? 'browser' : document.activeElement?.closest('.map') ? 'dialog' : 'page'));
    if (where === 'page') { fail('journey: list view', 'Tab reaches the page behind it'); break; }
    if (where === 'browser') break;
    await check('Tab in the list view');
  }
  await p.keyboard.press('Escape'); await still(p);
  if (!(await p.evaluate(() => document.activeElement?.matches('.skip')))) fail('journey: list view', 'focus is not back on the skip link');
  // from ⋯, then into a dive from the list: focus lands in the scene
  await p.click('.more-btn'); await p.click('.menu [role=menuitem]:has-text("List view")'); await p.waitForSelector('.map'); await still(p);
  await p.focus('.map-stops .btn[aria-label^="Look inside"]'); await p.keyboard.press('Enter'); await still(p);
  if (!(await p.evaluate(() => document.activeElement?.matches('.scene-key')))) fail('journey: list view', 'a door in it does not land in the scene');
  await check('a door in the list view');
  await ctx.close();
  await speechJourney(style, fail);
  await coachJourney(style, fail);
  await walkJourney(style, fail);
  await labelContrast(style, fail);
  console.log(`  ${fails.length ? `${fails.length} accessibility problems` : 'no accessibility problems'}`);
  if (fails.length) process.exitCode = 1;
}

/** Read aloud and the announcer (#53): turned on from ⋯, it says so; a door's arrival is announced with what the
 *  picture shows (its `describe`), and read aloud says the title, that and the caption; "Read again" says it again. */
async function speechJourney(style, fail) {
  const { ctx, p } = await open('desktop', url(style, 'en', 'home/watch-video'), { on: false });
  await still(p);
  const said = () => p.evaluate(() => window.__said.slice());
  if (await p.$('.caption .read')) fail('journey: read aloud', '"Read again" while read aloud is off');
  await p.click('.more-btn'); await p.waitForSelector('.menu');
  const toggle = p.locator('.menu [role=menuitemcheckbox]', { hasText: 'Read aloud' });
  if (!(await toggle.count())) fail('journey: read aloud', 'no "Read aloud" in ⋯');
  else {
    await toggle.click();
    if (!(await said()).includes('Read aloud is on.')) fail('journey: read aloud', 'turning it on says nothing');
  }
  await p.keyboard.press('Escape');
  await p.click('.explore-btn'); await still(p);
  await p.focus('.caption .door-dive .door'); await p.keyboard.press('Enter'); await still(p);
  const cap = await p.evaluate(() => ({ title: document.querySelector('.caption h2')?.textContent?.trim(), body: document.querySelector('.caption p')?.textContent?.trim() }));
  const heard = await p.waitForFunction(() => document.querySelector('[role=status]')?.textContent?.trim(), null, { timeout: 2000 }).then((h) => h.jsonValue()).catch(() => '');
  if (!heard || heard.length < 40) fail('journey: arrival', `the announcer says only "${heard}"`);
  const last = (await said()).at(-1) ?? '';
  if (!last.startsWith(cap.title) || !last.endsWith(cap.body) || last.length < cap.title.length + cap.body.length + 40)
    fail('journey: read aloud', `arriving reads "${last.slice(0, 80)}…", not the title, the description and the caption`);
  const n = (await said()).length;
  await p.click('.caption .read');
  if ((await said()).length !== n + 1 || (await said()).at(-1) !== last) fail('journey: read again', 'it does not read the caption again');
  await ctx.close();
}

/** Walking the whole trip (#169): ▶ from the phone goes on into the internet and its data centre to the server, the
 *  button naming each crossing (aloud and on screen; on a portrait phone ▶ names every step), and bumps there; ◀ walks
 *  it back exactly, to the overview. On a desktop, a portrait phone and a short landscape one, with no error on the
 *  page's console all the way (#182: a scene's arithmetic drew a negative height in every frame of a flight). */
async function walkJourney(style, fail) {
  for (const view of ['desktop', 'phone', 'short']) {
    const { ctx, p, errors } = await open(view, url(style, 'en', 'home/watch-video/@phone'));
    await still(p);
    const where = `journey: walk (${view})`;
    const at = () => p.evaluate(() => { const l = window.__app.loc(); return `${l.path.join('/')}@${l.stop}`; });
    const walk = async (d) => {
      const sel = `.step.${d > 0 ? 'next' : 'prev'}`, seen = [], said = [];
      while ((await p.getAttribute(sel, 'aria-disabled')) !== 'true' && seen.length < 80) {
        const [label, shown] = await p.$eval(sel, (b) => [b.getAttribute('aria-label'), b.querySelector('.step-to')?.textContent ?? null]);
        if (shown !== null && shown !== label) fail(where, `the button shows "${shown}" but says "${label}"`);
        // on a phone held upright ▶ always wears its words, so it can't be taken for the caption's marks (#182)
        if (view === 'phone' && d > 0 && shown === null) fail(where, `▶ shows no words ("${label}")`);
        said.push(label);
        await p.click(sel);
        seen.push(await at());
      }
      const end = await at();
      // aria-disabled still takes the click (it bumps); Playwright won't click a button it thinks is disabled
      await p.click(sel, { force: true });
      if ((await at()) !== end) fail(where, `${d > 0 ? '▶' : '◀'} goes on past ${end}`);
      return { seen, said };
    };
    const on = await walk(1);
    if (on.seen.at(-1) !== 'internet/datacentre@origin') fail(where, `▶ ends at ${on.seen.at(-1)}`);
    for (const s of ['Into: The internet', 'Into: Data centre']) if (!on.said.includes(s)) fail(where, `no "${s}" on the way (${on.said.filter((x) => x !== 'Next stop').join(', ')})`);
    await still(p);
    const back = await walk(-1);
    const want = ['@phone', ...on.seen.slice(0, -1)].reverse().concat('@null');
    if (back.seen.join(' ') !== want.join(' ')) fail(where, `◀ walks back ${back.seen.join(' ')}`);
    if (!back.said.includes('Back out: Your home')) fail(where, `no "Back out: Your home" on the way back`);
    await still(p);
    const bad = await p.evaluate(focusProblem);
    if (bad) fail(where, bad);
    if (errors.length) fail(where, `${errors.length} errors on the console, the first: ${errors[0]}`);
    await ctx.close();
  }
}

/** The first-run coach marks (#21): a first visit to the top gets them, and the announcer says the first. They come
 *  after the skip link in the Tab order and trap nothing; Next keeps focus; Esc ends them, puts focus back in the page
 *  and they don't come again. A link into a scene gets none (and doesn't use them up); a tap on the scene ends them
 *  and still opens what it hit. */
async function coachJourney(style, fail) {
  // waiting for them allows a slow (SWIFTSHADER) runner 20 s; that none come, 3 s after the page stands still
  const first = async (where, want) => {
    const { ctx, p } = await open('desktop', url(style, 'en', where), null, true);
    await still(p);
    return { ctx, p, shown: await p.waitForSelector('.coach.placed', { timeout: want ? 20000 : 3000 }).then(() => true, () => false) };
  };
  const coached = (p) => p.evaluate(() => localStorage.getItem('coached'));
  let { ctx, p, shown } = await first('home/watch-video', true);
  if (!shown) fail('journey: coach marks', 'none on a first visit');
  else {
    const says = 'Getting started. 1 of 4.';
    const heard = await p.waitForFunction((s) => document.querySelector('[role=status]')?.textContent?.trim().startsWith(s), says, { timeout: 10000 })
      .then(() => says, () => p.evaluate(() => document.querySelector('[role=status]')?.textContent?.trim() ?? ''));
    if (heard !== says) fail('journey: coach marks', `the announcer says "${heard}"`);
    await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
    if (!(await p.evaluate(() => document.querySelector('.skip') && document.activeElement?.matches('.coach button')))) fail('journey: coach marks', 'they are not the next Tab stop after the skip link');
    await p.keyboard.press('Tab'); await p.keyboard.press('Enter');
    if (!(await p.locator('.coach', { hasText: '2 of 4' }).count())) fail('journey: coach marks', 'Next does not step on');
    if (!(await p.evaluate(() => document.activeElement?.matches('.coach-next')))) fail('journey: coach marks', 'focus is not on Next after it');
    await p.keyboard.press('Escape'); await still(p);
    if (await p.$('.coach')) fail('journey: coach marks', 'Esc does not end them');
    const bad = await p.evaluate(focusProblem);
    if (bad) fail('journey: coach marks', `after Esc: ${bad}`);
    if ((await coached(p)) !== '2') fail('journey: coach marks', 'they are not remembered');
    await p.reload(); await p.waitForFunction(() => window.__app); await still(p); await p.waitForTimeout(1500);
    if (await p.$('.coach')) fail('journey: coach marks', 'they come again');
  }
  await ctx.close();
  ({ ctx, p, shown } = await first('home/watch-video/internet', false));
  if (shown) fail('journey: coach marks', 'a link into a scene gets them');
  if ((await coached(p)) !== null) fail('journey: coach marks', 'a link into a scene uses them up');
  await ctx.close();
  ({ ctx, p, shown } = await first('home/watch-video', true));
  if (shown) {
    const [x, y] = await p.evaluate(() => window.__app.doorAt('internet'));
    await p.mouse.click(x, y); await still(p);
    if (await p.$('.coach')) fail('journey: coach marks', 'a tap on the scene does not end them');
    if ((await p.evaluate(() => window.__app.loc().path.join('/'))) !== 'internet') fail('journey: coach marks', 'a tap on "Open up" does not open it');
  }
  await ctx.close();
  // a reader who had them before the time machine (#59): its card only, once, said as new, with no count
  ({ ctx, p } = await open('desktop', url(style, 'en', 'home/watch-video'), null, '1'));
  await still(p);
  if (!(await p.waitForSelector('.coach.placed', { timeout: 20000 }).then(() => true, () => false))) fail('journey: coach marks', 'no time machine card for a returning reader');
  else {
    const says = 'New. Hop in the time machine: see this trip in 1995 or 2010.';
    const heard = await p.waitForFunction((s) => document.querySelector('[role=status]')?.textContent?.trim().startsWith(s), says, { timeout: 10000 })
      .then(() => says, () => p.evaluate(() => document.querySelector('[role=status]')?.textContent?.trim() ?? ''));
    if (heard !== says) fail('journey: coach marks', `for a returning reader, the announcer says "${heard}"`);
    if ((await p.locator('.coach').count()) !== 1 || (await p.locator('.coach-count').count())) fail('journey: coach marks', 'a returning reader gets more than the time machine\'s card');
    await p.keyboard.press('Escape'); await still(p);
    if ((await coached(p)) !== '2') fail('journey: coach marks', 'the time machine\'s card is not remembered');
    await p.reload(); await p.waitForFunction(() => window.__app); await still(p); await p.waitForTimeout(1500);
    if (await p.$('.coach')) fail('journey: coach marks', 'the time machine\'s card comes again');
  }
  await ctx.close();
}

// ------------------------------------------------------------------ every dive fits its panel (--only=fit)
/** In the page: what a dive cuts at its panel's edge (#136): text and technical tags past the frame line drawn round it, off
 *  the window or under the chrome, and cards (filled shapes) that cross the frame. A text's box runs a little above
 *  and below its letters, so a pixel of slack. Shapes clipped by something of their own (a grid's seats) and the
 *  focus ring don't count. */
function fitEscapes() {
  const FRAME = 18, out = [];
  const panel = (el) => {
    const g = el.closest('g.scene')?.querySelector(':scope > g[clip-path]');
    if (!g?.contains(el)) return null;
    const c = document.getElementById(g.getAttribute('clip-path').slice(5, -1)).querySelector('rect'), m = g.getScreenCTM(), k = Math.hypot(m.a, m.b);
    return { g, w: +c.getAttribute('width') * k, h: +c.getAttribute('height') * k, l: m.e + FRAME * k, t: m.f + FRAME * k, r: m.e + (+c.getAttribute('width') - FRAME) * k, b: m.f + (+c.getAttribute('height') - FRAME) * k };
  };
  const seen = (el) => {
    if (!el.checkVisibility({ visibilityProperty: true })) return false;
    let o = 1;
    for (let a = el; a && a.tagName !== 'svg'; a = a.parentElement) o *= +getComputedStyle(a).opacity;
    return o >= 0.6;
  };
  const past = (r, b) => Math.max(b.l - r.left, r.right - b.r, b.t - r.top, r.bottom - b.b);
  for (const t of document.querySelectorAll('#stage svg text, #stage svg g.tag')) {
    if (t.tagName === 'text' && t.closest('g.tag')) continue;
    const b = t.getBoundingClientRect(), text = t.textContent.trim().slice(0, 30), box = panel(t);
    if (!text || b.width < 2 || !box || !seen(t)) continue;
    // a text's box runs a fifth of its size above its capitals and below its baseline
    const m = t.getScreenCTM(), pad = t.tagName === 'text' ? parseFloat(getComputedStyle(t).fontSize) * Math.hypot(m.a, m.b) * 0.2 : 0;
    const r = { left: b.left, right: b.right, top: b.top + pad, bottom: b.bottom - pad, width: b.width, height: b.height - 2 * pad };
    const x = r.left + r.width / 2, y = r.top + r.height / 2, on = document.elementFromPoint(x, y);
    if (past(r, box) > 1) out.push(`"${text}" runs ${Math.round(past(r, box))} px past its panel's frame`);
    else if (past(r, { l: 0, t: 0, r: innerWidth, b: innerHeight }) > 1) out.push(`"${text}" runs off the window`);
    else if (on && !on.closest('#stage')) out.push(`"${text}" is under ${on.closest('[class]')?.getAttribute('class') || on.tagName}`);
  }
  for (const s of document.querySelectorAll('#stage svg g.scene :is(rect, path, circle, ellipse, polygon, image)')) {
    const box = panel(s);
    if (!box || s.closest('defs, clipPath, mask, pattern, .focus') || s.parentElement.closest('g[clip-path]') !== box.g || !seen(s)) continue;
    const r = s.getBoundingClientRect(), cs = getComputedStyle(s);
    // a card, not the panel's backdrop, ground or sea
    if (r.width < 6 || r.height < 6 || r.width > box.w * 0.6 || r.height > box.h * 0.6) continue;
    if (s.tagName !== 'image' && (cs.fill === 'none' || +cs.fillOpacity < 0.5)) continue;
    const ix = Math.max(0, Math.min(r.right, box.r) - Math.max(r.left, box.l)), iy = Math.max(0, Math.min(r.bottom, box.b) - Math.max(r.top, box.t));
    if (past(r, box) > 3 && ix * iy > 0.3 * r.width * r.height) out.push(`a ${Math.round(r.width)}×${Math.round(r.height)} ${s.tagName} runs ${Math.round(past(r, box))} px past its panel's frame`);
  }
  return [...new Set(out)];
}
/** Every dive (each look once: the same dive of the same thing on another route looks the same) on a phone upright
 *  and on its side, in both languages, at both levels, checked with `fitEscapes`, and for errors on the page's
 *  console on the way there (#182). Prints what's cut, exits 1 if anything is; writes nothing. */
async function fitCheck(style) {
  let fails = 0, walked = 0;
  for (const view of ['phone', 'short'])
    for (const lang of ['en', 'da'])
      for (const q of ['', '&level=technical']) {
        const { ctx, p, errors } = await open(view, url(style, lang, 'home/watch-video', q)), looks = new Set();
        // the camera cuts instead of flying: the same places, sooner
        await p.emulateMedia({ reducedMotion: 'reduce' });
        for (const place of readdirSync('content/places').filter((d) => existsSync(`content/places/${d}/place.ts`))) {
          await p.evaluate((pl) => window.__app.go({ places: [pl], path: [] }), place); await still(p);
          for (const { path, look } of await p.evaluate(() => window.__app.dives())) {
            if (looks.has(look)) continue;
            looks.add(look); walked++;
            await p.evaluate((l) => window.__app.go(l), { places: [place], path }); await still(p);
            // the scene key takes the focus, and a scripted focus shows its ring, a mat over the panel's rim
            await p.evaluate(() => { document.activeElement?.blur(); window.__app.setClock(5.2, true); });
            await p.waitForTimeout(50);
            const bads = await p.evaluate(fitEscapes), said = errors.splice(0);
            if (said.length) bads.unshift(`${said.length} errors on the console, the first: ${said[0]}`);
            for (const bad of bads) { fails++; console.log(`  ✗ ${place}/${path.join('/')} ${view} ${lang}${q && ' technical'}: ${bad}`); }
          }
        }
        await ctx.close();
      }
  console.log(`  ${walked} dives walked, ${fails ? `${fails} things cut at a panel's edge or said on the console` : 'nothing cut at a panel\'s edge, nothing on the console'}`);
  if (fails) process.exitCode = 1;
}

// ------------------------------------------------------------------ not by colour alone (--only=vision)
/** The places where colour carries meaning (owner regions, request and video, the fibre colours, the doors), each as
 *  one sheet: as it is, through the four colour-vision deficiencies Chromium emulates, and in forced colours (a light
 *  or a dark contrast theme, by the mode). For looking at, not judging: written to .tmp/vision/, nothing fails. */
const VISION = ['none', 'protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
const VISION_SHOTS = [
  { view: 'desktop', where: 'home/watch-video', name: 'home' },
  { view: 'desktop', where: 'home/watch-video/internet', name: 'internet' },
  { view: 'phone', where: 'on-the-go/watch-video/internet', name: 'internet-on-the-go-phone' },
  { view: 'desktop', where: 'home/watch-video', catch: 'request', at: ['phone'], name: 'peek' },
  { view: 'desktop', where: 'home/watch-video/internet/home-cabinet', name: 'gpon' },
  { view: 'desktop', where: 'home/watch-video/internet/olt-bng', name: 'metro' },
  { view: 'phone', where: 'home/watch-video/internet/bng-core', q: '&level=technical', name: 'backbone-technical-phone' },
  { view: 'desktop', where: 'home/watch-video/phone~tcp', name: 'tcp' },
];
async function vision(style) {
  mkdirSync('.tmp/vision', { recursive: true });
  const sheet = await browser.newPage();
  for (const s of VISION_SHOTS) {
    const panels = [];
    for (const forced of [false, true]) {
      const v = VIEWS[s.view];
      const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, deviceScaleFactor: 1, hasTouch: !!v.touch, isMobile: !!v.touch,
        colorScheme: MODE === 'night' ? 'dark' : 'light', forcedColors: forced ? 'active' : 'none' });
      const p = await ctx.newPage();
      await p.addInitScript(coached);
      await p.goto(url(style, s.lang ?? 'en', s.where, s.q ?? ''));
      await p.waitForFunction(() => window.__app, null, { timeout: 15000 });
      await p.evaluate(() => document.fonts.ready);
      await settle(p);
      await p.evaluate(() => window.__app.setClock(5.2, true));
      if (s.catch) { await catchAt(p, s.catch, s.at, `vision ${s.name}`); await p.waitForTimeout(1500); }
      await still(p);
      const cdp = await ctx.newCDPSession(p);
      for (const type of forced ? ['none'] : VISION) {
        await cdp.send('Emulation.setEmulatedVisionDeficiency', { type });
        panels.push({ label: forced ? 'forced colours' : type === 'none' ? 'as drawn' : type, png: (await p.screenshot({ type: 'png' })).toString('base64') });
      }
      await ctx.close();
    }
    const jpg = await sheet.evaluate(async ({ panels, title }) => {
      const imgs = await Promise.all(panels.map((x) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = `data:image/png;base64,${x.png}`; })));
      const scale = imgs[0].width > 800 ? 0.5 : 0.6, w = imgs[0].width * scale, h = imgs[0].height * scale, cols = 3, head = 28;
      const c = document.createElement('canvas');
      c.width = cols * w; c.height = Math.ceil(imgs.length / cols) * (h + head);
      const g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      imgs.forEach((img, i) => {
        const x = (i % cols) * w, y = Math.floor(i / cols) * (h + head);
        g.fillStyle = '#000'; g.font = 'bold 18px system-ui'; g.fillText(`${title} · ${panels[i].label}`, x + 8, y + 20);
        g.drawImage(img, x, y + head, w, h);
      });
      return c.toDataURL('image/jpeg', 0.8).split(',')[1];
    }, { panels, title: s.name });
    writeFileSync(`.tmp/vision/${style}${MODE === 'night' ? '-night' : ''}-${s.name}.jpg`, Buffer.from(jpg, 'base64'));
    console.log(`  ${s.name}`);
  }
  await sheet.close();
}

// ------------------------------------------------------------------ under a sub-path (--only=subpath)
/** The build is relative (vite.config.ts, base './'), so the same dist/ runs at a site's root and under a sub-path,
 *  as on GitHub Pages (#185). Serves dist/ itself at SUB on a free port, with nothing outside it, and walks what loads
 *  later: the fonts, a dive (its chunk and the dive strings), a caught packet's peek, the time machine to 1995 (the
 *  words of the past, the era's props), Danish (its string pack), and the icons. Every request must stay under SUB and
 *  succeed, with no page errors; og:url and og:image must be absolute, and the image a file in dist/. */
async function subpath() {
  const SUB = '/how-the-internet-works/';
  const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
  const server = createServer((req, res) => {
    const path = new URL(req.url, 'http://x').pathname;
    const file = path.startsWith(SUB) ? join('dist', path.slice(SUB.length) || 'index.html') : null;
    if (!file || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const root = `http://127.0.0.1:${server.address().port}`, base = `${root}${SUB}`;
  const fails = [];
  const fail = (what) => { fails.push(what); console.log(`  ✗ ${what}`); };
  // (not `open`: every request counts, from the page's first)
  const ctx = await browser.newContext({ viewport: { width: VIEWS.desktop.w, height: VIEWS.desktop.h } });
  const p = await ctx.newPage();
  await p.addInitScript(coached);
  p.on('request', (r) => { if (r.url().startsWith(root) && !r.url().startsWith(base)) fail(`${r.url()} is outside ${SUB}`); });
  p.on('requestfailed', (r) => fail(`${r.url()} failed: ${r.failure()?.errorText}`));
  p.on('response', (r) => { if (r.status() >= 400) fail(`${r.url()}: ${r.status()}`); });
  p.on('pageerror', (e) => fail(`page error: ${e.message}`));
  const done = async () => { await ctx.close(); server.close(); process.exitCode = fails.length ? 1 : 0; };
  await p.goto(url(STYLES[0], 'en', 'home/watch-video', '', base));
  try { await p.waitForFunction(() => window.__app, null, { timeout: 15000 }); await p.evaluate(() => document.fonts.ready); }
  catch { fail('the app did not start'); return done(); }
  const step = async (what, act, ready) => {
    try { await act(); await p.waitForFunction(ready, null, { timeout: 15000 }); await settle(p); console.log(`  ${what}`); }
    catch (e) { fail(`${what}: ${e.message.split('\n')[0]}`); }
  };
  await settle(p);
  const fonts = await p.evaluate(() => [...document.fonts].map((f) => `${f.family} ${f.status}`));
  if (!fonts.some((f) => f.endsWith(' loaded'))) fail(`no font loaded (${fonts.join(', ')})`);
  for (const f of fonts.filter((f) => f.endsWith(' error'))) fail(`font ${f}`);
  await step('a dive', () => p.evaluate(() => window.__app.go({ path: ['phone-ap'] })), () => window.__app.loc().path[0] === 'phone-ap');
  await step('a caught packet', async () => { await p.evaluate(() => window.__app.go({ path: [] })); await settle(p); await p.evaluate(() => window.__app.catch('video')); },
    () => !!document.querySelector('.peek'));
  await p.evaluate(() => window.__app.release());
  await step('the time machine to 1995', async () => {
    await p.click('.time-btn'); await p.waitForSelector('.picker.time');
    await p.keyboard.press('ArrowLeft'); await p.keyboard.press('ArrowLeft'); await p.keyboard.press('Enter');
  }, () => window.__app.loc().places[0] !== 'home');
  await step('Danish', () => p.evaluate(() => window.__app.go({ lang: 'da' })), () => document.documentElement.lang === 'da');
  const head = await p.evaluate(() => ({
    icons: [...document.querySelectorAll('link[rel~=icon], link[rel=apple-touch-icon]')].map((l) => l.href),
    og: Object.fromEntries([...document.querySelectorAll('meta[property^="og:"]')].map((m) => [m.getAttribute('property'), m.content])),
  }));
  if (!head.icons.length) fail('no icons in index.html');
  for (const href of head.icons) {
    const r = await p.request.get(href);
    if (!r.ok() || !/^image\//.test(r.headers()['content-type'])) fail(`icon ${href}: ${r.status()} ${r.headers()['content-type']}`);
  }
  const site = head.og['og:url'], image = head.og['og:image'];
  if (!/^https:\/\/[^%]+\/$/.test(site ?? '')) fail(`og:url "${site}" is not an absolute URL to the site`);
  else if (!image?.startsWith(site) || !existsSync(join('dist', image.slice(site.length)))) fail(`og:image "${image}" is not a file of the site`);
  console.log(`  ${head.icons.length} icons, og:image ${image}`);
  await done();
}
if (ONLY === 'subpath') { await subpath(); await browser.close(); process.exit(); }

for (const style of STYLES) {
  console.log(style);
  if (ONLY === 'a11y') { await a11y(style); continue; }
  if (ONLY === 'vision') { await vision(style); continue; }
  if (ONLY === 'fit') { await fitCheck(style); continue; }
  const key = MODE === 'night' ? `${style}-night` : style;
  const m = (metrics[key] = { ...(metrics[key] ?? {}) });

  if (ONLY !== 'shots' && !DIFF) {
    // 1. bytes actually fetched from dist/ for an English start (js/css gzipped, fonts as-is)
    const files = new Set();
    const { ctx, p } = await open('phone', url(style, 'en', 'home/watch-video'));
    p.on('requestfinished', (r) => { const u = new URL(r.url()); if (u.href.startsWith(BASE)) files.add(u.pathname); });
    await p.reload();
    await p.waitForFunction(() => window.__app);
    await p.waitForTimeout(2500);
    const size = { js: 0, css: 0, font: 0 };
    for (const f of files) {
      const path = `dist${f.endsWith('/') ? f + 'index.html' : f}`;
      if (!existsSync(path)) continue;
      const buf = readFileSync(path);
      const kind = f.endsWith('.js') ? 'js' : f.endsWith('.css') ? 'css' : /\.woff2?$/.test(f) ? 'font' : null;
      if (kind) size[kind] += kind === 'font' ? buf.length : gzipSync(buf).length;
    }
    m.kB = Object.fromEntries(Object.entries(size).map(([k, v]) => [k, +(v / 1024).toFixed(1)]));

    // 2. frame timings on the portrait phone viewport (DPR 2), at 1× and 6× CPU throttle
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Performance.enable');
    const go = (loc) => p.evaluate((l) => window.__app.go(l), loc);
    m.perf = {};
    for (const rate of [1, 6]) {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      const r = (m.perf[`${rate}x`] = {});
      await go({ places: ['home'], path: [], stop: null }); await settle(p);
      r.idle = await sample(p, cdp, 2000);
      r.flyToFibre = await sample(p, cdp, 1600, () => go({ path: ['router-internet'] }));
      await settle(p);
      r.fibreIdle = await sample(p, cdp, 1500);
      r.flyOut = await sample(p, cdp, 1600, () => go({ path: [] }));
      await settle(p);
      // all the way down: the copper cable's signal, then the Wi‑Fi envelope at the access point
      r.flyToCopper = await sample(p, cdp, 1600, () => go({ path: ['ap-router'] }));
      await settle(p);
      r.copperIdle = await sample(p, cdp, 1500);
      await go({ path: ['ap~wifi'] }); await settle(p);
      r.frameIdle = await sample(p, cdp, 1500);
      await go({ path: [] }); await settle(p);
      // three levels down: overview → inside the internet → the access fibre (GPON)
      r.flyDeep = await sample(p, cdp, 2400, () => go({ path: ['internet', 'home-cabinet'] }));
      await settle(p);
      r.deepIdle = await sample(p, cdp, 1500);
      // sideways at dive level: zoom out, travel the path, zoom in. Two quick steps (access → metro → backbone fibre)
      // join into one glide; then the long-haul and metro fibre idle.
      r.travelInternet = await sample(p, cdp, 4200, async () => {
        await p.keyboard.press('ArrowRight'); await p.waitForTimeout(350); await p.keyboard.press('ArrowRight');
      });
      await settle(p);
      r.backboneIdle = await sample(p, cdp, 1500);
      // on across the sea: the undersea cable (#39), and its idle
      r.travelToSea = await sample(p, cdp, 3500, () => p.keyboard.press('ArrowRight'));
      await settle(p);
      r.submarineIdle = await sample(p, cdp, 1500);
      await go({ path: ['internet', 'olt-bng'] }); await settle(p);
      r.metroIdle = await sample(p, cdp, 1500);
      // and on the overview: the Wi‑Fi dive to the copper dive, past the access point
      await go({ path: ['phone-ap'] }); await settle(p);
      r.travelRoot = await sample(p, cdp, 3000, () => p.keyboard.press('ArrowRight'));
      await settle(p);
      // a device dive (#9, #38): copper → inside the home router, its idle, and on to the fibre
      r.travelToRouter = await sample(p, cdp, 3000, () => p.keyboard.press('ArrowRight'));
      await settle(p);
      r.routerIdle = await sample(p, cdp, 1500);
      r.travelFromRouter = await sample(p, cdp, 3000, () => p.keyboard.press('ArrowRight'));
      await settle(p);
      await go({ path: [] }); await settle(p);
      // the scene's keys (#53): into the picture, two stops along with the ring
      await p.focus('.scene-key');
      r.keysWalk = await sample(p, cdp, 2400, async () => { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(800); await p.keyboard.press('ArrowRight'); });
      await settle(p);
      await p.keyboard.press('Escape'); await settle(p);
      // catch a packet (traffic pauses), then step it two hops on
      r.catchStep = await sample(p, cdp, 2400, async () => {
        await p.evaluate(() => window.__app.catch('video'));
        for (const _ of [1, 2]) { await p.waitForTimeout(800); await p.evaluate(() => window.__app.step(1)); }
      });
      await p.keyboard.press('Escape');
      await settle(p);
      // the time machine (#59): to 1995 (other devices, the backdrop sliding), its idle, and back to today
      r.morphToDialup = await sample(p, cdp, 1200, () => go({ places: ['home-dialup'] }));
      await settle(p);
      r.dialupIdle = await sample(p, cdp, 1500);
      await go({ places: ['home'] }); await settle(p);
      // the place morph: the house slides away, the street slides in
      r.morphToStreet = await sample(p, cdp, 1200, () => go({ places: ['on-the-go'] }));
      await settle(p);
      r.streetIdle = await sample(p, cdp, 1500);
      r.flyTo5G = await sample(p, cdp, 1600, () => go({ path: ['phone-cell-tower'] }));
      await settle(p);
      r.nrIdle = await sample(p, cdp, 1500);
      // a layer dive: tap IP in the peek (the envelope grows into the dive), idle there, step up the stack
      await go({ places: ['home'], path: [], stop: null }); await settle(p);
      await p.evaluate(() => window.__app.catch('video'));
      await p.waitForSelector('.peek');
      await p.waitForTimeout(600);
      r.openLayer = await sample(p, cdp, 1600, () => p.evaluate(() => window.__app.openLayer('ip')));
      await settle(p);
      r.layerIdle = await sample(p, cdp, 1500);
      r.layerStep = await sample(p, cdp, 1600, () => p.keyboard.press('ArrowUp'));
      await settle(p);
      r.layerStepIdle = await sample(p, cdp, 1500);
    }
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await ctx.close();
    console.log(' ', JSON.stringify(m));
  }

  if (ONLY !== 'perf') {
    // 3. screenshots
    const shots = [];
    for (const view of ['desktop', 'phone']) {
      shots.push({ view, where: 'home/watch-video', name: `home-${view}` });
      shots.push({ view, where: 'on-the-go/watch-video', name: `on-the-go-${view}` });
      shots.push({ view, where: 'home/watch-video/phone-ap', name: `wifi-${view}` });
      shots.push({ view, where: 'on-the-go/watch-video/phone-cell-tower', name: `5g-${view}` });
      shots.push({ view, where: 'home/watch-video/internet', name: `internet-${view}` });
      shots.push({ view, where: 'on-the-go/watch-video/internet', name: `internet-on-the-go-${view}` });
      shots.push({ view, where: 'home/watch-video/internet/home-cabinet', name: `gpon-${view}` });
      // layer dives: one scene per layer, varied by where it's opened
      shots.push({ view, where: 'home/watch-video/router~ip', name: `ip-nat-${view}` });
      shots.push({ view, where: 'home/watch-video/internet/core~ip', name: `ip-router-${view}` });
      shots.push({ view, where: 'on-the-go/watch-video/internet/mobile-core~ip', name: `ip-cgnat-${view}` });
      shots.push({ view, where: 'home/watch-video/ap~ip', name: `ip-bridge-${view}` });
      shots.push({ view, where: 'home/watch-video/phone~tcp', name: `tcp-${view}` });
      shots.push({ view, where: 'home/watch-video/router~tcp', name: `tcp-sealed-${view}` });
      shots.push({ view, where: 'home/watch-video/phone~tls', name: `tls-${view}` });
      shots.push({ view, where: 'home/watch-video/phone~http', name: `http-${view}` });
      shots.push({ view, where: 'home/watch-video/router~http', name: `http-sealed-${view}` });
      shots.push({ view, where: 'on-the-go/watch-video/cell-tower~gtp', name: `gtp-${view}` });
      // all the way down (issues #13, #18): the link envelopes and the signals under them
      shots.push({ view, where: 'home/watch-video/ap-router', name: `copper-${view}` });
      shots.push({ view, where: 'home/watch-video/internet/bng-core', name: `backbone-${view}` });
      shots.push({ view, where: 'home/watch-video/internet/core-border', name: `submarine-${view}` });
      shots.push({ view, where: 'home/watch-video/internet/olt-bng', name: `metro-${view}` });
      shots.push({ view, where: 'home/watch-video/ap~wifi', name: `wifi-frame-${view}` });
      shots.push({ view, where: 'home/watch-video/router~ethernet', name: `ethernet-me-${view}` });
      shots.push({ view, where: 'home/watch-video/internet/olt~ethernet', name: `ethernet-bridge-${view}` });
      shots.push({ view, where: 'home/watch-video/internet/olt~vlan', name: `vlan-${view}` });
      shots.push({ view, where: 'home/watch-video/internet/core~mpls', name: `mpls-${view}` });
      shots.push({ view, where: 'home/watch-video/router~gpon', name: `gpon-frame-${view}` });
      shots.push({ view, where: 'on-the-go/watch-video/phone~nr', name: `nr-frame-${view}` });
      // device dives (#9): inside the home router and the cell tower
      shots.push({ view, where: 'home/watch-video/router', name: `router-${view}` });
      shots.push({ view, where: 'on-the-go/watch-video/cell-tower', name: `tower-${view}` });
    }
    // short landscape (a phone on its side): the caption is a pill, the fibre stretches have compact layouts
    for (const [where, name] of [['home/watch-video', 'home'], ['home/watch-video/internet', 'internet'], ['home/watch-video/internet/home-cabinet', 'gpon'],
      ['home/watch-video/internet/olt-bng', 'metro'], ['home/watch-video/internet/bng-core', 'backbone'],
      ['home/watch-video/internet/core-border', 'submarine'],
      ['home/watch-video/router', 'router'], ['on-the-go/watch-video/cell-tower', 'tower']])
      shots.push({ view: 'short', where, name: `${name}-short` });
    // technical extras (#31) in the physical dives
    shots.push({ view: 'desktop', where: 'home/watch-video/phone-ap', q: '&level=technical', name: 'wifi-technical-desktop' });
    shots.push({ view: 'phone', where: 'home/watch-video/ap~wifi', q: '&level=technical', name: 'wifi-frame-technical-phone' });
    shots.push({ view: 'phone', where: 'home/watch-video/router-internet', lang: 'da', q: '&level=technical', name: 'fibre-technical-da-phone' });
    shots.push({ view: 'desktop', where: 'home/watch-video/internet/bng-core', lang: 'da', q: '&level=technical', name: 'backbone-technical-da-desktop' });
    shots.push({ view: 'phone', where: 'home/watch-video/internet/core-border', lang: 'da', q: '&level=technical', name: 'submarine-technical-da-phone' });
    shots.push({ view: 'phone', where: 'home/watch-video/internet/home-cabinet', q: '&level=technical', name: 'gpon-technical-phone' });
    shots.push({ view: 'desktop', where: 'desk/watch-video', name: 'desk-desktop' });
    shots.push({ view: 'desktop', where: 'home/watch-video/router-internet', name: 'fibre-desktop' });
    shots.push({ view: 'desktop', where: 'home/watch-video', q: '&level=technical', name: 'home-technical-desktop' });
    shots.push({ view: 'phone', where: 'on-the-go/watch-video/internet', lang: 'da', q: '&level=technical', name: 'internet-on-the-go-technical-da-phone' });
    shots.push({ view: 'phone', where: 'home/watch-video/phone~tcp', lang: 'da', q: '&level=technical', name: 'tcp-technical-da-phone' });
    shots.push({ view: 'phone', where: 'home/watch-video/internet/datacentre/cdn~http', lang: 'da', q: '&level=technical', name: 'http-cdn-technical-da-phone' });
    shots.push({ view: 'desktop', where: 'home/watch-video/ap-router', lang: 'da', q: '&level=technical', name: 'copper-technical-da-desktop' });
    shots.push({ view: 'phone', where: 'home/watch-video/internet/olt~gpon', lang: 'da', q: '&level=technical', name: 'gpon-frame-technical-da-phone' });
    shots.push({ view: 'desktop', where: 'on-the-go/watch-video/cell-tower~nr', q: '&level=technical', name: 'nr-frame-technical-desktop' });
    shots.push({ view: 'desktop', where: 'home/watch-video/router', lang: 'da', q: '&level=technical', name: 'router-technical-da-desktop' });
    shots.push({ view: 'phone', where: 'on-the-go/watch-video/cell-tower', lang: 'da', q: '&level=technical', name: 'tower-technical-da-phone' });
    // `at`: the hop the packet is caught at, then one per step on
    shots.push({ view: 'desktop', where: 'home/watch-video', catch: 'video', at: ['router'], grow: 'ip', name: 'grow-desktop' });
    shots.push({ view: 'desktop', where: 'home/watch-video', catch: 'video', at: ['router'], name: 'peek-desktop' });
    shots.push({ view: 'phone', where: 'on-the-go/watch-video', catch: 'video', at: ['cell-tower'], name: 'peek-on-the-go-phone' });
    // the caught request one hop on from the phone, in technical mode, and its detail tree
    shots.push({ view: 'desktop', where: 'home/watch-video', q: '&level=technical', catch: 'request', at: ['phone', 'ap'], name: 'peek-technical-desktop' });
    shots.push({ view: 'phone', where: 'home/watch-video', q: '&level=technical', lang: 'da', catch: 'request', at: ['phone'], detail: true, name: 'peek-tree-da-phone' });
    shots.push({ view: 'desktop', where: 'home/watch-video', picker: true, name: 'picker-desktop' });
    shots.push({ view: 'phone', where: 'home/watch-video', picker: true, name: 'picker-phone' });
    shots.push({ view: 'desktop', where: 'home/watch-video', morph: true, name: 'morph-desktop' });
    const shoot = async (s, base = BASE) => {
      const { ctx, p } = await open(s.view, url(style, s.lang ?? 'en', s.where, s.q ?? '', base));
      await settle(p);
      // a fixed clock so packets sit in the same spots across runs (held still for a pixel diff)
      await p.evaluate((hold) => window.__app.setClock(5.2, hold), !!DIFF);
      if (s.catch) {
        await catchAt(p, s.catch, s.at, s.name);
        if (s.detail) await p.click('.peek header .chip');
        // (longer for a diff: the camera's tracking of the caught packet eases in exponentially)
        await p.waitForTimeout(DIFF ? 4000 : 1500);
        if (s.grow) {
          // mid-flight into a layer dive: the peek's envelope on its way to becoming the dive's panel
          await p.evaluate((l) => window.__app.openLayer(l), s.grow);
          await p.waitForTimeout(330);
        }
      } else if (s.picker) {
        await p.evaluate(() => window.__app.picker(true));
        await p.waitForTimeout(500);
      } else if (s.morph) {
        // mid-morph: the house on its way out, the street on its way in
        await p.evaluate(() => window.__app.go({ places: ['on-the-go'] }));
        await p.waitForTimeout(330);
      } else await p.waitForTimeout(700);
      const shot = DIFF ? await stableShot(p, s.name) : await p.screenshot({ path: `docs/img/app-${style}${MODE === 'night' ? '-night' : ''}-${s.name}.jpg`, type: 'jpeg', quality: s.view === 'phone' ? 68 : 74 });
      await ctx.close();
      return shot;
    };
    if (!DIFF) {
      for (const s of shots) await shoot(s);
    } else {
      mkdirSync('.tmp/diff', { recursive: true });
      const cmp = await browser.newPage();
      let same = 0;
      for (const s of shots) {
        // mid-transition frames depend on wall-clock timing, so they can't be compared pixel for pixel
        if (s.morph || s.grow) continue;
        const [a, b] = await Promise.all([shoot(s), shoot(s, DIFF)]);
        const r = await cmp.evaluate(comparePng, [a.toString('base64'), b.toString('base64')]);
        if (!r.n) { same++; continue; }
        writeFileSync(`.tmp/diff/${MODE === 'night' ? 'night-' : ''}${s.name}.png`, Buffer.from(r.png, 'base64'));
        console.log(`  ${s.name}: ${r.n} px differ (${((r.n / r.total) * 100).toFixed(3)} %), ${r.big} by more than 24/765, max ${r.max}`);
      }
      await cmp.close();
      console.log(`  ${same} of ${shots.filter((s) => !s.morph && !s.grow).length} shots identical`);
      continue;
    }
    console.log(`  ${shots.length} screenshots`);
  }
}
if (!DIFF && ONLY !== 'a11y' && ONLY !== 'vision' && ONLY !== 'fit') writeFileSync(metricsPath, JSON.stringify({ generated: new Date().toISOString(), gpu: !process.env.SWIFTSHADER, viewport: 'perf: 390×844 @2x (portrait phone)', metrics }, null, 2) + '\n');
await browser.close();
