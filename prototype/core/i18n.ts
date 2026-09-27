// Tiny i18n lookup. Every folder in /locales/<lang>/strings.json is a language pack;
// adding a folder adds a language – no code changes.
type Pack = Record<string, string> & { _meta?: never };
interface Meta { name: string; dir: 'ltr' | 'rtl'; note?: string }
interface Raw { _meta: Meta; [key: string]: unknown }

const raw = import.meta.glob<Raw>('/locales/*/strings.json', { eager: true, import: 'default' });
// Pluggable content folders (themes, envelope layers, …) carry their own strings: <folder>/locales/<lang>.json.
const extra = import.meta.glob<Record<string, string>>('/prototype/{themes,layers}/*/locales/*.json', { eager: true, import: 'default' });

const packs: Record<string, { meta: Meta; strings: Pack }> = {};
for (const [path, data] of Object.entries(raw)) {
  const lang = path.split('/')[2];
  const { _meta, ...strings } = data;
  packs[lang] = { meta: _meta, strings: strings as Pack };
}
for (const [path, data] of Object.entries(extra)) {
  const lang = path.split('/').pop()!.replace('.json', '');
  if (packs[lang]) Object.assign(packs[lang].strings, data);
}

export const FALLBACK = 'en';
export const languages = Object.keys(packs)
  .sort((a, b) => (a === FALLBACK ? -1 : b === FALLBACK ? 1 : a.localeCompare(b)))
  .map((code) => ({ code, ...packs[code].meta }));

let current = FALLBACK;
const listeners = new Set<(lang: string) => void>();

export function t(key: string): string {
  return packs[current]?.strings[key] ?? packs[FALLBACK].strings[key] ?? key;
}
export const has = (key: string) => key in (packs[current]?.strings ?? {}) || key in packs[FALLBACK].strings;

export const getLang = () => current;
export const isLang = (l: string | undefined): l is string => !!l && l in packs;
export const dir = () => packs[current].meta.dir;

export function setLang(lang: string) {
  if (!isLang(lang) || lang === current) return;
  current = lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = packs[lang].meta.dir;
  listeners.forEach((fn) => fn(lang));
}

export function onLangChange(fn: (lang: string) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Kid / nerd explanation level (not a language, but also a text choice).
export type Level = 'kid' | 'nerd';
let level: Level = (localStorage.getItem('level') as Level) || 'kid';
const levelListeners = new Set<(l: Level) => void>();
export const getLevel = () => level;
export function setLevel(l: Level) {
  level = l;
  localStorage.setItem('level', l);
  levelListeners.forEach((fn) => fn(l));
}
export function onLevelChange(fn: (l: Level) => void) {
  levelListeners.add(fn);
  return () => levelListeners.delete(fn);
}
