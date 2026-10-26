// Language packs. /content/locales/<lang>/{meta.json, ui.json} makes a language; every content folder carries its
// own strings in <folder>/locales/<lang>.json, auto-namespaced by kind and id ("node.phone.name"), with nested JSON
// flattened ("stop": { "cabinet": … } → "….stop.cabinet"). Anything missing falls back to English. A folder's
// learn-more links in that language are its file's "learnMore" list, kept by the same namespace ("node.phone").
import packLoaders from 'virtual:string-packs';
import type { LearnMore, Level, LocaleMeta } from '../define';

type Strings = Record<string, string>;
/** A language's strings, and its learn-more links by content item ("node.phone"). */
export interface Pack { meta: LocaleMeta; strings: Strings; links: Record<string, LearnMore[]> }
export type Json = { [k: string]: string | Json };

export const FALLBACK = 'en';
/** Content folder kind → string key namespace. */
const NAMESPACE: Record<string, string> = {
  nodes: 'node', owners: 'owner', technologies: 'tech', layers: 'layer', scenes: 'scene', segments: 'segment',
  places: 'place', activities: 'activity', themes: 'theme', eras: 'era',
};

function flatten(obj: Json, prefix: string, out: Strings = {}): Strings {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else flatten(v, key, out);
  }
  return out;
}

/** Build all packs from the glob results (paths are absolute from the project root). */
function buildPacks(meta: Record<string, LocaleMeta>, ui: Record<string, Json>, folders: Record<string, Json>): Record<string, Pack> {
  const packs: Record<string, Pack> = {};
  for (const [path, m] of Object.entries(meta)) packs[path.split('/')[3]] = { meta: m, strings: {}, links: {} };
  for (const [path, data] of Object.entries(ui)) {
    const lang = path.split('/')[3];
    if (packs[lang]) flatten(data, '', packs[lang].strings);
  }
  // /content/<kind>/<id>/locales/<lang>.json
  for (const [path, data] of Object.entries(folders)) {
    const [, , kind, id, , file] = path.split('/');
    const lang = file.replace(/\.json$/, '');
    if (!packs[lang] || !NAMESPACE[kind]) continue;
    const { learnMore, ...strings } = data as Record<string, unknown>;
    flatten(strings as Json, `${NAMESPACE[kind]}.${id}`, packs[lang].strings);
    if (Array.isArray(learnMore)) packs[lang].links[`${NAMESPACE[kind]}.${id}`] = (learnMore as Omit<LearnMore, 'lang'>[]).map((l) => ({ ...l, lang }));
  }
  return packs;
}

/** Copy a lazily built pack's strings and links into the one the app reads. */
function merge(into: Pack, built: Pack) {
  Object.assign(into.strings, built.strings);
  Object.assign(into.links, built.links);
}

// English (the fallback) ships in the main bundle, but for its dive strings (layers, dive scenes and the time
// machine's eras: `loadDiveStrings`) and the other folders' blocks for the eras of the past, which `?now` leaves out
// (`loadPastStrings`); other languages load when first chosen, one chunk each (the `virtual:string-packs` plugin in vite.config.ts), so adding a language
// costs nothing for everyone else.
export const packs = buildPacks(
  import.meta.glob<LocaleMeta>('/content/locales/*/meta.json', { eager: true, import: 'default' }),
  import.meta.glob<Json>('/content/locales/en/ui.json', { eager: true, import: 'default' }),
  import.meta.glob<Json>(['/content/*/*/locales/en.json', '!/content/layers/*/locales/en.json', '!/content/scenes/*/locales/en.json', '!/content/eras/*/locales/en.json'], { eager: true, import: 'default', query: '?now' }),
);
/** A lazy part of the English strings, added to the pack once it has loaded (once). */
function lazyEnglish(load: () => Promise<{ folders: Record<string, Json> }>): () => Promise<void> {
  let loaded: Promise<void> | null = null;
  return () => (loaded ??= load().then(({ folders }) => {
    merge(packs[FALLBACK], buildPacks({ [`/content/locales/${FALLBACK}/meta.json`]: packs[FALLBACK].meta }, {}, folders)[FALLBACK]);
  }));
}
/** Load the English dive strings: the layers', the dive scenes' and the eras', before showing a caught packet, a dive
 *  or the time machine. */
