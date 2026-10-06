// Counting visits (docs/privacy.md): only on the published site, never when the browser asks not to be tracked or the
// reader turned it off, with nothing but the language, and never able to break the app.
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { stubBrowser } from './test/stub-browser';

const SITE = 'https://tkjaer.github.io/how-the-internet-works/', STATS = 'https://stats.irq.dk/how-the-internet-works/count';

/** Load the module afresh with this page address, stored choice, browser signals and build settings. */
async function load(o: { href?: string; stored?: Record<string, string>; nav?: object; win?: object; env?: Record<string, string> } = {}) {
  vi.resetModules();
  stubBrowser();
  const store = new Map(Object.entries(o.stored ?? {}));
  vi.stubGlobal('location', new URL(o.href ?? `${SITE}#/da`));
  vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) });
  vi.stubGlobal('navigator', { language: 'en', ...o.nav });
  vi.stubGlobal('window', { addEventListener: () => {}, ...o.win });
  vi.stubEnv('VITE_SITE_URL', SITE);
  vi.stubEnv('VITE_STATS_URL', STATS);
  for (const [k, v] of Object.entries(o.env ?? {})) vi.stubEnv(k, v);
  const fetch = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })));
  vi.stubGlobal('fetch', fetch);
  vi.stubGlobal('requestIdleCallback', (f: () => void) => f());
  return { count: await import('./count.svelte'), fetch, store };
}

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('the counted site', () => {
  it("is the published address, the same as .env's VITE_SITE_URL", async () => {
    const { count } = await load();
    expect(count.COUNTED_SITE).toBe(SITE);
    expect(readFileSync('.env', 'utf8')).toContain(`\nVITE_SITE_URL=${SITE}\n`);
  });
});

describe('countUrl', () => {
  const base = { endpoint: STATS, site: SITE, href: `${SITE}?style=storybook#/da/home`, lang: 'da', off: false, dnt: false };
  it('sends only the language', async () => {
    const { count } = await load();
    expect(count.countUrl(base)).toBe(`${STATS}?lang=da`);
  });
  it('counts nothing off the published site, without an endpoint, opted out or under DNT/GPC', async () => {
    const { count } = await load();
    for (const href of ['http://localhost:5173/#/da', 'http://localhost/how-the-internet-works/', 'https://someone.github.io/how-the-internet-works/',
      `${SITE}copy/#/da`, 'https://tkjaer.github.io/how-the-internet-works-copy/', 'http://tkjaer.github.io/how-the-internet-works/', 'not a url'])
      expect(count.countUrl({ ...base, href })).toBeNull();
    expect(count.countUrl({ ...base, endpoint: '' })).toBeNull();
    expect(count.countUrl({ ...base, site: '' })).toBeNull();
    expect(count.countUrl({ ...base, off: true })).toBeNull();
    expect(count.countUrl({ ...base, dnt: true })).toBeNull();
  });
  it('escapes the language', async () => {
    const { count } = await load();
    expect(count.countUrl({ ...base, lang: 'x&y=1' })).toBe(`${STATS}?lang=x%26y%3D1`);
  });
  it('counts the site itself, with any query or hash, its index.html, and a site address without the last slash', async () => {
    const { count } = await load();
    for (const href of [SITE, `${SITE}#/en`, `${SITE}?level=technical#/da/home`, `${SITE}index.html#/da`])
      expect(count.countUrl({ ...base, href })).toBe(`${STATS}?lang=da`);
    expect(count.countUrl({ ...base, site: SITE.slice(0, -1) })).toBe(`${STATS}?lang=da`);
    expect(count.countUrl({ ...base, site: SITE.slice(0, -1), href: 'https://tkjaer.github.io/how-the-internet-works-copy/' })).toBeNull();
  });
});

