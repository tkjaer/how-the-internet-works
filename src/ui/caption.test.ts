// The caption's scale line (issue #20): how far, and through whose networks.
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type * as Caption from './caption';
import type * as State from '../state.svelte';
import { stubBrowser } from '../test/stub-browser';
import { resolveRoute } from '../model/resolve';

let caption: typeof Caption, state: typeof State;
const home = resolveRoute({ activity: 'watch-video', places: ['home'] });

beforeAll(async () => {
  stubBrowser();
  // the caption's doors measure their names: no canvas here, so the rough width
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '' }));
  vi.stubGlobal('document', { documentElement: {}, createElement: () => ({ getContext: () => null }) });
  // an English voice, so read aloud can be turned on
  vi.stubGlobal('speechSynthesis', { getVoices: () => [{ lang: 'en-GB', default: true, localService: true }], addEventListener: () => {}, speak: () => {}, cancel: () => {}, speaking: false });
  vi.stubGlobal('SpeechSynthesisUtterance', class {});
  await (await import('../model/strings')).loadAllPacks();
  [caption, state] = await Promise.all([import('./caption'), import('../state.svelte')]);
});

describe('caption scale tag', () => {
  const tag = (path: string[], stop: string | null = null) => caption.captionFor(home, path, stop, 'landscape').tag;

  it('says how far the whole trip goes, and how many companies carry it inside the internet', () => {
    state.setLang('en'); state.setLevel('simple');
    expect(tag([])).toBe('Your parcels travel about 231 km each way');
    expect(tag(['internet'])).toMatch(/^3 companies pass your parcels along · about 231 km$/);
  });

  it('names who runs a stop and how far from you it is; a link says how long it is', () => {
    state.setLang('en'); state.setLevel('simple');
    expect(tag(['internet'], 'border')).toBe('Your internet company · 230 km from you');
    expect(tag(['internet'], 'border-ixp')).toBe('About 200 m long');
    expect(tag(['internet'], 'transit')).toBe('A big carrier');
  });

  it('gives Technical readers the light time and the AS, in their language', () => {
    state.setLang('da'); state.setLevel('technical');
    expect(tag(['internet'], 'border')).toBe('Din udbyder · AS64500 · 230 km henne ad vejen · lys: 1,2 ms');
    state.setLang('en'); state.setLevel('simple');
  });

  it('tells a stretch of several links how long it is; a single link, like the cross-connect into the exchange, has no count', () => {
    state.setLang('en'); state.setLevel('simple');
    const dive = (step: string) => caption.captionFor(home, ['internet', step], null, 'landscape');
    // the PON: from the house through the splitter to the OLT
    expect(dive('home-cabinet')).toMatchObject({ title: 'Light shared by your street', tag: '2 stretches · via Street cabinet · 7.2 km' });
    expect(dive('olt-bng')).toMatchObject({ tag: undefined });
    // the backbone and the undersea cable are a link each (#39)
    expect(dive('bng-core')).toMatchObject({ title: 'Light on the motorway', tag: undefined });
    expect(dive('core-border')).toMatchObject({ title: 'Light under the sea', tag: undefined });
    expect(dive('border-ixp')).toMatchObject({ title: 'Across the hall', tag: undefined });
  });

  it('links to what the owner is, at a stop it runs', () => {
    state.setLang('en'); state.setLevel('technical');
    const urls = caption.captionFor(home, ['internet'], 'core', 'landscape').links.map((l) => l.url);
    expect(urls).toContain('https://en.wikipedia.org/wiki/Autonomous_system_(Internet)');
    state.setLevel('simple');
  });
});

describe('caption fold', () => {
  it('folds to a pill on a short landscape screen, to a card on a portrait phone, not at all on a big screen', () => {
    expect(caption.captionFold(844, 390)).toBe('pill');
    expect(caption.captionFold(390, 844)).toBe('card');
    expect(caption.captionFold(360, 740)).toBe('card');
    expect(caption.captionFold(1440, 900)).toBe(null);
    expect(caption.captionFold(820, 1180)).toBe(null);
  });
});

describe('the time machine chip (#59)', () => {
  it('shows on every overview: the year in an older era, none in the newest (and places without an era are today’s); nowhere else', () => {
    const at = (place: string, path: string[] = []) => caption.timeChip(resolveRoute({ activity: 'watch-video', places: [place] }), path);
    expect(at('home')).toEqual({ year: null });
    expect(at('home-fttb')).toEqual({ year: null });
    expect(at('home-dsl')).toEqual({ year: 2010 });
    expect(at('home-dialup')).toEqual({ year: 1995 });
    expect(at('on-the-go')).toEqual({ year: null });
    expect(at('desk')).toEqual({ year: null });
    expect(at('home', ['internet'])).toBe(null);
    expect(at('on-the-go', ['internet'])).toBe(null);
  });
});

