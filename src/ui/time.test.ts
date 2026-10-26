// The time machine's words (#59): why a trip in time goes somewhere else, and what is said on landing.
import { beforeAll, describe, expect, it } from 'vitest';
import type * as State from '../state.svelte';
import type * as Time from './time';
import { eraStops } from '../model/era';
import { stubBrowser } from '../test/stub-browser';

let time: typeof Time, state: typeof State;
beforeAll(async () => {
  stubBrowser();
  await (await import('../model/strings')).loadAllPacks();
  [time, state] = await Promise.all([import('./time'), import('../state.svelte')]);
});
// `among`: the places an activity allows; leave out the street's 1995 (#147) to reach a place with no member in an era
const stop = (from: string, era: string, among?: string[]) => eraStops(from, among).find((s) => s.era === era)!;
const NO_GSM = ['home', 'home-dialup', 'on-the-go', 'on-the-go-2010'];

describe('the time machine’s words', () => {
  it('says where you would have been instead, where the place has no member in the era', () => {
    state.setLang('en');
    for (const level of ['simple', 'technical'] as const) {
      state.setLevel(level);
      expect(time.elsewhere(stop('on-the-go', '1995', NO_GSM))).toBe('In 1995 you’d have done this at home. You’ll travel there.');
      expect(time.elsewhere(stop('home', '1995'))).toBe('');
    }
    state.setLevel('simple');
  });

  it('goes to the street’s own 1995, a laptop on a GSM call, with nothing to explain (#147)', () => {
    state.setLang('en');
    for (const level of ['simple', 'technical'] as const) {
      state.setLevel(level);
      expect(stop('on-the-go', '1995')).toMatchObject({ place: 'on-the-go-1995', instead: false });
      expect(time.elsewhere(stop('on-the-go', '1995'))).toBe('');
      expect(time.landing(stop('on-the-go', '1995'))).toBe('It’s 1995.');
    }
    state.setLevel('simple');
  });

  it('goes from the desk to the PC at home in 1995 with nothing to explain: the desk is a way online from home (#151)', () => {
    state.setLang('en');
    for (const level of ['simple', 'technical'] as const) {
      state.setLevel(level);
      expect(time.elsewhere(stop('desk', '1995'))).toBe('');
      expect(time.landing(stop('desk', '1995'))).toBe('It’s 1995.');
    }
    state.setLevel('simple');
  });

  it('leaves out “You’ll travel there” where you are there already (the picker, in the era’s own trip)', () => {
    state.setLang('en'); state.setLevel('simple');
    expect(time.elsewhere(stop('on-the-go', '1995', NO_GSM), false)).toBe('In 1995 you’d have done this at home.');
  });

  it('goes to the street’s and the desk’s own 2010, with nothing to explain (#113)', () => {
    state.setLang('en'); state.setLevel('simple');
    expect(time.elsewhere(stop('on-the-go', '2010'))).toBe('');
    expect(time.elsewhere(stop('desk', '2010'))).toBe('');
    expect(time.landing(stop('on-the-go', '2010'))).toBe('It’s 2010.');
    expect(time.landing(stop('on-the-go-2010', 'today'))).toBe('Back to today.');
  });

  it('tells each era as it was where its stop is: the street’s GSM and 3G, the desk’s cable, else the era’s home', () => {
    state.setLang('en'); state.setLevel('simple');
    expect(time.eraText(stop('on-the-go', '2010'))).toMatch(/over 3G/);
    expect(time.eraText(stop('on-the-go', '2010'), '.describe')).toMatch(/^A phone with one round button/);
    expect(time.eraText(stop('desk', '2010'))).toMatch(/a cable ran from the laptop/);
    expect(time.eraText(stop('home', '2010'))).toMatch(/sent Wi‑Fi to every room/);
    expect(time.eraText(stop('on-the-go', '1995'))).toMatch(/a laptop with a cable to a mobile phone/);
    expect(time.eraText(stop('on-the-go', '1995'), '.describe')).toMatch(/^A thick laptop/);
    // the era's own trip, where the place has none then: the era's words
    expect(time.eraText(stop('on-the-go', '1995', NO_GSM))).toBe(time.eraText(stop('home', '1995')));
    expect(time.eraText(stop('on-the-go', 'today'))).toMatch(/5G/);
    // only the picture differs at the desk today
    expect(time.eraText(stop('desk', 'today'))).toBe(time.eraText(stop('home', 'today')));
    expect(time.eraText(stop('desk', 'today'), '.describe')).toMatch(/^A laptop on the desk/);
    state.setLang('da'); state.setLevel('technical');
    expect(time.eraText(stop('on-the-go', '2010'))).toMatch(/^3G med HSPA/);
    expect(time.eraText(stop('on-the-go', '1995'))).toMatch(/^GSM/);
    state.setLang('en'); state.setLevel('simple');
  });

  it('says the era first on landing, and why you are somewhere else', () => {
    state.setLang('en');
    expect(time.landing(stop('home', '1995'))).toBe('It’s 1995.');
    expect(time.landing(stop('home-dialup', 'today'))).toBe('Back to today.');
    expect(time.landing(stop('on-the-go', '1995', NO_GSM))).toBe('It’s 1995. In 1995 you’d have done this at home.');
    state.setLang('da');
    expect(time.landing(stop('on-the-go', '1995', NO_GSM))).toBe('Nu er det 1995. I 1995 havde du gjort det derhjemme.');
    state.setLang('en');
  });
});