describe('doNotTrack', () => {
  it('heeds Global Privacy Control and every spelling of Do Not Track', async () => {
    const { count } = await load();
    expect(count.doNotTrack({}, {})).toBe(false);
    expect(count.doNotTrack({ doNotTrack: '0' }, {})).toBe(false);
    expect(count.doNotTrack({ doNotTrack: 'unspecified' }, {})).toBe(false);
    expect(count.doNotTrack({ globalPrivacyControl: true }, {})).toBe(true);
    expect(count.doNotTrack({ doNotTrack: '1' }, {})).toBe(true);
    expect(count.doNotTrack({ doNotTrack: 'yes' }, {})).toBe(true);
    expect(count.doNotTrack({ msDoNotTrack: '1' }, {})).toBe(true);
    expect(count.doNotTrack({}, { doNotTrack: '1' })).toBe(true);
  });
});

describe('countVisit', () => {
  it('sends one anonymous request with the language, no credentials and no referrer', async () => {
    const { count, fetch } = await load();
    count.countVisit('da');
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith(`${STATS}?lang=da`,
      { mode: 'no-cors', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', keepalive: true });
  });
  it('waits for the page to be idle, or a moment where there is no requestIdleCallback', async () => {
    const { count, fetch } = await load();
    vi.stubGlobal('requestIdleCallback', undefined);
    vi.useFakeTimers();
    try {
      count.countVisit('en');
      expect(fetch).not.toHaveBeenCalled();
      vi.advanceTimersByTime(2000);
      expect(fetch).toHaveBeenCalledOnce();
    } finally { vi.useRealTimers(); }
  });
  it('sends nothing when the browser asks not to be tracked', async () => {
    for (const o of [{ nav: { globalPrivacyControl: true } }, { nav: { doNotTrack: '1' } }, { win: { doNotTrack: '1' } }]) {
      const { count, fetch } = await load(o);
      count.countVisit('da');
      expect(fetch).not.toHaveBeenCalled();
    }
  });
  it('sends nothing in dev or on another address, or when the build has no endpoint', async () => {
    const fork = 'https://fork.example/how-the-internet-works/';
    const cases: { href?: string; env?: Record<string, string> }[] =
      [{ href: 'http://localhost:5173/#/da' }, { href: fork }, { href: fork, env: { VITE_SITE_URL: fork } }, { env: { VITE_STATS_URL: '' } }];
    for (const o of cases) {
      const { count, fetch } = await load(o);
      count.countVisit('da');
      expect(fetch).not.toHaveBeenCalled();
    }
  });
  it('is never thrown into the app: a failed or throwing fetch is swallowed', async () => {
    const { count, fetch } = await load();
    fetch.mockImplementationOnce(() => Promise.reject(new TypeError('certificate')));
    expect(() => count.countVisit('da')).not.toThrow();
    fetch.mockImplementationOnce(() => { throw new Error('blocked'); });
    expect(() => count.countVisit('da')).not.toThrow();
    await Promise.resolve();
  });
});

describe('the switch in About', () => {
  it('is on by default; off is remembered and stops counting; on forgets it', async () => {
    const { count, fetch, store } = await load();
    expect(count.counting.on).toBe(true);
    count.setCounting(false);
    expect(store.get(count.COUNT_KEY)).toBe('off');
    count.countVisit('da');
    expect(fetch).not.toHaveBeenCalled();
    count.setCounting(true);
    expect(store.has(count.COUNT_KEY)).toBe(false);
  });
  it('starts off when the reader turned it off before', async () => {
    const { count, fetch } = await load({ stored: { count: 'off' } });
    expect(count.counting.on).toBe(false);
    count.countVisit('da');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('turning it off while the count waits for the page to be idle stops this load\'s count too', async () => {
    const { count, fetch } = await load();
    let idle = () => {};
    vi.stubGlobal('requestIdleCallback', (f: () => void) => { idle = f; });
    count.countVisit('da');
    count.setCounting(false);
    idle();
    expect(fetch).not.toHaveBeenCalled();
  });
});
