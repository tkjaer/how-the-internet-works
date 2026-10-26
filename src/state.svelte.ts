// Reactive app state: language/level, the current location + resolved route, style + sound settings (the style is
// synced to the URL query), the active theme, day or night, and the view (viewport, orientation, clock, mode) shared
// with scenes.
import { tick } from 'svelte';
import type { ActivityDef, Level, Mode, Orient } from './define';
import type { Viewport } from './engine/camera';
import { sfx, soundOnLoad, wakeOnGesture } from './engine/sound';
import { speaker } from './engine/speech';
import { clearMeasureCache, textBox } from './engine/svg';
import type { Loc } from './model/location';
import { activityKey, resolveRoute, stringSources, type Hop, type Route } from './model/resolve';
import { nowEra } from './model/registry';
import { firstOf, languages, linksOf, loadDiveStrings as loadDives, loadPastStrings as loadPast, lookup, packs, withEra } from './model/strings';
import { defineTheme } from './render/art-base';
import type { Theme } from './render/theme-types';

// ------------------------------------------------------------------ language + level
/** The levels, as the URL (`?level=technical`), storage, content (`"simple": …, "technical": …`) and code name them
 *  (#196); readers see "Simple" and "Technical" (#141). The old `kid` and `nerd` are no level any more. */
const LEVELS: readonly Level[] = ['simple', 'technical'];
const levelNamed = (name: string | null) => LEVELS.find((l) => l === name);
export const loc = $state<{ lang: string; level: Level }>({ lang: 'en', level: levelNamed(localStorage.getItem('level')) ?? 'simple' });

export function setLang(lang: string) {
  if (lang === loc.lang && document.documentElement.lang === lang) return;
  loc.lang = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = packs[lang]?.meta.dir ?? 'ltr';
  clearMeasureCache();
}
export function setLevel(l: Level) {
  loc.level = l;
  localStorage.setItem('level', l);
}
const q = new URLSearchParams(location.search);
const asked = levelNamed(q.get('level'));
if (asked) setLevel(asked);

/** Bumped when more strings arrive (the English dive strings), so text (and links) that asked for them too early updates. */
const more = $state({ n: 0 });
let dives: Promise<void> | null = null, then: Promise<void> | null = null;
export const loadDiveStrings = () => (dives ??= loadDives().then(() => { more.n++; }));
/** The words for the eras of the past (#59): text asked for before they arrive updates when they do. */
export const loadPastStrings = () => (then ??= loadPast().then(() => { more.n++; }));
const NOW = nowEra();
/** The route's era when it is in the past: a content item's strings for it come first (`withEra`, #59). */
const past = () => (nav.route.era === NOW ? undefined : nav.route.era);
/** A UI or content string in the current language (English fallback; the key itself if missing everywhere). */
export const tr = (key: string) => (more.n, firstOf(loc.lang, withEra([key], past())) ?? key);
/** Level-aware: `key.simple` / `key.technical`, falling back to `key`. */
export const trl = (key: string, level: Level = loc.level) => (more.n, firstOf(loc.lang, withEra([key], past()), level) ?? key);
/** The first of several keys (most specific first) that has a string. */
export const trFirst = (keys: string[], level?: Level) => (more.n, firstOf(loc.lang, withEra(keys, past()), level) ?? '');
/** The learn-more links of some content items ("layer.tcp"), in the language and in English (`linksOf`); a layer's
 *  and a dive scene's English ones arrive with the dive strings. */
export const trLinks = (items: string[], lang = loc.lang) => (more.n, linksOf(lang, items));
/** Fill {placeholders}. */
export const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
/** A count in words, by the language's plural form: `key.one`, `key.other`, … with {n} filled ("4 ways down"). */
export const trCount = (key: string, n: number) =>
  fill(trFirst([`${key}.${new Intl.PluralRules(loc.lang).select(n)}`, `${key}.other`]), { n });

// ------------------------------------------------------------------ where we are
// Raw state: the router replaces both wholesale, and a route is resolved once and cached, so `nav.route` stays the
// same object while the route doesn't change (a deep $state would wrap it in a fresh proxy on every navigation).
class Nav {
  loc = $state.raw<Loc>({ lang: 'en', places: [], activity: '', path: [], stop: null });
  route = $state.raw<Route>(resolveRoute({ activity: '', places: [] }));
}
export const nav = new Nav();
/** Display name of a hop (an instance of a node). */
export const nameOf = (h: Hop | string) => tr(`node.${typeof h === 'string' ? nav.route.hops[h]?.node.id ?? h : h.node.id}.name`);
/** How wide a device's name is drawn, at its authored 28 units (in this language and theme). */
export const nameW = (n: { node: { id: string } }) => textBox(tr(`node.${n.node.id}.name`), 28, 'middle', 0.6, '--label-font').w;
/** How the text refers to the reader's own device ("your phone"): the node's `yours` string, else its name. */
export const yours = (h: Hop) => lookup(loc.lang, `node.${h.node.id}.yours`) ?? nameOf(h);
/** An activity's string (`title`, `packet.<kind>`, …): a variant of another era speaks through its base (#59). */
export const trActivity = (a: ActivityDef & { id: string }, key: string, level?: Level) => trFirst([`${activityKey(a)}.${key}`], level);
/** Strings for an item in the current route: the places and segments may override the item's own text. */
export const routeKeys = (suffix: string) => stringSources(nav.route).map((s) => `${s}.${suffix}`);