export const loadDiveStrings = lazyEnglish(() => import('virtual:dive-strings'));
/** Load the English words for the eras of the past (every node's, place's, activity's… `"1995": { … }`), before
 *  showing a route of the past (#59). */
export const loadPastStrings = lazyEnglish(() => import('virtual:past-strings'));
const loading = new Map<string, Promise<void>>([[FALLBACK, Promise.resolve()]]);

/** Load a language's strings (once). Unknown languages resolve at once (they fall back to English). */
export function loadPack(lang: string): Promise<void> {
  const load = packLoaders[lang];
  if (!packs[lang] || !load) return Promise.resolve();
  let p = loading.get(lang);
  if (!p) {
    p = load().then(({ ui, folders }) => {
      merge(packs[lang], buildPacks({ [`/content/locales/${lang}/meta.json`]: packs[lang].meta }, ui, folders)[lang]);
    });
    loading.set(lang, p);
  }
  return p;
}
export const loadAllPacks = () => Promise.all([loadDiveStrings(), loadPastStrings(), ...Object.keys(packs).map(loadPack)]).then(() => packs);

export const languages = Object.keys(packs)
  .sort((a, b) => (a === FALLBACK ? -1 : b === FALLBACK ? 1 : a.localeCompare(b)))
  .map((code) => ({ code, ...packs[code].meta }));
export const isLang = (l: string | undefined): l is string => !!l && l in packs;

/** The string for `key` in `lang`, else English, else undefined. */
export function lookup(lang: string, key: string, from: Record<string, Pack> = packs): string | undefined {
  return from[lang]?.strings[key] ?? from[FALLBACK]?.strings[key];
}

/** The learn-more links of some content items ("scene.tcp-pieces", "layer.tcp"), item by item: each one's in `lang`,
 *  then its English ones (every language's fallback). Which of them a card shows is `pickLinks`' choice. */
export function linksOf(lang: string, items: string[], from: Record<string, Pack> = packs): LearnMore[] {
  return items.flatMap((i) => [...(from[lang]?.links[i] ?? []), ...(lang === FALLBACK ? [] : from[FALLBACK]?.links[i] ?? [])]);
}

/** Level-aware: `key.<level>` in the language, then in English, then the level-less `key` (language, English). */
export function lookupLevel(lang: string, key: string, level: Level, from: Record<string, Pack> = packs): string | undefined {
  return lookup(lang, `${key}.${level}`, from) ?? lookup(lang, key, from);
}

/** The content kinds whose items may carry a block of strings for an era (#59; an era's own strings are its block). */
const ERA_BLOCKS = new Set(Object.values(NAMESPACE).filter((n) => n !== 'era' && n !== 'theme'));
/** The keys to try in an era of the past (#59), most specific first: each content key in its item's block for that era
 *  (`"1995": { … }` in the item's locale file: `scene.tcp-pieces.phone` → `scene.tcp-pieces.1995.phone`), then the
 *  key itself. Without an era, the keys as they are. */
export function withEra(keys: string[], era: string | undefined): string[] {
  if (!era) return keys;
  return keys.flatMap((k) => {
    const a = k.indexOf('.'), b = k.indexOf('.', a + 1);
    if (a < 0 || !ERA_BLOCKS.has(k.slice(0, a))) return [k];
    return [b < 0 ? `${k}.${era}` : `${k.slice(0, b)}.${era}${k.slice(b)}`, k];
  });
}

/** The first key (most specific first) that has a string. */
export function firstOf(lang: string, keys: string[], level?: Level, from: Record<string, Pack> = packs): string | undefined {
  for (const k of keys) {
    const s = level ? lookupLevel(lang, k, level, from) : lookup(lang, k, from);
    if (s !== undefined) return s;
  }
  return undefined;
}
