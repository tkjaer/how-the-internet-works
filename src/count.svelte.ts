// Counting visits (docs/privacy.md): once per page load, when the page has settled, one request to the author's own
// stats server with the language the app opened in, and nothing else: no cookie, no id, no device details, no
// referrer. Never when the browser asks not to be tracked (Global Privacy Control, Do Not Track), when the reader turned
// it off in About, or when the page isn't the published site (dev, previews, forks, copies). The answer is never read
// and any failure (the server down, a broken certificate, a blocker) is silent.

/** The `localStorage` key that remembers the reader turned counting off (`off`); removed when they turn it back on. */
export const COUNT_KEY = 'count';

type Nav = { globalPrivacyControl?: boolean; doNotTrack?: string | null; msDoNotTrack?: string | null };
type Win = { doNotTrack?: string | null };

/** The browser asks sites not to track: Global Privacy Control, or Do Not Track in any of its spellings. */
export function doNotTrack(nav: Nav | undefined = globalThis.navigator, win: Win | undefined = globalThis.window as Win | undefined): boolean {
  if (nav?.globalPrivacyControl === true) return true;
  return [nav?.doNotTrack, nav?.msDoNotTrack, win?.doNotTrack].some((v) => v === '1' || v === 'yes');
}

/** The page is the published site itself: the same origin and the site's own path (or its index.html), whatever the
 *  query and hash. Not a copy in a folder below it, nor a path that merely starts the same. */
export function onSite(href: string, site: string): boolean {
  try {
    const page = new URL(href), home = new URL(site);
    const dir = home.pathname.endsWith('/') ? home.pathname : `${home.pathname}/`;
    return page.origin === home.origin && (page.pathname === dir || page.pathname === `${dir}index.html`);
  } catch { return false; }
}

/** Where to send this load's count, or null when it isn't counted. `endpoint` and `site` come from the build (.env):
 *  empty in either means no counting; `href` must be the published site. */
export function countUrl(o: { endpoint: string; site: string; href: string; lang: string; off: boolean; dnt: boolean }): string | null {
  if (!o.endpoint || !o.site || o.off || o.dnt || !onSite(o.href, o.site)) return null;
  return `${o.endpoint}?lang=${encodeURIComponent(o.lang)}`;
}

/** Whether this browser's visits are counted: the reader's switch in About (on unless turned off). Reactive. */
export const counting = $state({ on: localStorage.getItem(COUNT_KEY) !== 'off' });

export function setCounting(on: boolean) {
  counting.on = on;
  if (on) localStorage.removeItem(COUNT_KEY);
  else localStorage.setItem(COUNT_KEY, 'off');
}

/** Send the count for this load in `lang`, once the page is idle, unless counting was turned off by then. Fire and forget: nothing waits on it, and nothing
 *  it does can throw into the app. */
export function countVisit(lang: string) {
  try {
    const url = countUrl({
      endpoint: import.meta.env.VITE_STATS_URL ?? '', site: import.meta.env.VITE_SITE_URL ?? '', href: location.href, lang,
      off: !counting.on, dnt: doNotTrack(),
    });
    if (!url) return;
    const send = () => {
      try {
        // The reader may have turned it off (or the browser's signal changed) while this waited.
        if (!counting.on || doNotTrack()) return;
        fetch(url, { mode: 'no-cors', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', keepalive: true })
          .catch(() => {});
      } catch { /* never let counting break the app */ }
    };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(send, { timeout: 5000 });
    else setTimeout(send, 2000);
  } catch { /* never let counting break the app */ }
}