// ------------------------------------------------------------------ themes (pluggable folders)
// theme.ts (art, tokens, fonts) is loaded lazily; meta.json (order + switcher swatch) is tiny and eager.
const themeModules = import.meta.glob<{ default: Theme }>('/content/themes/*/theme.ts');
const themeMeta = import.meta.glob<{ order: number; swatch: string }>('/content/themes/*/meta.json', { eager: true, import: 'default' });
const idOf = (p: string) => p.split('/')[3];
const metaOf = (id: string) => themeMeta[`/content/themes/${id}/meta.json`] ?? { order: 99, swatch: '#888' };
export const THEME_IDS = Object.keys(themeModules).map(idOf).sort((a, b) => metaOf(a).order - metaOf(b).order || a.localeCompare(b));
export const themeSwatches: Record<string, string> = Object.fromEntries(THEME_IDS.map((id) => [id, metaOf(id).swatch]));

/** `paused`: the reader stopped all motion (remembered, like the level: it's an access need, WCAG 2.2.2). `speech`:
 *  read aloud (#53; remembered too). `sound`: on unless the reader muted it (remembered) or the link says
 *  `?sound=off` (#189). */
export interface Settings { style: string; sound: boolean; mode: Mode; paused: boolean; speech: boolean }
const pick = <T extends string>(v: string | null, ok: readonly T[], d: T): T => (v && (ok as readonly string[]).includes(v) ? (v as T) : d);
export const settings = $state<Settings>({
  style: pick(q.get('style'), THEME_IDS, pick(localStorage.getItem('style'), THEME_IDS, THEME_IDS[0])),
  sound: soundOnLoad(q.get('sound'), localStorage.getItem('sound')),
  mode: 'day', // set below
  paused: localStorage.getItem('paused') === '1',
  speech: localStorage.getItem('speech') === '1',
});
// rush hour is gone (#114): forget the choice a reader may have stored for it
localStorage.removeItem('rush');

/** Write the style back into the query string (hash is left alone); only needed once there is a choice. A `mode` or
 *  `sound` already in the query is kept in step with the reader's choice. */
