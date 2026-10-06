// Right-to-left support stays in the engine, driven by a language's meta.json, though the shipped languages (en, da, de)
// are all left-to-right. A made-up RTL language, only for this test, keeps that support from rotting.
import { beforeAll, describe, expect, it } from 'vitest';
import type { Pack } from './model/strings';
import type * as Strings from './model/strings';
import type * as State from './state.svelte';
import { stubBrowser } from './test/stub-browser';

const RTL = 'x-rtl';
const fixture: Pack = { meta: { name: 'Test RTL', dir: 'rtl' }, strings: { 'node.phone.name': 'enohP' } };
let strings: typeof Strings;
let state: typeof State;

beforeAll(async () => {
  stubBrowser();
  strings = await import('./model/strings');
  strings.packs[RTL] = fixture;
  state = await import('./state.svelte');
});

describe('right-to-left languages', () => {
  it('accepts rtl in a locale meta', async () => {
    const { localeMeta } = await import('./model/schema');
    expect(localeMeta.parse(fixture.meta).dir).toBe('rtl');
  });
  it('sets the document direction from the language, and back', () => {
    state.setLang(RTL);
    expect([document.documentElement.lang, document.documentElement.dir]).toEqual([RTL, 'rtl']);
    state.setLang('en');
    expect([document.documentElement.lang, document.documentElement.dir]).toEqual(['en', 'ltr']);
  });
  it('sets the direction each shipped language declares', () => {
    const shipped = Object.entries(strings.packs).filter(([code]) => code !== RTL);
    expect(shipped.map(([code]) => code)).toEqual(expect.arrayContaining(['en', 'da', 'de']));
    for (const [code, { meta }] of shipped) {
      state.setLang(code);
      expect([document.documentElement.lang, document.documentElement.dir]).toEqual([code, meta.dir]);
    }
    state.setLang('en');
  });
  it('uses its own strings and falls back to English per string', () => {
    state.setLang(RTL);
    expect(state.tr('node.phone.name')).toBe('enohP');
    expect(state.tr('node.router.name')).toBe('Home router');
    state.setLang('en');
  });
  it('is a language in URLs', async () => {
    const { parseHash } = await import('./model/location');
    expect(parseHash(`#/${RTL}/home/watch-video`).lang).toBe(RTL);
  });
});
