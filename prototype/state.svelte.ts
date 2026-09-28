// Reactive app state: language/level, style + lab settings (synced to the URL query), the active theme,
// and the view (camera, viewport, orientation) shared with scene components.
import { getLang, getLevel, onLangChange, onLevelChange, setLevel, t, type Level } from './core/i18n';
import type { Cam, Viewport } from './core/camera';
import type { FeelKind, ZoomKind } from './core/motion';
import type { Orient } from './core/scene';
import { sfx } from './core/sound';
import type { Theme } from './core/theme-types';
import { clearMeasureCache } from './core/svg';
import { defineTheme } from './themes/_base';

// ------------------------------------------------------------------ language + level
export const loc = $state<{ lang: string; level: Level }>({ lang: getLang(), level: getLevel() });
onLangChange((l) => { loc.lang = l; clearMeasureCache(); });
onLevelChange((l) => (loc.level = l));
export function tr(key: string) {
  void loc.lang;
  return t(key);
}

// ------------------------------------------------------------------ themes (pluggable folders)
// theme.ts (art, tokens, fonts) is loaded lazily; meta.json (order + switcher swatch) is tiny and eager.
const themeModules = import.meta.glob<{ default: Theme }>('./themes/*/theme.ts');
const themeMeta = import.meta.glob<{ order: number; swatch: string }>('./themes/*/meta.json', { eager: true, import: 'default' });
const idOf = (p: string) => p.split('/')[2];
const metaOf = (id: string) => themeMeta[`./themes/${id}/meta.json`] ?? { order: 99, swatch: '#888' };
export const THEME_IDS = Object.keys(themeModules).map(idOf).sort((a, b) => metaOf(a).order - metaOf(b).order || a.localeCompare(b));
export const themeSwatches: Record<string, string> = Object.fromEntries(THEME_IDS.map((id) => [id, metaOf(id).swatch]));

// ------------------------------------------------------------------ settings (URL query)
export type OrientSetting = 'auto' | Orient;
export interface Settings {
  style: string;
  zoom: 'auto' | ZoomKind;
  feel: 'auto' | FeelKind;
  alive: boolean;
  sound: boolean;
  orient: OrientSetting;
  lab: boolean;
}
const q = new URLSearchParams(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pick = <T extends string>(v: string | null, ok: readonly T[], d: T): T => (v && (ok as readonly string[]).includes(v) ? (v as T) : d);
const storedStyle = localStorage.getItem('style');

export const settings = $state<Settings>({
  style: pick(q.get('style'), THEME_IDS, pick(storedStyle, THEME_IDS, THEME_IDS[0])),
  zoom: pick(q.get('zoom'), ['auto', 'fly', 'portal', 'parallax'] as const, reduced ? 'parallax' : 'auto'),
  feel: pick(q.get('feel'), ['auto', 'ease', 'spring', 'twos'] as const, reduced ? 'ease' : 'auto'),
  alive: q.get('alive') === '1', // decided: plain packets by default (docs/look-and-feel.md)
  sound: false, // always muted on load
  orient: pick(q.get('orient'), ['auto', 'landscape', 'portrait'] as const, 'auto'),
  lab: q.get('lab') === '1',
});
if (q.get('level') === 'nerd' || q.get('level') === 'kid') setLevel(q.get('level') as Level);

/** Write non-default settings back into the query string (hash is left alone). */
export function syncUrl() {
  const p = new URLSearchParams();
  p.set('style', settings.style);
  if (settings.zoom !== 'auto') p.set('zoom', settings.zoom);
  if (settings.feel !== 'auto') p.set('feel', settings.feel);
  if (settings.alive) p.set('alive', '1');
  if (settings.orient !== 'auto') p.set('orient', settings.orient);
  if (settings.lab) p.set('lab', '1');
  const url = `${location.pathname}?${p.toString()}${location.hash}`;
  if (url !== location.pathname + location.search + location.hash) history.replaceState(history.state, '', url);
  localStorage.setItem('style', settings.style);
}

export function setSound(on: boolean) {
  settings.sound = on;
  sfx.setEnabled(on);
}

// ------------------------------------------------------------------ active theme
const placeholder = defineTheme({
  id: 'loading', themeColor: '#101010', scheme: 'dark', labelMinPx: 12,
  motion: { zoom: 'fly', feel: 'ease', speed: 1, spring: { damping: 0.6, frequency: 1.6 }, twosFps: 12 },
  timbre: { wave: 'sine', blip: 880, noise: { freq: 900, q: 0.8 }, gain: 0.5, detune: 0, decay: 0.18 },
  colours: { tech: { wifi: '#3ef0ff', ethernet: '#ffb547', fibre: '#ff4fd8', backbone: '#a9b8ff' }, packet: { request: '#ffe066', video: '#ff6b8b' }, dwdm: ['#ff4d6d', '#ffd23f', '#3ef0a0', '#4dabff'], bit: ['#8190ff', '#ffe066'] },
});
export const themeState = $state<{ current: Theme; ready: boolean }>({ current: placeholder, ready: false });
const loaded = new Map<string, Theme>();

export async function loadTheme(id: string) {
  let th = loaded.get(id);
  if (!th) {
    const mod = await themeModules[`./themes/${id}/theme.ts`]();
    th = mod.default;
    loaded.set(id, th);
  }
  // Wait for this theme's fonts (declared in its tokens.css), so text measurements and first paint are right.
  // document.fonts.ready doesn't wait for faces nothing uses yet, so request them explicitly (Latin + Arabic).
  document.documentElement.dataset.style = id;
  const cs = getComputedStyle(document.documentElement);
  const fams = [...new Set(['--ui-font', '--heading-font', '--label-font', '--tag-font'].map((v) => cs.getPropertyValue(v).trim()).filter(Boolean))];
  const loads = fams.flatMap((f) => ['Ab', 'عربي'].map((txt) => document.fonts.load(`700 20px ${f}`, txt).catch(() => [])));
  await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 1500))]);
  clearMeasureCache();
  themeState.current = th;
  themeState.ready = true;
  sfx.timbre = th.timbre;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', th.themeColor);
  document.documentElement.style.colorScheme = th.scheme;
}

// ------------------------------------------------------------------ view (shared with scenes)
export const view = $state<{ vp: Viewport; orient: Orient; time: number; real: number; followId: string | null }>({
  vp: { w: 1, h: 1, top: 0, bottom: 0 }, orient: 'landscape', time: 0, real: 0, followId: null,
});
export type { Cam };