export function syncUrl() {
  const p = new URLSearchParams(location.search);
  if (THEME_IDS.length > 1) p.set('style', settings.style);
  if (p.has('mode')) p.set('mode', settings.mode);
  if (p.has('sound')) p.set('sound', settings.sound ? 'on' : 'off');
  const qs = p.toString();
  const url = `${location.pathname}${qs ? `?${qs}` : ''}${location.hash}`;
  if (url !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', url);
  localStorage.setItem('style', settings.style);
}
export function setPaused(on: boolean) {
  settings.paused = on;
  if (on) localStorage.setItem('paused', '1');
  else localStorage.removeItem('paused');
}

// ------------------------------------------------------------------ sound (#189)
// On from the first tap or key (a browser lets no audio start before one), unless the reader muted it: muting is
// remembered, and `?sound=on|off` wins for one load.
/** A tap or key has let audio start. */
const audio = $state({ woken: false });
sfx.setEnabled(settings.sound);
wakeOnGesture(window, () => { audio.woken = true; sfx.wake(); });
export function setSound(on: boolean) {
  settings.sound = on;
  if (on) localStorage.removeItem('sound');
  else localStorage.setItem('sound', 'off');
  sfx.setEnabled(on);
  syncUrl();
}
/** Where a scene may play a short sound of its own: the Web Audio output while sound is on and a tap or key has let
 *  it start, else null. Reactive. */
export const soundOut = () => (settings.sound && audio.woken ? sfx.out() : null);

/** Bumped when the system's voices change (they load after the page), so whether read aloud is offered updates. */
const voices = $state({ n: 0 });
speaker.onvoices(() => voices.n++);
/** Whether read aloud can be offered: there's a voice for the page's language. */
export const canSpeak = () => (voices.n, speaker.available(loc.lang));
/** Turn read aloud on or off. Turned on, it says so straight away: inside the tap, which is what lets iOS speak. */
export function setSpeech(on: boolean) {
  settings.speech = on;
  if (on) localStorage.setItem('speech', '1');
  else localStorage.removeItem('speech');
  if (on) speaker.say(tr('speech.on'), loc.lang, loc.level);
  else speaker.cancel();
}
/** Whether read aloud is on and there's a voice for it. */
export const reading = () => settings.speech && canSpeak();
/** Read `text` aloud, if read aloud is on and there's a voice for it. */
export function readAloud(text: string) {
  if (reading()) speaker.say(text, loc.lang, loc.level);
}

const placeholder = defineTheme({
  id: 'loading', themeColor: '#101010', scheme: 'dark', labelMinPx: 12, motion: { speed: 1 },
  timbre: { wave: 'sine', blip: 880, noise: { freq: 900, q: 0.8 }, gain: 0.5, detune: 0, decay: 0.18 },
});
export const themeState = $state<{ current: Theme; ready: boolean }>({ current: placeholder, ready: false });
const loaded = new Map<string, Theme>();

export async function loadTheme(id: string) {
  let th = loaded.get(id);
  if (!th) {
    th = (await themeModules[`/content/themes/${id}/theme.ts`]()).default;
    loaded.set(id, th);
  }
  // Wait for this theme's fonts (declared in its tokens.css), so text measurements and first paint are right.
  // document.fonts.ready doesn't wait for faces nothing uses yet, so request them explicitly, with every language's
  // own name as the sample text so each script's faces load. The mode goes on first, so a night reader never sees
  // the day palette while the fonts load.
  applyMode(th);
  document.documentElement.dataset.style = id;
  const cs = getComputedStyle(document.documentElement);
  const fams = [...new Set(['--ui-font', '--heading-font', '--label-font', '--tag-font'].map((v) => cs.getPropertyValue(v).trim()).filter(Boolean))];
  const sample = `Ab${languages.map((l) => l.name).join('')}`;
  const loads = fams.map((f) => document.fonts.load(`700 20px ${f}`, sample).catch(() => []));
  await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 1500))]);
  clearMeasureCache();
  themeState.current = th;
  themeState.ready = true;
  sfx.timbre = th.timbre;
}

// ------------------------------------------------------------------ view (shared with scenes)
const calm = matchMedia('(prefers-reduced-motion: reduce)');
/** `still`: the reader prefers reduced motion (decorative motion, like the doors' breathing, stands still). */
/** `mode`: day or night (always day when the theme has no night). */
/** `keys`: the last input was a key, not a pointer (the hints name keys; App sets it). */
export const view = $state<{ vp: Viewport; orient: Orient; time: number; real: number; followId: string | null; still: boolean; mode: Mode; keys: boolean }>({
  vp: { w: 1, h: 1, top: 0, bottom: 0 }, orient: 'landscape', time: 0, real: 0, followId: null, still: calm.matches, mode: 'day', keys: false,
});
calm.addEventListener('change', () => (view.still = calm.matches));

// ------------------------------------------------------------------ day and night
// The reader's mode follows the OS (prefers-color-scheme) until they pick one with the toggle; `?mode=day|night` in
// the link wins on load. A choice that matches the OS is not stored, so the page goes back to following the OS. The
// engine only sets `data-mode` on <html> (the theme's tokens do the rest) and `view.mode` (for art that adds
// night-only things); a theme without `night` stays in day.
const dark = matchMedia('(prefers-color-scheme: dark)');
const osMode = (): Mode => (dark.matches ? 'night' : 'day');
const asMode = (v: string | null): Mode | null => (v === 'day' || v === 'night' ? v : null);
function remember(m: Mode) {
  settings.mode = m;
  if (m === osMode()) localStorage.removeItem('mode');
  else localStorage.setItem('mode', m);
}
remember(asMode(q.get('mode')) ?? asMode(localStorage.getItem('mode')) ?? osMode());

/** Whether the current theme has a night (the toggle hides when it doesn't). */
export const hasNight = () => !!themeState.current.night;

function applyMode(th = themeState.current) {
  const m: Mode = th.night ? settings.mode : 'day';
  const look = m === 'night' && th.night ? th.night : th;
  view.mode = m;
  document.documentElement.dataset.mode = m;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', look.themeColor);
  document.documentElement.style.colorScheme = look.scheme;
}

/** Switch day ↔ night: a cross-fade of the whole page (a View Transition, styled by the theme), or at once with
 *  prefers-reduced-motion or where View Transitions aren't supported. */
export function setMode(m: Mode) {
  remember(m);
  syncUrl();
  if (view.mode === (hasNight() ? m : 'day')) return;
  if (view.still || !document.startViewTransition) return applyMode();
  document.startViewTransition(async () => { applyMode(); await tick(); });
}
dark.addEventListener('change', () => { if (!localStorage.getItem('mode')) setMode(osMode()); });
