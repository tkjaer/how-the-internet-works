// The two levels are "Simple" and "Technical" to readers (#141), and `simple` and `technical` everywhere else: in the
// URL, in storage, in content and in code (#196). The old `kid` and `nerd` are gone.
import { describe, expect, it, vi } from 'vitest';
import type * as State from './state.svelte';
import { stubBrowser } from './test/stub-browser';

const locales = import.meta.glob<unknown>(['/content/locales/*/*.json', '/content/**/locales/*.json'], { eager: true, import: 'default' });

/** Every string a reader may see, with where it is; of a learn-more link only its `title` is. */
function* strings(o: unknown, at: string): Generator<[string, string]> {
  if (typeof o === 'string') yield [at, o];
  else if (o && typeof o === 'object')
    for (const [k, v] of Object.entries(o)) {
      if (/ › learnMore › \d+$/.test(at) && k !== 'title') continue;
      yield* strings(v, `${at} › ${k}`);
    }
}

describe('the levels, as readers see them (#141)', () => {
  it('are called Simple and Technical, Enkel and Teknisk, Einfach and Technisch', () => {
    const ui = (lang: string) => locales[`/content/locales/${lang}/ui.json`] as Record<string, string>;
    expect([ui('en')['mode.simple'], ui('en')['mode.technical']]).toEqual(['Simple', 'Technical']);
    expect([ui('da')['mode.simple'], ui('da')['mode.technical']]).toEqual(['Enkel', 'Teknisk']);
    expect([ui('de')['mode.simple'], ui('de')['mode.technical']]).toEqual(['Einfach', 'Technisch']);
  });

  it('are never "for kids" or "for nerds" in any string, in any language', () => {
    const old = /\b(for|til) (kids|nerds|børn|nørder)\b|\b(kid|nerd|børne|nørd)[- ]?(level|mode|niveau|tilstand)\b|^(kid|nerd|barn|nørd)$/i;
    const bad = Object.entries(locales).flatMap(([file, json]) => [...strings(json, file)].filter(([, s]) => old.test(s.trim())));
    expect(bad).toEqual([]);
  });
});

describe('the level in the URL and in storage (#141, #196)', () => {
  /** The app's state as it starts, with `?<query>` and what `localStorage` had. */
  async function start(query: string, stored: Record<string, string> = {}) {
    vi.resetModules();
    stubBrowser();
    const store = new Map(Object.entries(stored));
    vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) });
    (location as unknown as URL).search = query;
    const state: typeof State = await import('./state.svelte');
    return { state, store };
  }

  it('reads ?level=technical and ?level=simple, and stores the level by that name', async () => {
    let { state, store } = await start('?level=technical');
    expect(state.loc.level).toBe('technical');
    expect(store.get('level')).toBe('technical');
    state.setLevel('simple');
    expect(store.get('level')).toBe('simple');
    ({ state, store } = await start('?level=simple', { level: 'technical' }));
    expect(state.loc.level).toBe('simple');
    expect(store.get('level')).toBe('simple');
  });

  it('starts at the stored level', async () => {
    expect((await start('', { level: 'technical' })).state.loc.level).toBe('technical');
    expect((await start('', { level: 'simple' })).state.loc.level).toBe('simple');
  });

  it('knows the old names no more: ?level=nerd and a stored `nerd` start at Simple', async () => {
    const { state, store } = await start('?level=nerd', { level: 'nerd' });
    expect(state.loc.level).toBe('simple');
    expect(store.get('level')).toBe('nerd');
  });
});