describe('counts in words', () => {
  it('picks the plural form of the language', () => {
    state.setLang('en');
    expect(state.trCount('ladder.ways', 1)).toBe('1 way down');
    expect(state.trCount('ladder.ways', 4)).toBe('4 ways down');
    state.setLang('da');
    expect(state.trCount('ladder.ways', 1)).toBe('1 vej ned');
    expect(state.trCount('ladder.ways', 4)).toBe('4 veje ned');
    state.setLang('en');
  });
});

describe('caption hints', () => {
  it('name the keys after a key and the gestures after a tap, in every kind of scene and stop (#53)', () => {
    state.setLang('en'); state.setLevel('simple');
    const at: [string[], string | null][] = [[[], null], [[], 'phone-ap'], [[], 'ap'], [[], 'internet'], [['internet'], null], [['phone-ap'], null], [['router~ip'], null]];
    const hints = (keys: boolean) => { state.view.keys = keys; return at.map(([p, s]) => caption.captionFor(home, p, s, 'landscape').hint!); };
    const taps = hints(false), keys = hints(true);
    state.view.keys = false;
    // the overview has no gesture hint: "What can I explore?" says what there is to tap (#122)
    expect(taps[0]).toBe('');
    expect(keys[0]).toMatch(/^Tab into the picture/);
    expect(new Set(taps).size).toBe(at.length);
    keys.forEach((k, i) => {
      expect(k).not.toMatch(/^hint\.|Tap|Swipe|Pinch/);
      expect(k).not.toBe(taps[i]);
      // and C, which folds the caption away (#168), as its own sentence
      expect(k).toMatch(/[.!?] C folds the text away\.$/);
    });
  });
});

describe('a group scene\'s hint (#90)', () => {
  it('says a tap reads a box out only while read aloud is on, with a voice for the language', () => {
    state.setLang('en'); state.setLevel('simple');
    const hint = () => caption.captionFor(home, ['internet'], null, 'landscape').hint;
    expect(state.settings.speech).toBe(false);
    expect(hint()).toBe('Tap a box to see what it does. Swipe to walk along.');
    state.settings.speech = true;
    expect(hint()).toBe('Tap a box to hear what it does. Swipe to walk along.');
    state.view.keys = true;
    expect(hint()).toMatch(/^The arrow keys/);
    state.view.keys = false;
    // only an English voice here
    state.setLang('da');
    expect(hint()).toBe('Tryk på en boks for at se, hvad den gør. Swipe for at gå videre.');
    state.settings.speech = false;
    state.setLang('en');
  });
});

describe('caption notes', () => {
  const notes = (path: string[], stop: string | null = null) => caption.captionFor(home, path, stop, 'landscape').notes;

  it("gives Technical readers a dive's extra, for its technology or for the layer (#31); Simple readers get none", () => {
    state.setLang('en'); state.setLevel('technical');
    expect(notes(['phone-ap'])).toEqual([{ kind: 'extra', text: expect.stringMatching(/^Wi-Fi 7 \(802\.11be\)/) }]);
    expect(notes(['ap-router'])).toEqual([{ kind: 'extra', text: expect.stringMatching(/^Power over Ethernet/) }]);
    expect(notes(['ap~wifi'])).toEqual([{ kind: 'extra', text: expect.stringMatching(/multi-link device \(MLD\)/) }]);
    expect(notes(['router-internet'])).toEqual([{ kind: 'extra', text: expect.stringMatching(/^Two generations on one thread: the older GPON/) }]);
    // the other links in glass have none: the extra is the shared street's
    expect(notes(['internet', 'bng-core'])).toEqual([]);
    state.setLevel('simple');
    expect(notes(['phone-ap'])).toEqual([]);
  });
});

describe('a layer dive\'s words (#132)', () => {
  const body = (path: string[]) => caption.captionFor(home, path, null, 'landscape').body;

  it('names who wrote the frame and the next hop a router asks for, not the client’s address', () => {
    state.setLang('en'); state.setLevel('simple');
    expect(body(['router~ethernet'])).toContain('“Who has ISP gateway’s address?”');
    expect(body(['ap~ethernet'])).toContain('from Home router');
    state.setLevel('technical');
    expect(body(['router~ethernet'])).toContain('next hop on the outgoing link (ISP gateway)');
    expect(body(['ap~ethernet'])).toContain('(here Home router and your phone)');
    state.setLevel('simple');
  });
});
